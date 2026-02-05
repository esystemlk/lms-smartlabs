import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  limit 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationType = 'system' | 'maintenance' | 'course_material' | 'assignment' | 'general';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any; // Using any to support both Timestamp and serialized dates
  createdBy?: string; // Admin/Dev ID
  targetRoles?: string[]; // e.g. ['student', 'lecturer']
  link?: string; // Optional link to resource
  isRead?: boolean; // For future user-specific tracking
}

const NOTIFICATIONS_COLLECTION = "notifications";

export const notificationService = {
  // Get all notifications (for admin/dev)
  async getAllNotifications() {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION), 
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  },

  // Get recent notifications for users (dashboard)
  async getRecentNotifications(limitCount = 5) {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  },

  async createNotification(notification: Partial<Notification>) {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notification,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async deleteNotification(id: string) {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, id));
  }
};
