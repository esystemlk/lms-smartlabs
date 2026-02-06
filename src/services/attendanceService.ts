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
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AttendanceRecord, UserData, Course, Batch } from "@/lib/types";

const ATTENDANCE_COLLECTION = "attendance";

export const attendanceService = {
  // Mark attendance (auto or manual)
  async markAttendance(data: Omit<AttendanceRecord, "id" | "recordedAt">) {
    // Check for duplicate attendance for the same lesson/day if needed
    // For now, we allow multiple entries (e.g. joined morning and evening session), 
    // but typically we want unique per lesson per user.
    
    // Simple duplicate check for same lesson + user
    if (data.lessonId) {
      const q = query(
        collection(db, ATTENDANCE_COLLECTION),
        where("userId", "==", data.userId),
        where("lessonId", "==", data.lessonId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        console.log("Attendance already recorded for this lesson");
        return snapshot.docs[0].id; // Return existing ID
      }
    }

    const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), {
      ...data,
      recordedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Bulk mark attendance (for manual admin entry)
  async bulkMarkAttendance(records: Omit<AttendanceRecord, "id" | "recordedAt">[]) {
    const batch = writeBatch(db);
    
    records.forEach(record => {
      const docRef = doc(collection(db, ATTENDANCE_COLLECTION));
      batch.set(docRef, {
        ...record,
        recordedAt: serverTimestamp()
      });
    });

    await batch.commit();
  },

  // Get attendance for a course/batch
  async getAttendance(courseId: string, batchId?: string, startDate?: Date, endDate?: Date) {
    let constraints: any[] = [where("courseId", "==", courseId)];
    
    if (batchId) {
      constraints.push(where("batchId", "==", batchId));
    }

    if (startDate) {
      constraints.push(where("date", ">=", Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
      constraints.push(where("date", "<=", Timestamp.fromDate(endDate)));
    }

    const q = query(collection(db, ATTENDANCE_COLLECTION), ...constraints, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  },

  // Get specific user's attendance
  async getUserAttendance(userId: string, courseId?: string) {
    let constraints: any[] = [where("userId", "==", userId)];
    
    if (courseId) {
      constraints.push(where("courseId", "==", courseId));
    }

    const q = query(collection(db, ATTENDANCE_COLLECTION), ...constraints, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  },

  async updateAttendanceRecord(id: string, data: Partial<AttendanceRecord>) {
    const docRef = doc(db, ATTENDANCE_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      // recordedAt should probably stay as original, or maybe we track updatedAt?
      // For now let's just update the fields
    });
  },

  async deleteAttendanceRecord(id: string) {
    const docRef = doc(db, ATTENDANCE_COLLECTION, id);
    await deleteDoc(docRef);
  }
};
