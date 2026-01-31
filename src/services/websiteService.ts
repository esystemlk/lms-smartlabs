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
  serverTimestamp 
} from "firebase/firestore";

export interface Website {
  id: string;
  name: string;
  url: string;
  description: string;
  category?: string;
  createdAt: any;
}

const COLLECTION_NAME = "websites";

export const websiteService = {
  async getWebsites() {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("name", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Website));
  },

  async createWebsite(data: Omit<Website, "id" | "createdAt">) {
    return addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: serverTimestamp()
    });
  },

  async updateWebsite(id: string, data: Partial<Website>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async deleteWebsite(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
