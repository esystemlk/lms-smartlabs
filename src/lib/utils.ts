import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deterministically derive a 4-digit number from a Firebase uid (or any string).
 * Stable for the same uid, no database writes required.
 */
function hashToNumber(input: string, digits = 4): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0; // unsigned 32-bit
  }
  const mod = 10 ** digits;
  return String(hash % mod).padStart(digits, "0");
}

/**
 * Extracts the calendar year from a value that may be a Firestore Timestamp,
 * a JS Date, an ISO string, or epoch millis. Falls back to the current year.
 */
function resolveYear(createdAt: any): number {
  try {
    if (!createdAt) return new Date().getFullYear();
    // Firestore Timestamp
    if (typeof createdAt?.toDate === "function") return createdAt.toDate().getFullYear();
    if (typeof createdAt?.seconds === "number") return new Date(createdAt.seconds * 1000).getFullYear();
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) return d.getFullYear();
  } catch {
    // ignore
  }
  return new Date().getFullYear();
}

/**
 * Generates a stable, human-readable Student ID derived from the account uid.
 * Format: SL-{signupYear}-{4-digit number from uid}, e.g. "SL-2026-0042".
 * Purely presentational — derived on the fly, never stored, so it cannot
 * affect existing data or workflows.
 */
export function getStudentId(user?: { uid?: string; createdAt?: any } | null): string {
  if (!user?.uid) return "—";
  const year = resolveYear(user.createdAt);
  return `SL-${year}-${hashToNumber(user.uid, 4)}`;
}
