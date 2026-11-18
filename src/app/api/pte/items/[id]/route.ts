import { NextResponse } from "next/server";
import { checkPteAccess } from "@/lib/pte/access.server";
import { getPteItem } from "@/lib/pte/items.server";
import { publicItem } from "@/lib/pte/scoring";

export const dynamic = "force-dynamic";

/** One item, without its answer key. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await checkPteAccess(req);
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    const item = getPteItem((await params).id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ item: publicItem(item) });
  } catch (e) {
    console.error("pte/item", e);
    return NextResponse.json({ error: "Could not load question" }, { status: 500 });
  }
}
