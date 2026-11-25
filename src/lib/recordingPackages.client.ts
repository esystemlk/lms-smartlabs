import { auth } from "@/lib/firebase";

export interface RecordingPackage {
  id: string;
  name: string;
  description: string;
  courseId: string;
  courseTitle: string;
  batchId: string;
  batchName: string;
  image: string | null;
  priceLKR: number;
  priceUSD: number | null; // fixed USD price, or null to follow the live rate
  usd: number;             // what USD buyers pay today
  accessMonths: number;
  published: boolean;
  videoCount: number;
  owned?: boolean;
  salesCount?: number;
}

export interface FxRate { rate: number; updatedAt: number; source: string }

export interface PackageFields {
  name: string;
  description: string;
  priceLKR: number;
  priceUSD: number | null;
  accessMonths: number;
  published: boolean;
}

/** Calls a recording-package API route, with the signed-in user's token when there is one. */
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken().catch(() => undefined);
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || "Request failed"), { status: res.status });
  return body as T;
}

export const recordingPackagesApi = {
  list: () => call<{ packages: RecordingPackage[]; fx: FxRate }>("/api/recording-packages"),
  forCourse: (courseId: string) =>
    call<{ packages: RecordingPackage[]; fx: FxRate }>(`/api/recording-packages?courseId=${encodeURIComponent(courseId)}`),
  create: (courseId: string, batchId: string, fields: PackageFields) =>
    call<{ id: string }>("/api/recording-packages", { method: "POST", body: JSON.stringify({ courseId, batchId, ...fields }) }),
  update: (id: string, fields: PackageFields) =>
    call<{ ok: true }>(`/api/recording-packages/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(fields) }),
  remove: (id: string) => call<{ ok: true }>(`/api/recording-packages/${encodeURIComponent(id)}`, { method: "DELETE" }),
  checkout: (id: string, currency: "LKR" | "USD") =>
    call<{ orderId: string; payment: Record<string, unknown> }>(`/api/recording-packages/${encodeURIComponent(id)}/checkout`, {
      method: "POST",
      body: JSON.stringify({ currency }),
    }),
  order: (orderId: string) =>
    call<{ status: string; packageName: string; courseId: string; courseTitle: string; batchName: string; currency: string; amount: number }>(
      `/api/recording-packages/orders/${encodeURIComponent(orderId)}`,
    ),
};

export const formatLKR = (n: number) => `LKR ${Math.round(n).toLocaleString("en-LK")}`;
export const formatUSD = (n: number) => `USD ${n.toFixed(2)}`;

/** Loads PayHere's script once and opens its checkout popup. */
export async function openPayHere(payment: Record<string, unknown>, handlers: { onDismissed: () => void; onError: (e: string) => void; onCompleted: () => void }) {
  const w = window as unknown as { payhere?: any };
  if (!w.payhere) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://www.payhere.lk/lib/payhere.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Could not load PayHere. Check your connection and try again."));
      document.head.appendChild(s);
    });
  }
  if (!w.payhere) throw new Error("PayHere did not load");
  w.payhere.onCompleted = handlers.onCompleted;
  w.payhere.onDismissed = handlers.onDismissed;
  w.payhere.onError = handlers.onError;
  w.payhere.startPayment(payment);
}
