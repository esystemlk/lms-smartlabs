import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
  Timestamp,
  arrayUnion
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { Enrollment, Course, Batch } from "@/lib/types";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addMonths } from "date-fns";

const ENROLLMENTS_COLLECTION = "enrollments";
const USERS_COLLECTION = "users";
const COURSES_COLLECTION = "courses";
const BATCHES_COLLECTION = "batches";

export const enrollmentService = {
  // Create a new enrollment (Pending or Active)
  async createEnrollment(
    userId: string,
    userEmail: string,
    userName: string,
    course: Course, 
    batch: Batch,
    paymentMethod: 'card' | 'transfer',
    amount: number,
    receiptFile?: File
  ) {
    let receiptUrl = "";
    if (paymentMethod === 'transfer' && receiptFile) {
      const storageRef = ref(storage, `receipts/${userId}/${Date.now()}_${receiptFile.name}`);
      const snapshot = await uploadBytes(storageRef, receiptFile);
      receiptUrl = await getDownloadURL(snapshot.ref);
    }

    // Check Prerequisites
    if (course.prerequisites && course.prerequisites.length > 0) {
      const userEnrollments = await enrollmentService.getUserEnrollments(userId);
      const completedCourseIds = userEnrollments
        .filter(e => e.status === 'completed' || (e.progress === 100))
        .map(e => e.courseId);

      const hasAllPrerequisites = course.prerequisites.every(prereqId => 
        completedCourseIds.includes(prereqId)
      );

      if (!hasAllPrerequisites) {
        throw new Error("You have not completed the prerequisite courses for this course.");
      }
    }

    const status = paymentMethod === 'card' ? 'active' : 'pending';
    
    // Calculate validity if active immediately
    let validUntil = null;
    if (status === 'active' && course.resourceAvailabilityMonths) {
      validUntil = Timestamp.fromDate(addMonths(new Date(), course.resourceAvailabilityMonths));
    }

    const enrollmentData: Omit<Enrollment, "id"> = {
      userId,
      userEmail,
      userName,
      courseId: course.id,
      courseTitle: course.title,
      batchId: batch.id,
      batchName: batch.name,
      status,
      paymentMethod,
      paymentProofUrl: receiptUrl,
      amount,
      validUntil,
      enrolledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, ENROLLMENTS_COLLECTION), enrollmentData);

    // If active immediately (Card), update user and batch counts
    if (status === 'active') {
      const batchOp = writeBatch(db);
      
      // Update User
      const userRef = doc(db, USERS_COLLECTION, userId);
      batchOp.update(userRef, {
        enrolledBatches: arrayUnion(batch.id),
        enrolledCourses: arrayUnion(course.id)
      });

      // Update Batch Count
      const batchRef = doc(db, COURSES_COLLECTION, course.id, BATCHES_COLLECTION, batch.id);
      batchOp.update(batchRef, {
        enrolledCount: increment(1)
      });

      await batchOp.commit();
    }

    return docRef.id;
  },

  // Admin Manual/Bulk Enrollment
  async adminEnrollUser(
    userId: string,
    userEmail: string,
    userName: string,
    course: Course, 
    batch: Batch
  ) {
    // Check if already enrolled in this batch to prevent duplicates
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where("userId", "==", userId),
      where("batchId", "==", batch.id),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { success: false, message: "User already enrolled in this batch" };
    }

    // Calculate validity based on Course settings
    let validUntil = null;
    if (course.resourceAvailabilityMonths) {
      validUntil = Timestamp.fromDate(addMonths(new Date(), course.resourceAvailabilityMonths));
    }

    const enrollmentData: Omit<Enrollment, "id"> = {
      userId,
      userEmail,
      userName,
      courseId: course.id,
      courseTitle: course.title,
      batchId: batch.id,
      batchName: batch.name,
      status: 'active',
      paymentMethod: 'admin',
      amount: 0,
      validUntil,
      enrolledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, ENROLLMENTS_COLLECTION), enrollmentData);

    const batchOp = writeBatch(db);
    
    // Update User
    const userRef = doc(db, USERS_COLLECTION, userId);
    batchOp.update(userRef, {
      enrolledBatches: arrayUnion(batch.id),
      enrolledCourses: arrayUnion(course.id)
    });

    // Update Batch Count
    const batchRef = doc(db, COURSES_COLLECTION, course.id, BATCHES_COLLECTION, batch.id);
    batchOp.update(batchRef, {
      enrolledCount: increment(1)
    });

    await batchOp.commit();
    return { success: true, enrollmentId: docRef.id };
  },

  // Get user's enrollments
  async getUserEnrollments(userId: string) {
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where("userId", "==", userId),
      orderBy("enrolledAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
  },

  // Get all enrollments (Admin - for Analytics)
  async getAllEnrollments() {
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      orderBy("enrolledAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
  },

  // Get pending enrollments (Admin)
  async getPendingEnrollments() {
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where("status", "==", "pending"),
      orderBy("enrolledAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
  },

  // Approve Enrollment (Admin)
  async approveEnrollment(enrollmentId: string) {
    const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    const enrollmentSnap = await getDoc(enrollmentRef);
    
    if (!enrollmentSnap.exists()) throw new Error("Enrollment not found");
    const enrollment = enrollmentSnap.data() as Enrollment;

    if (enrollment.status === 'active') return; // Already active

    // Calculate validity based on Course settings
    // Need to fetch course to get resourceAvailabilityMonths
    const courseRef = doc(db, COURSES_COLLECTION, enrollment.courseId);
    const courseSnap = await getDoc(courseRef);
    const course = courseSnap.data() as Course;

    let validUntil = null;
    if (course.resourceAvailabilityMonths) {
      validUntil = Timestamp.fromDate(addMonths(new Date(), course.resourceAvailabilityMonths));
    }

    const batchOp = writeBatch(db);

    // 1. Update Enrollment Status
    batchOp.update(enrollmentRef, {
      status: 'active',
      validUntil,
      updatedAt: serverTimestamp()
    });

    // 2. Update User
    const userRef = doc(db, USERS_COLLECTION, enrollment.userId);
    batchOp.update(userRef, {
      enrolledBatches: arrayUnion(enrollment.batchId),
      enrolledCourses: arrayUnion(enrollment.courseId)
    });

    // 3. Update Batch Count
    const batchRef = doc(db, COURSES_COLLECTION, enrollment.courseId, BATCHES_COLLECTION, enrollment.batchId);
    batchOp.update(batchRef, {
      enrolledCount: increment(1)
    });

    await batchOp.commit();
  },

  // Reject Enrollment (Admin)
  async rejectEnrollment(enrollmentId: string) {
    const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    await updateDoc(enrollmentRef, {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });
  },

  // Check access validity
  async checkAccess(userId: string, batchId: string): Promise<boolean> {
    // 1. Check if user has this batch in enrolledBatches (fast check)
    // This is done via Context usually, but if we need server-side verification:
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;
    
    const userData = userSnap.data();
    if (!userData.enrolledBatches?.includes(batchId)) return false;

    // 2. Check Expiry in Enrollments collection
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where("userId", "==", userId),
      where("batchId", "==", batchId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;

    const enrollment = snapshot.docs[0].data() as Enrollment;
    if (enrollment.validUntil) {
      const now = new Date();
      const expiry = enrollment.validUntil.toDate();
      if (now > expiry) return false;
    }

    return true;
  },

  // Mark Lesson as Complete
  async markLessonComplete(enrollmentId: string, lessonId: string, totalLessons: number) {
    const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    
    const enrollmentSnap = await getDoc(enrollmentRef);
    if (!enrollmentSnap.exists()) throw new Error("Enrollment not found");
    const data = enrollmentSnap.data() as Enrollment;
    
    const completed = data.completedLessonIds || [];
    
    // If already completed, do nothing but return success
    if (completed.includes(lessonId)) {
        return { success: true, progress: data.progress || 0 };
    }

    const newCompleted = [...completed, lessonId];
    // Calculate progress (capped at 100)
    const progress = Math.min(100, Math.round((newCompleted.length / totalLessons) * 100));
    
    const updates: Record<string, unknown> = {
        completedLessonIds: arrayUnion(lessonId),
        progress: progress,
        lastAccessed: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    if (progress === 100) {
        updates.status = 'completed';
    }
    
    await updateDoc(enrollmentRef, updates);
    
    return { success: true, progress };
  }
};
