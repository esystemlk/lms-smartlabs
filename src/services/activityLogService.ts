import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { ActivityLog, UserRole } from "@/lib/types";

const COLLECTION_NAME = "activity_logs";

export const activityLogService = {
  async logActivity(
    action: string,
    details: string,
    user: { uid: string; name: string; role: UserRole },
    entity?: { id: string; type: "course" | "user" | "enrollment" | "system" | "batch" },
    metadata: Record<string, unknown> = {}
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        action,
        details,
        entityId: entity?.id || null,
        entityType: entity?.type || null,
        performedBy: user.uid,
        performedByName: user.name || "Unknown",
        performedByRole: user.role,
        createdAt: serverTimestamp(),
        metadata,
      });
      return docRef.id;
    } catch (error) {
      console.error("Error logging activity:", error);
      // Fail silently to not block main actions
      return "";
    }
  },

  async getRecentActivities(count: number = 20): Promise<ActivityLog[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy("createdAt", "desc"),
        limit(count)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
    } catch (error) {
      console.error("Error fetching activities:", error);
      return [];
    }
  }
};
