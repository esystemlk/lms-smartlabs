import { db } from "@/lib/firebase";
import {
  collection, doc, getDocs, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, serverTimestamp, increment,
} from "firebase/firestore";

/** A grammar class video shown to students on the Grammar page. */
export interface GrammarClass {
  id?: string;
  bunnyVideoId: string;
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  order: number;
  active: boolean;
  views: number;
  createdAt?: any;
}

const COLLECTION = "grammar_classes";

export const grammarService = {
  async getClasses(activeOnly = false): Promise<GrammarClass[]> {
    const q = activeOnly
      ? query(collection(db, COLLECTION), where("active", "==", true), orderBy("order", "desc"))
      : query(collection(db, COLLECTION), orderBy("order", "desc"));
    try {
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GrammarClass, "id">) }));
    } catch (error) {
      // Fallback without orderBy (e.g. missing composite index) so the page still loads.
      console.error("grammarService.getClasses ordered query failed, retrying", error);
      const snap = await getDocs(collection(db, COLLECTION));
      return snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<GrammarClass, "id">) }))
        .filter((c) => (activeOnly ? c.active : true))
        .sort((a, b) => (b.order || 0) - (a.order || 0));
    }
  },

  /** Create one grammar class from a Bunny video. */
  async addClass(data: Omit<GrammarClass, "id" | "views" | "createdAt">) {
    const clean: any = {};
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined) clean[k] = v; });
    const ref = await addDoc(collection(db, COLLECTION), {
      ...clean,
      views: 0,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** Bulk-add several grammar classes (e.g. selected Bunny videos), skipping ones already added. */
  async addMany(items: Omit<GrammarClass, "id" | "views" | "createdAt">[]): Promise<number> {
    const existing = await this.getClasses();
    const existingIds = new Set(existing.map((c) => c.bunnyVideoId));
    let added = 0;
    for (const item of items) {
      if (!item.bunnyVideoId || existingIds.has(item.bunnyVideoId)) continue;
      await this.addClass(item);
      existingIds.add(item.bunnyVideoId);
      added++;
    }
    return added;
  },

  async updateClass(id: string, data: Partial<GrammarClass>) {
    const clean: any = {};
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined) clean[k] = v; });
    await updateDoc(doc(db, COLLECTION, id), clean);
  },

  async toggleStatus(id: string, active: boolean) {
    await updateDoc(doc(db, COLLECTION, id), { active });
  },

  async deleteClass(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async incrementView(id: string) {
    try {
      await updateDoc(doc(db, COLLECTION, id), { views: increment(1) });
    } catch { /* non-critical */ }
  },
};
