import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";

export interface Exam {
  id: string;
  title: string;
  subject: string;
  date: Timestamp;
  durationMinutes: number;
  totalMarks: number;
  description?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: Timestamp;
}

const COLLECTION_NAME = "exams";

export const examService = {
  async getUpcomingExams() {
    const now = Timestamp.now();
    const q = query(
      collection(db, COLLECTION_NAME),
      where("date", ">=", now),
      orderBy("date", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Exam));
  },

  async getAllExams() {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Exam));
  },

  async createExam(data: Omit<Exam, "id" | "createdAt">) {
    return addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: serverTimestamp()
    });
  },

  async updateExam(id: string, data: Partial<Exam>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async deleteExam(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
