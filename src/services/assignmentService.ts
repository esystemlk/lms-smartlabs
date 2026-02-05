import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { Assignment, AssignmentSubmission } from "@/lib/types";

export const assignmentService = {
  // Get assignments for a specific course
  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    const q = query(
      collection(db, "assignments"), 
      where("courseId", "==", courseId),
      orderBy("dueDate", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
  },

  // Get assignments for a specific batch (or all general course assignments)
  async getAssignmentsForStudent(courseIds: string[], batchIds: string[]): Promise<Assignment[]> {
    // Note: Firestore 'in' query supports up to 10 values. 
    // If courseIds > 10, we might need multiple queries. 
    // For now assuming < 10 active courses.
    if (courseIds.length === 0) return [];

    // Simple approach: get all assignments for enrolled courses
    // Then filter in memory for batchId match (if assignment is batch-specific)
    const q = query(
      collection(db, "assignments"),
      where("courseId", "in", courseIds.slice(0, 10))
    );
    
    const snapshot = await getDocs(q);
    let assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
    
    // Filter: if assignment has batchId, user must be in that batch
    assignments = assignments.filter(a => {
      if (!a.batchId) return true; // Available to all batches
      return batchIds.includes(a.batchId);
    });

    // Sort by due date
    return assignments.sort((a, b) => {
      const dateA = a.dueDate?.seconds || 0;
      const dateB = b.dueDate?.seconds || 0;
      return dateA - dateB;
    });
  },

  // Submit an assignment
  async submitAssignment(
    assignmentId: string, 
    studentId: string, 
    studentName: string, 
    content?: string, 
    attachments?: { name: string; url: string }[]
  ) {
    const submissionRef = doc(db, "assignments", assignmentId, "submissions", studentId);
    
    const data: Record<string, unknown> = {
      assignmentId,
      studentId,
      studentName,
      submittedAt: serverTimestamp(),
      status: 'submitted'
    };

    if (content) data.content = content;
    if (attachments) data.attachments = attachments;

    await setDoc(submissionRef, data, { merge: true });
  },

  // Get a student's submission
  async getSubmission(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    const docRef = doc(db, "assignments", assignmentId, "submissions", studentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as AssignmentSubmission;
    }
    return null;
  }
};
