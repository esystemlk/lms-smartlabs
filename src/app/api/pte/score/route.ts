import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rateLimit";
import { checkPteAccess } from "@/lib/pte/access.server";
import { getPteItem } from "@/lib/pte/items.server";
import { scoreItem } from "@/lib/pte/scoring";

export const dynamic = "force-dynamic";

const schema = z.object({
  itemId: z.string().min(1).max(40),
  mode: z.enum(["practice", "exam"]),
  // shape depends on the task type; scoreItem() treats anything malformed as a blank answer
  response: z.unknown(),
});

/** Marks an answer on the server (keys never reach the browser) and saves the attempt. */
export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, "api/pte/score", 60, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const access = await checkPteAccess(req);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const item = getPteItem(parsed.data.itemId);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const result = scoreItem(item, parsed.data.response);
    const stored = JSON.stringify(parsed.data.response ?? null);
    await access.db.collection("pteAttempts").add({
      userId: access.uid,
      itemId: item.id,
      type: item.type,
      mode: parsed.data.mode,
      score: result.score,
      maxScore: result.maxScore,
      response: stored.length <= 5000 ? stored : stored.slice(0, 5000),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("pte/score", e);
    return NextResponse.json({ error: "Could not mark this answer" }, { status: 500 });
  }
}
