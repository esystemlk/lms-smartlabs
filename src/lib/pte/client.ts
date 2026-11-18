import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import type { PtePublicItem, PteResult, PteType } from "./scoring";

export interface PteListEntry { id: string; type: PteType; section: "reading" | "listening"; maxScore: number; best: number | null }

/** Calls a PTE API route with the signed-in user's token. Throws with .status on failure. */
async function pteFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || "Request failed"), { status: res.status });
  return body as T;
}

export const pteApi = {
  list: () => pteFetch<{ items: PteListEntry[] }>("/api/pte/items"),
  item: (id: string) => pteFetch<{ item: PtePublicItem }>(`/api/pte/items/${encodeURIComponent(id)}`),
  score: (itemId: string, response: unknown, mode: "practice" | "exam") =>
    pteFetch<PteResult>("/api/pte/score", { method: "POST", body: JSON.stringify({ itemId, response, mode }) }),
};

// One access check per signed-in user, shared by every component that asks.
const accessByUid = new Map<string, Promise<boolean>>();

/** True once the server confirms this user may use PTE training (staff, or enrolled in a PTE course). */
export function usePteAccess(uid?: string | null) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!uid) { setOk(false); return; }
    if (!accessByUid.has(uid)) accessByUid.set(uid, pteApi.list().then(() => true, () => false));
    let live = true;
    accessByUid.get(uid)!.then((v) => { if (live) setOk(v); });
    return () => { live = false; };
  }, [uid]);
  return ok;
}
