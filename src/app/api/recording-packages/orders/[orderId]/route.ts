import { NextResponse } from "next/server";
import { ORDERS, getCaller, isAdmin } from "@/lib/recordingPackages.server";

export const dynamic = "force-dynamic";

/** GET: an order's status, for the buyer's "payment received" page (it polls until the notify lands). */
export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const caller = await getCaller(req);
    if (!caller.ok) return NextResponse.json({ error: caller.error }, { status: caller.status });
    const snap = await caller.db.collection(ORDERS).doc((await params).orderId).get();
    const o = snap.data();
    if (!snap.exists || !o || (o.userId !== caller.uid && !isAdmin(caller.role))) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({
      status: o.status,
      packageName: o.packageName,
      courseId: o.courseId,
      courseTitle: o.courseTitle,
      batchName: o.batchName,
      currency: o.currency,
      amount: o.amount,
    });
  } catch (error) {
    console.error("recording-packages order GET", error);
    return NextResponse.json({ error: "Could not load the order" }, { status: 500 });
  }
}
