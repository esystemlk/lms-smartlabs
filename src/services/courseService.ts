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
  arrayRemove,
  collectionGroup
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { Course, Lesson, Batch } from "@/lib/types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const COURSES_COLLECTION = "courses";
const LESSONS_COLLECTION = "lessons";
const BATCHES_COLLECTION = "batches";

export const courseService = {
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
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    
    // Sort client-side to avoid composite index requirement
    return courses.sort((a, b) => {
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
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
    const docRef = await addDoc(collection(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION), {
      ...lessonData,
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
    const docRef = doc(db, COURSES_COLLECTION, courseId, LESSONS_COLLECTION, lessonId);
    await updateDoc(docRef, {
      ...lessonData,
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
        .map(doc => {
          const data = doc.data();
          // Ensure courseId is available (fallback to parent doc ID if missing in data)
          const courseId = data.courseId || doc.ref.parent.parent?.id;
          return { id: doc.id, ...data, courseId } as Lesson;
        })
        .filter(lesson => {
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
        .map(doc => {
          const data = doc.data();
          const courseId = data.courseId || doc.ref.parent.parent?.id;
          return { id: doc.id, ...data, courseId } as Lesson;
        })
        .filter(lesson => {
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
      collection(db, COURSES_COLLECTION, courseId, BATCHES_COLLECTION),
      orderBy("startDate", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));
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

  async addRecording(courseId: string, batchId: string, recording: any) {
    const batchRef = doc(db, COURSES_COLLECTION, courseId, BATCHES_COLLECTION, batchId);
    await updateDoc(batchRef, {
      recordedClasses: arrayUnion(recording),
      updatedAt: serverTimestamp()
    });
  },

  async removeRecordedClassFromBatch(courseId: string, batchId: string, recording: any) {
    // Note: arrayRemove requires the exact object. 
    // If that's tricky, we might need to fetch, filter, and update.
    // For now, let's try arrayRemove but it might be safer to read-modify-write if objects aren't identical references.
    // A safer approach for UI removal by ID:
    const batchRef = doc(db, COURSES_COLLECTION, courseId, BATCHES_COLLECTION, batchId);
    const batchSnap = await getDoc(batchRef);
    if (batchSnap.exists()) {
      const data = batchSnap.data();
      const updatedClasses = (data.recordedClasses || []).filter((r: any) => r.id !== recording.id);
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
