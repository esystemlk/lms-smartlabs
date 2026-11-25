import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getLkrPerUsd } from "@/lib/fx.server";
import {
  PACKAGES, adminDb, getCaller, isAdmin, parsePackageInput, toPublicPackage, usdFor,
} from "@/lib/recordingPackages.server";

export const dynamic = "force-dynamic";

/**
 * GET: the store list (published packages) with live USD prices and, for a signed-in caller, which ones
 * they already own. Admins can pass ?courseId=… to get that course's packages, drafts included.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const courseId = url.searchParams.get("courseId");
    const hasToken = (req.headers.get("authorization") || "").startsWith("Bearer ");
    const caller = hasToken ? await getCaller(req) : null;
    const admin = !!(caller?.ok && isAdmin(caller.role));
    const db = adminDb();

    let snap;
    if (courseId) {
      if (!admin) return NextResponse.json({ error: "Admins only" }, { status: 403 });
      snap = await db.collection(PACKAGES).where("courseId", "==", courseId).get();
    } else {
      snap = await db.collection(PACKAGES).where("published", "==", true).get();
    }

    // Batches the caller can already open (any active/completed enrollment), so the store shows "Owned".
    const owned = new Set<string>();
    if (caller?.ok) {
      const enr = await db.collection("enrollments").where("userId", "==", caller.uid).get();
      enr.forEach((e) => {
        const d = e.data();
        if (d.status === "active" || d.status === "completed") owned.add(`${d.courseId}/${d.batchId}`);
      });
    }

    const fx = await getLkrPerUsd();
    const packages = snap.docs
      .sort((a, b) => (b.data().createdAt?.toMillis?.() || 0) - (a.data().createdAt?.toMillis?.() || 0))
      .map((d) => {
        const p = d.data();
        return toPublicPackage(d.id, p, {
          usd: usdFor(p.priceLKR, p.priceUSD, fx.rate),
          owned: owned.has(`${p.courseId}/${p.batchId}`),
          salesCount: admin ? p.salesCount || 0 : undefined,
        });
      });

    return NextResponse.json({ packages, fx });
  } catch (error) {
    console.error("recording-packages GET", error);
    return NextResponse.json({ error: "Could not load packages" }, { status: 500 });
  }
}

/** POST (admin): turn an ended batch into a recording package. */
export async function POST(req: Request) {
  try {
    const caller = await getCaller(req);
    if (!caller.ok) return NextResponse.json({ error: caller.error }, { status: caller.status });
    if (!isAdmin(caller.role)) return NextResponse.json({ error: "Admins only" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const courseId = String(body?.courseId || "");
    const batchId = String(body?.batchId || "");
    if (!courseId || !batchId) return NextResponse.json({ error: "Pick a course batch" }, { status: 400 });
    const input = parsePackageInput(body);
    if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

    const db = caller.db;
    const courseSnap = await db.collection("courses").doc(courseId).get();
    const batchSnap = await db.collection("courses").doc(courseId).collection("batches").doc(batchId).get();
    if (!courseSnap.exists || !batchSnap.exists) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    const dupe = await db.collection(PACKAGES).where("batchId", "==", batchId).get();
    if (dupe.docs.some((d) => d.data().courseId === courseId)) {
      return NextResponse.json({ error: "This batch already has a recording package" }, { status: 409 });
    }

    const course = courseSnap.data()!;
    const batch = batchSnap.data()!;
    const ref = db.collection(PACKAGES).doc();
    const doc = {
      ...input,
      courseId,
      courseTitle: course.title || "",
      batchId,
      batchName: batch.name || "",
      image: batch.image || course.image || null,
      videoCount: Array.isArray(batch.recordedClasses) ? batch.recordedClasses.length : 0,
      salesCount: 0,
      createdBy: caller.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    await ref.set(doc);
    return NextResponse.json({ id: ref.id });
  } catch (error) {
    console.error("recording-packages POST", error);
    return NextResponse.json({ error: "Could not create the package" }, { status: 500 });
  }
}
