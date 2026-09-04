import { 
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
  query, 
  orderBy, 
  serverTimestamp,
  limit 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationType = 'system' | 'maintenance' | 'course_material' | 'assignment' | 'general';

// Visual severity used by the announcement banners
export type NotificationPriority = 'info' | 'success' | 'warning' | 'critical';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority; // Controls banner colour/urgency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any; // Using any to support both Timestamp and serialized dates
  createdBy?: string; // Admin/Dev ID
  targetRoles?: string[]; // e.g. ['student', 'lecturer']
  link?: string; // Optional link to resource
  pinned?: boolean; // If true, shows as a dismissible banner at the top of the app
  active?: boolean; // If false, hidden from students (soft-disable without deleting)
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

  // Active, role-targeted announcements pinned to show as top banners.
  // Filtering by role is done client-side to avoid composite indexes.
  async getActiveAnnouncements(role?: string, limitCount = 5) {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const snapshot = await getDocs(q);
    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    return all
      .filter(n => n.pinned === true && n.active !== false)
      .filter(n => {
        if (!n.targetRoles || n.targetRoles.length === 0) return true;
        if (!role) return true;
        return n.targetRoles.includes(role);
      })
      .slice(0, limitCount);
  },

  async createNotification(notification: Partial<Notification>) {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      ...notification,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateNotification(id: string, data: Partial<Notification>) {
    await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, id), data);
  },

  async deleteNotification(id: string) {
    await deleteDoc(doc(db, NOTIFICATIONS_COLLECTION, id));
  }
};
