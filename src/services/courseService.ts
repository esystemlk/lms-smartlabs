import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  collectionGroup
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { Course, Lesson, Batch, RecordedClass } from "@/lib/types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { notificationService } from "@/services/notificationService";

const COURSES_COLLECTION = "courses";
const LESSONS_COLLECTION = "lessons";
const BATCHES_COLLECTION = "batches";
const USERS_COLLECTION = "users";

export const courseService = {
  // User Operations
  async getLecturers() {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("role", "in", ["lecturer", "instructor", "admin", "superadmin"])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any));
  },

  // Course Operations
  async getAllCourses() {
    const q = query(collection(db, COURSES_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  },

  async getPublishedCourses() {
    const q = query(
      collection(db, COURSES_COLLECTION),
      where("published", "==", true)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Course));

    // Sort client-side to avoid composite index requirement
    return data.sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  },

  async getCourse(courseId: string) {
    const docRef = doc(db, COURSES_COLLECTION, courseId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Course;
    }
    return null;
  },

  async createCourse(courseData: Partial<Course>) {
    const docRef = await addDoc(collection(db, COURSES_COLLECTION), {
      lessonsCount: 0,
      published: false,
      ...courseData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateCourse(courseId: string, courseData: Partial<Course>) {
    const docRef = doc(db, COURSES_COLLECTION, courseId);
    await updateDoc(docRef, {
      ...courseData,
      updatedAt: serverTimestamp()
    });
  },

  async deleteCourse(courseId: string) {
    // Note: This doesn't delete sub-collections (lessons, batches) automatically in Firestore
    const docRef = doc(db, COURSES_COLLECTION, courseId);
    await deleteDoc(docRef);
  },

  // Lesson Operations
  async getLessons(courseId: string) {
    const q = query(
      collection(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Lesson));
  },

  async getLesson(courseId: string, lessonId: string) {
    const docRef = doc(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Lesson;
    }
    return null;
  },

  async addLesson(courseId: string, lessonData: Partial<Lesson>) {
    // Aggressive sanitization to prevent any undefined values from reaching Firestore
    const sanitizedData: any = {};
    Object.keys(lessonData).forEach(key => {
      const val = (lessonData as any)[key];
      if (val !== undefined) {
        sanitizedData[key] = val;
      }
    });

    const docRef = await addDoc(collection(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION), {
      ...sanitizedData,
      courseId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Update lesson count on course
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
      const courseData = courseSnap.data();
      const currentCount = courseData.lessonsCount || 0;
      await updateDoc(courseRef, { lessonsCount: currentCount + 1 });

      // Automatic Notification: New Course Material
      // Only notify if it's published and not a live class (live classes have their own schedule)
      if (lessonData.published && lessonData.type !== 'live_class') {
        try {
          await notificationService.createNotification({
            title: `New Material: ${lessonData.title}`,
            message: `New content has been added to ${courseData.title || 'your course'}. Check it out now!`,
            type: 'course_material',
            link: `/courses/${courseId}`,
            targetRoles: ['student']
          });
        } catch (error) {
          console.error("Failed to send auto-notification:", error);
        }
      }
    }

    return docRef.id;
  },

  async updateLesson(courseId: string, lessonId: string, lessonData: Partial<Lesson>) {
    const sanitizedData: any = {};
    Object.keys(lessonData).forEach(key => {
      const val = (lessonData as any)[key];
      if (val !== undefined) {
        sanitizedData[key] = val;
      }
    });

    const docRef = doc(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId);
    await updateDoc(docRef, {
      ...sanitizedData,
      updatedAt: serverTimestamp()
    });
  },

  async deleteLesson(courseId: string, lessonId: string) {
    const docRef = doc(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId);
    await deleteDoc(docRef);

    // Update lesson count
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
      const currentCount = courseSnap.data().lessonsCount || 0;
      await updateDoc(courseRef, { lessonsCount: Math.max(0, currentCount - 1) });
    }
  },

  async getUpcomingLiveClasses() {
    // Collection Group Query to find all live classes across all courses
    const q = query(
      collectionGroup(db, LESSONS_COLLECTION),
      where("type", "==", "live_class"),
      orderBy("startTime", "asc") // Sort by upcoming
    );

    try {
      const snapshot = await getDocs(q);
      const now = new Date();
      now.setHours(now.getHours() - 2); // Keep classes from last 2 hours visible

      return snapshot.docs
        .map((doc: any) => {
          const data = doc.data();
          // Ensure courseId is available (fallback to parent doc ID if missing in data)
          const courseId = data.courseId || doc.ref.parent.parent?.id;
          return { id: doc.id, ...data, courseId } as Lesson;
        })
        .filter((lesson: any) => {
          if (lesson.status === 'completed') return false;
          if (!lesson.startTime) return false;
          return new Date(lesson.startTime) > now;
        });
    } catch (error) {
      console.error("Error fetching live classes (Index might be missing):", error);
      return [];
    }
  },

  async getPastLiveClasses() {
    // Collection Group Query to find all live classes
    const q = query(
      collectionGroup(db, LESSONS_COLLECTION),
      where("type", "==", "live_class"),
      orderBy("startTime", "desc") // Sort by newest past classes
    );

    try {
      const snapshot = await getDocs(q);
      const now = new Date();
      now.setHours(now.getHours() - 2); // Classes older than 2 hours ago

      return snapshot.docs
        .map((doc: any) => {
          const data = doc.data();
          const courseId = data.courseId || doc.ref.parent.parent?.id;
          return { id: doc.id, ...data, courseId } as Lesson;
        })
        .filter((lesson: any) => {
          if (lesson.status === 'completed') return true;
          if (!lesson.startTime) return false;
          return new Date(lesson.startTime) <= now;
        });
    } catch (error) {
      console.error("Error fetching past live classes:", error);
      return [];
    }
  },

  // Batch Operations
  async getBatches(courseId: string) {
    const q = query(
      collection(db, COURSES_COLLECTION, courseId, BATCHES_COLLECTION)
      // Removing orderBy to avoid index requirement for new users
    );
    const snapshot = await getDocs(q);
    const batches = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Batch));
    
    // Sort in memory by startDate desc
    return batches.sort((a: Batch, b: Batch) => {
        const dateA = a.startDate || "";
        const dateB = b.startDate || "";
        return dateB.localeCompare(dateA);
    });
  },

  async getBatch(courseId: string, batchId: string) {
    const docRef = doc(db, COURSES_COLLECTION, courseId, BATCHES_COLLECTION, batchId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Batch;
    }
    return null;
  },

  async addBatch(courseId: string, batchData: Partial<Batch>) {
    const docRef = await addDoc(collection(db, COURSES_COLLECTION, courseId, BATCHES_COLLECTION), {
      ...batchData,
      courseId,
      enrolledCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async updateBatch(courseId: string, batchId: string, batchData: Partial<Batch>) {
    const docRef = doc(db, COURSES_COLLECTION, courseId, BATCHES_COLLECTION, batchId);
    await updateDoc(docRef, {
      ...batchData,
      updatedAt: serverTimestamp()
    });
  },

  async deleteBatch(courseId: string, batchId: string) {
    const docRef = doc(db, COURSES_COLLECTION, courseId, BATCHES_COLLECTION, batchId);
    await deleteDoc(docRef);
  },

  async addRecording(courseId: string, batchId: string, recording: RecordedClass) {
    const batchRef = doc(db, COURSES_COLLECTION, courseId, BATCHES_COLLECTION, batchId);
    
    // Sanitize recording object to remove any undefined values
    const sanitizedRecording: any = {};
    Object.keys(recording).forEach(key => {
      const val = (recording as any)[key];
      if (val !== undefined) {
        sanitizedRecording[key] = val;
      }
    });

    await updateDoc(batchRef, {
      recordedClasses: arrayUnion(sanitizedRecording),
      updatedAt: serverTimestamp()
    });
  },

  async getBatchRecordings(courseId: string, batchId: string) {
    const batch = await this.getBatch(courseId, batchId);
    return batch?.recordedClasses || [];
  },

  async getAllBatchRecordings() {
    try {
      const q = query(collectionGroup(db, BATCHES_COLLECTION));
      const snapshot = await getDocs(q);
      let allRecordings: any[] = [];
      
      snapshot.docs.forEach((docSnap: any) => {
          const data = docSnap.data();
          if (data.recordedClasses && data.recordedClasses.length > 0) {
              const courseId = data.courseId || docSnap.ref.parent.parent?.id;
              const batchRecordings = (data.recordedClasses as any[]).map((r: any) => ({
                  ...r,
                  id: r.id || `${docSnap.id}_${Math.random().toString(36).substr(2, 9)}`,
                  courseId,
                  batchIds: [docSnap.id],
                  isAttached: true,
                  // Map RecordedClass fields to Lesson fields for UI consistency
                  bunnyVideoId: r.videoUrl && !r.videoUrl.includes('http') ? r.videoUrl : (r.bunnyVideoId || ""),
                  recordingUrl: r.videoUrl && r.videoUrl.includes('http') ? r.videoUrl : (r.recordingUrl || ""),
                  startTime: r.date,
                  duration: r.durationMinutes || 60,
                  recordingStatus: 'processed'
              }));
              allRecordings = [...allRecordings, ...batchRecordings];
          }
      });
      return allRecordings;
    } catch (error) {
      console.error("Error fetching all batch recordings:", error);
      return [];
    }
  },

  async removeRecordedClassFromBatch(courseId: string, batchId: string, recordingId: string) {
    // Note: arrayRemove requires the exact object. 
    // If that's tricky, we might need to fetch, filter, and update.
    // For now, let's try arrayRemove but it might be safer to read-modify-write if objects aren't identical references.
    // A safer approach for UI removal by ID:
    const batchRef = doc(db, COURSES_COLLECTION, courseId, BATCHES_COLLECTION, batchId);
    const batchSnap = await getDoc(batchRef);
    if (batchSnap.exists()) {
      const data = batchSnap.data();
      const updatedClasses = (data.recordedClasses || []).filter((r: RecordedClass) => r.id !== recordingId);
      await updateDoc(batchRef, {
        recordedClasses: updatedClasses,
        updatedAt: serverTimestamp()
      });
    }
  },

  // Storage
  async uploadImage(file: File, path: string) {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }
};
