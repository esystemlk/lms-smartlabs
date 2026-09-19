import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";

/**
 * Per-user usage/analytics stored in `user_usage/{uid}`.
 *
 * - `lmsTimeSeconds`      total active time spent anywhere in the LMS (admin-only)
 * - `recordingWatchSeconds` total time actively watching recordings (student + admin)
 * - `watchByClass`        per-recording watch time in seconds (admin breakdown)
 *
 * Time is only ever accumulated while the tab is visible/focused, and (for
 * recordings) while the video is actually playing, so the numbers reflect real
 * engagement rather than idle open tabs.
 */
export interface UserUsage {
  uid: string;
  name?: string;
  email?: string;
  lmsTimeSeconds: number;
  recordingWatchSeconds: number;
  watchByClass?: Record<string, number>;
  lastActive?: any;
  updatedAt?: any;
}

const COLLECTION = "user_usage";

export const usageService = {
  /** Accumulate general active time on the LMS for a user. */
  async addLmsTime(
    uid: string,
    seconds: number,
    profile?: { name?: string; email?: string }
  ): Promise<void> {
    if (!uid || seconds <= 0) return;
    try {
      await setDoc(
        doc(db, COLLECTION, uid),
        {
          uid,
          ...(profile?.name ? { name: profile.name } : {}),
          ...(profile?.email ? { email: profile.email } : {}),
          lmsTimeSeconds: increment(Math.round(seconds)),
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      // Fail silently — tracking must never break the app.
      console.error("usageService.addLmsTime failed", error);
    }
  },

  /** Accumulate real recording watch time (total + per class) for a user. */
  async addWatchTime(
    uid: string,
    seconds: number,
    classId?: string,
    profile?: { name?: string; email?: string }
  ): Promise<void> {
    if (!uid || seconds <= 0) return;
    const secs = Math.round(seconds);
    try {
      await setDoc(
        doc(db, COLLECTION, uid),
        {
          uid,
          ...(profile?.name ? { name: profile.name } : {}),
          ...(profile?.email ? { email: profile.email } : {}),
          recordingWatchSeconds: increment(secs),
          ...(classId
            ? { watchByClass: { [classId]: increment(secs) } }
            : {}),
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("usageService.addWatchTime failed", error);
    }
  },

  async getUsage(uid: string): Promise<UserUsage | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION, uid));
      if (!snap.exists()) return null;
      return { uid, ...(snap.data() as Omit<UserUsage, "uid">) };
    } catch (error) {
      console.error("usageService.getUsage failed", error);
      return null;
    }
  },

  async getAllUsage(): Promise<UserUsage[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      return snap.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<UserUsage, "uid">),
      }));
    } catch (error) {
      console.error("usageService.getAllUsage failed", error);
      return [];
    }
  },
};

/** Format seconds as a compact human-readable duration, e.g. "2h 5m" or "45m". */
export function formatDuration(totalSeconds: number = 0): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
