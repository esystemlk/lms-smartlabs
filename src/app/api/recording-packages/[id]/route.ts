import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { PACKAGES, getCaller, isAdmin, parsePackageInput } from "@/lib/recordingPackages.server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH (admin): edit name, description, prices, access length or published state. */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const caller = await getCaller(req);
    if (!caller.ok) return NextResponse.json({ error: caller.error }, { status: caller.status });
    if (!isAdmin(caller.role)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    const ref = caller.db.collection(PACKAGES).doc((await params).id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    const input = parsePackageInput(await req.json().catch(() => ({})));
    if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

    // Refresh the video count from the batch, since recordings can be added after the package is made.
    const p = snap.data()!;
    const batch = (await caller.db.collection("courses").doc(p.courseId).collection("batches").doc(p.batchId).get()).data();
    await ref.update({
      ...input,
      videoCount: Array.isArray(batch?.recordedClasses) ? batch!.recordedClasses.length : p.videoCount || 0,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("recording-packages PATCH", error);
    return NextResponse.json({ error: "Could not save the package" }, { status: 500 });
  }
}

/** DELETE (admin): remove from sale. People who already bought it keep their access. */
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const caller = await getCaller(req);
    if (!caller.ok) return NextResponse.json({ error: caller.error }, { status: caller.status });
    if (!isAdmin(caller.role)) return NextResponse.json({ error: "Admins only" }, { status: 403 });
    await caller.db.collection(PACKAGES).doc((await params).id).delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("recording-packages DELETE", error);
    return NextResponse.json({ error: "Could not delete the package" }, { status: 500 });
  }
}
