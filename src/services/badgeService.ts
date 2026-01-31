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

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: string;
  earnedAt?: Timestamp; // If specific to a user
}

const COLLECTION_NAME = "badges";

export const badgeService = {
  // Get all available badges
  async getAllBadges() {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("name", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Badge));
  },

  // In a real app, we'd have a user_badges collection. 
  // For now, let's assume we fetch all badges and check user status (mock logic for "earned" if needed, or just show all)
  async getUserBadges(userId: string) {
     // Placeholder for future implementation
     // const q = query(collection(db, "user_badges"), where("userId", "==", userId));
     return this.getAllBadges(); // Return all for now
  },

  async createBadge(data: Omit<Badge, "id" | "earnedAt">) {
    return addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      createdAt: serverTimestamp()
    });
  }
};
