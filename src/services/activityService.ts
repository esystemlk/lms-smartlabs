import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'hackathon' | 'workshop' | 'seminar' | 'other';
  date: Timestamp;
  status: 'upcoming' | 'ongoing' | 'completed';
  registrationUrl?: string;
  imageUrl?: string;
  createdAt: Timestamp;
}

const COLLECTION_NAME = "activities";

export const activityService = {
  async getActivities() {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("date", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Activity));
  },

  async createActivity(data: Omit<Activity, "id" | "createdAt">) {
    return addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: serverTimestamp()
    });
  },

  async updateActivity(id: string, data: Partial<Activity>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async deleteActivity(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
