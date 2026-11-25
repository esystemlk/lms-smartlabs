import "server-only";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/lib/firebaseAdmin";

/**
 * Recording packages: an ended batch sold on its own. Buying one creates a normal "active" enrollment
 * (source: "recording_package") for that course + batch, so the buyer sees what a regular student sees:
 * the batch videos, the course resources and grammar. Everything here runs through firebase-admin, so it
 * does not depend on client Firestore rules and never touches the regular enrollment / payment flow.
 */
export const PACKAGES = "recording_packages_batch";
export const ORDERS = "recording_package_orders";

const ADMIN_ROLES = ["admin", "superadmin", "developer"];

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export type Caller =
  | { ok: true; uid: string; role: string; user: FirebaseFirestore.DocumentData; db: Firestore }
  | { ok: false; status: number; error: string };

/** Signed-in caller from the Bearer token, with their profile. */
export async function getCaller(req: Request): Promise<Caller> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { ok: false, status: 401, error: "Sign in required" };
  const app = getAdminApp();
  const decoded = await getAuth(app).verifyIdToken(token).catch(() => null);
  if (!decoded) return { ok: false, status: 401, error: "Invalid session" };
  const db = getFirestore(app);
  const user = (await db.collection("users").doc(decoded.uid).get()).data();
  if (!user) return { ok: false, status: 403, error: "No profile" };
  return { ok: true, uid: decoded.uid, role: String(user.role || "student"), user, db };
}

export const isAdmin = (role: string) => ADMIN_ROLES.includes(role);

export interface PackageInput {
  name: string;
  description: string;
  priceLKR: number;
  priceUSD: number | null; // null = follow the live exchange rate
  accessMonths: number;
  published: boolean;
}

/** Validates and normalises the editable fields; returns an error string when invalid. */
export function parsePackageInput(body: any): PackageInput | string {
  const name = String(body?.name || "").trim().slice(0, 120);
  if (!name) return "Name is required";
  const priceLKR = Math.round(Number(body?.priceLKR) * 100) / 100;
  if (!Number.isFinite(priceLKR) || priceLKR < 50) return "LKR price must be at least 50";
  let priceUSD: number | null = null;
  if (body?.priceUSD !== null && body?.priceUSD !== undefined && body?.priceUSD !== "") {
    priceUSD = Math.round(Number(body.priceUSD) * 100) / 100;
    if (!Number.isFinite(priceUSD) || priceUSD < 1) return "USD price must be at least 1";
  }
  const accessMonths = Math.round(Number(body?.accessMonths ?? 12));
  if (!Number.isFinite(accessMonths) || accessMonths < 1 || accessMonths > 60) return "Access must be 1 to 60 months";
  return {
    name,
    description: String(body?.description || "").trim().slice(0, 1500),
    priceLKR,
    priceUSD,
    accessMonths,
    published: body?.published !== false,
  };
}

/** Public shape of a package (what the store and admin modal use). */
export function toPublicPackage(id: string, d: FirebaseFirestore.DocumentData, extra: Record<string, unknown> = {}) {
  return {
    id,
    name: d.name,
    description: d.description || "",
    courseId: d.courseId,
    courseTitle: d.courseTitle || "",
    batchId: d.batchId,
    batchName: d.batchName || "",
    image: d.image || null,
    priceLKR: d.priceLKR,
    priceUSD: d.priceUSD ?? null,
    accessMonths: d.accessMonths || 12,
    published: !!d.published,
    videoCount: d.videoCount || 0,
    ...extra,
  };
}

/** USD charged for a package: the fixed USD price, or LKR converted at the live rate (rounded up to the cent). */
export function usdFor(priceLKR: number, fixedUSD: number | null | undefined, lkrPerUsd: number) {
  if (fixedUSD) return fixedUSD;
  return Math.max(1, Math.ceil((priceLKR / lkrPerUsd) * 100) / 100);
}

/** PayHere mode and credentials, picked the same way as /api/payhere/hash and /api/payhere/notify. */
export async function payhereConfig(db: Firestore) {
  let mode: "sandbox" | "live" = "sandbox";
  try {
    const s = (await db.collection("settings").doc("global").get()).data();
    if (s?.payhereMode === "live") mode = "live";
  } catch { /* default sandbox */ }
  const merchantId = mode === "live"
    ? (process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID_LIVE || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || "")
    : (process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID_SANDBOX || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || "");
  const secret = mode === "live"
    ? (process.env.PAYHERE_MERCHANT_SECRET_LIVE || process.env.PAYHERE_MERCHANT_SECRET || "")
    : (process.env.PAYHERE_MERCHANT_SECRET_SANDBOX || process.env.PAYHERE_MERCHANT_SECRET || "");
  return { mode, merchantId, secret };
}
