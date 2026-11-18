import { NextResponse } from "next/server";
import { checkPteAccess } from "@/lib/pte/access.server";
import { PTE_ITEMS } from "@/lib/pte/items.server";
import { maxScoreOf } from "@/lib/pte/scoring";

export const dynamic = "force-dynamic";

/** List of all PTE training items (no content, no answers) plus the student's best score per item. */
export async function GET(req: Request) {
  try {
    const access = await checkPteAccess(req);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const attempts = await access.db.collection("pteAttempts").where("userId", "==", access.uid).get();
    const best: Record<string, number> = {};
    attempts.forEach((d) => {
      const a = d.data();
      best[a.itemId] = Math.max(best[a.itemId] ?? 0, a.score ?? 0);
    });

    return NextResponse.json({
      items: PTE_ITEMS.map((i) => ({ id: i.id, type: i.type, section: i.section, maxScore: maxScoreOf(i), best: best[i.id] ?? null })),
    });
  } catch (e) {
    console.error("pte/items", e);
    return NextResponse.json({ error: "Could not load PTE training" }, { status: 500 });
  }
}
