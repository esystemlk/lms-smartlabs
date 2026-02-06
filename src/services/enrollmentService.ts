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
import { addMonths, parseISO, isBefore } from "date-fns";

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
    paymentMethod: 'card' | 'transfer' | 'payhere',
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

    const status = paymentMethod === 'card' ? 'active' : (paymentMethod === 'payhere' ? 'pending_payment' : 'pending');
    
    // Calculate validity if active immediately
    let validUntil = null;
    if (status === 'active') {
      let expiryDate: Date | null = null;

      // 1. Calculate based on duration (if set)
      if (course.resourceAvailabilityMonths) {
        expiryDate = addMonths(new Date(), course.resourceAvailabilityMonths);
      }

      // 2. Check fixed end date (if set)
      if (course.endDate) {
        const courseEndDate = parseISO(course.endDate);
        // If no duration set OR course end date is earlier than duration expiry
        if (!expiryDate || isBefore(courseEndDate, expiryDate)) {
          expiryDate = courseEndDate;
        }
      }

      if (expiryDate) {
        validUntil = Timestamp.fromDate(expiryDate);
      }
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
    let expiryDate: Date | null = null;

    if (course.resourceAvailabilityMonths) {
      expiryDate = addMonths(new Date(), course.resourceAvailabilityMonths);
    }

    if (course.endDate) {
      const courseEndDate = parseISO(course.endDate);
      if (!expiryDate || isBefore(courseEndDate, expiryDate)) {
        expiryDate = courseEndDate;
      }
    }

    if (expiryDate) {
      validUntil = Timestamp.fromDate(expiryDate);
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
    const enrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));

    // Lazy check for Course End Date expiry
    const activeEnrollments = enrollments.filter(e => e.status === 'active');
    
    if (activeEnrollments.length > 0) {
      const updates = [];
      const batchOp = writeBatch(db);
      let hasUpdates = false;

      // Fetch course details for active enrollments
      // Optimization: Group by courseId to avoid duplicate fetches
      const courseIds = [...new Set(activeEnrollments.map(e => e.courseId))];
      
      try {
        const courseDocs = await Promise.all(
          courseIds.map(id => getDoc(doc(db, COURSES_COLLECTION, id)))
        );
        
        const coursesMap = new Map();
        courseDocs.forEach(doc => {
          if (doc.exists()) {
            coursesMap.set(doc.id, doc.data() as Course);
          }
        });

        const now = new Date();

        for (const enrollment of activeEnrollments) {
          const course = coursesMap.get(enrollment.courseId);
          if (course?.endDate) {
            const courseEndDate = parseISO(course.endDate);
            
            // Check if course has ended
            if (isBefore(courseEndDate, now)) {
              // Mark as completed/expired
              const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollment.id);
              batchOp.update(enrollmentRef, {
                status: 'completed',
                validUntil: Timestamp.fromDate(courseEndDate), // Ensure validity matches end date
                updatedAt: serverTimestamp()
              });
              
              // Update local object
              enrollment.status = 'completed';
              enrollment.validUntil = Timestamp.fromDate(courseEndDate);
              hasUpdates = true;
            }
          }
        }

        if (hasUpdates) {
          await batchOp.commit();
        }
      } catch (error) {
        console.error("Error checking course expiry:", error);
        // Don't fail the whole request if expiry check fails
      }
    }

    return enrollments;
  },

  // Get enrollments for a specific course (Admin/Attendance)
  async getCourseEnrollments(courseId: string) {
    const q = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where("courseId", "==", courseId),
      // where("status", "==", "active"), // Should we include all or just active? 
      // User might want to mark attendance for inactive students if they showed up? 
      // Safest to filter by active/completed in UI or just fetch all.
      // Let's fetch all non-rejected.
      where("status", "in", ["active", "completed", "expired", "pending"]),
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
    let expiryDate: Date | null = null;

    if (course.resourceAvailabilityMonths) {
      expiryDate = addMonths(new Date(), course.resourceAvailabilityMonths);
    }

    if (course.endDate) {
      const courseEndDate = parseISO(course.endDate);
      if (!expiryDate || isBefore(courseEndDate, expiryDate)) {
        expiryDate = courseEndDate;
      }
    }

    if (expiryDate) {
      validUntil = Timestamp.fromDate(expiryDate);
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
