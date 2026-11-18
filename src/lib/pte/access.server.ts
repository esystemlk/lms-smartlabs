import "server-only";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebaseAdmin";

const STAFF = ["lecturer", "admin", "superadmin", "developer"];

export type PteAccess =
  | { ok: true; uid: string; db: Firestore }
  | { ok: false; status: number; error: string };

/**
 * Who may use PTE training: staff always; students only when one of their
 * enrolled courses has the "PTE training" switch (courses.pteTraining) on.
 */
export async function checkPteAccess(req: Request): Promise<PteAccess> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { ok: false, status: 401, error: "Sign in required" };

  const app = getAdminApp();
  const decoded = await getAuth(app).verifyIdToken(token).catch(() => null);
  if (!decoded) return { ok: false, status: 401, error: "Invalid session" };

  const db = getFirestore(app);
  const user = (await db.collection("users").doc(decoded.uid).get()).data();
  if (!user) return { ok: false, status: 403, error: "No profile" };
  if (STAFF.includes(user.role)) return { ok: true, uid: decoded.uid, db };

  const courseIds: string[] = (user.enrolledCourses || []).filter((x: unknown) => typeof x === "string").slice(0, 30);
  if (courseIds.length) {
    const refs = courseIds.map((id) => db.collection("courses").doc(id));
    const courses = await db.getAll(...refs);
    if (courses.some((c) => c.exists && c.data()?.pteTraining === true)) return { ok: true, uid: decoded.uid, db };
  }
  return { ok: false, status: 403, error: "PTE training is not part of your courses" };
}
