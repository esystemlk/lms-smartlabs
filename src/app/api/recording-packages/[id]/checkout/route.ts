import { NextResponse } from "next/server";
import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rateLimit";
import { getLkrPerUsd } from "@/lib/fx.server";
import { ORDERS, PACKAGES, getCaller, payhereConfig, usdFor } from "@/lib/recordingPackages.server";

export const dynamic = "force-dynamic";

const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex").toUpperCase();

/**
 * POST { currency: "LKR" | "USD" } → a pending order and the signed PayHere checkout fields.
 * The price is decided here on the server (never trusted from the browser) and stored on the order,
 * so the notify handler can check the paid amount against it.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rl = rateLimit(req, "api/recording-packages/checkout", 10, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Too many attempts, try again in a minute" }, { status: 429 });

    const caller = await getCaller(req);
    if (!caller.ok) return NextResponse.json({ error: caller.error }, { status: caller.status });
    const db = caller.db;

    const body = await req.json().catch(() => ({}));
    const currency = body?.currency === "USD" ? "USD" : "LKR";

    const pkgSnap = await db.collection(PACKAGES).doc((await params).id).get();
    const pkg = pkgSnap.data();
    if (!pkgSnap.exists || !pkg?.published) return NextResponse.json({ error: "This package is not on sale" }, { status: 404 });

    // Already has this batch (bought it, or was a regular student of it)?
    const enr = await db.collection("enrollments").where("userId", "==", caller.uid).get();
    const hasIt = enr.docs.some((e) => {
      const d = e.data();
      return d.courseId === pkg.courseId && d.batchId === pkg.batchId && (d.status === "active" || d.status === "completed");
    });
    if (hasIt) return NextResponse.json({ error: "You already have access to these recordings" }, { status: 409 });

    const { mode, merchantId, secret } = await payhereConfig(db);
    if (!merchantId || !secret) return NextResponse.json({ error: "Payments are not set up yet" }, { status: 503 });

    const fx = await getLkrPerUsd();
    const amount = currency === "USD" ? usdFor(pkg.priceLKR, pkg.priceUSD, fx.rate) : pkg.priceLKR;
    const amountStr = Number(amount).toFixed(2);

    const user = caller.user;
    const orderRef = db.collection(ORDERS).doc();
    await orderRef.set({
      userId: caller.uid,
      userEmail: user.email || "",
      userName: user.name || "",
      packageId: pkgSnap.id,
      packageName: pkg.name,
      courseId: pkg.courseId,
      courseTitle: pkg.courseTitle || "",
      batchId: pkg.batchId,
      batchName: pkg.batchName || "",
      accessMonths: pkg.accessMonths || 12,
      currency,
      amount: Number(amountStr),
      amountLKR: pkg.priceLKR,
      lkrPerUsd: fx.rate,
      payhereMode: mode,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const origin = new URL(req.url).origin;
    const name = String(user.name || "Student").trim();
    const payment = {
      sandbox: mode !== "live",
      merchant_id: merchantId,
      return_url: `${origin}/recorded-courses/success?order=${orderRef.id}`,
      cancel_url: `${origin}/recorded-courses?cancelled=1`,
      notify_url: `${origin}/api/payhere/recording-notify`,
      order_id: orderRef.id,
      items: String(pkg.name).slice(0, 100),
      currency,
      amount: amountStr,
      first_name: name.split(" ")[0] || "Student",
      last_name: name.split(" ").slice(1).join(" ") || "-",
      email: user.email || "",
      phone: user.contact || "0770000000",
      address: user.address || "Colombo",
      city: user.city || "Colombo",
      country: user.country || "Sri Lanka",
      hash: md5(`${merchantId}${orderRef.id}${amountStr}${currency}${md5(secret)}`),
    };
    return NextResponse.json({ orderId: orderRef.id, payment });
  } catch (error) {
    console.error("recording-packages checkout", error);
    return NextResponse.json({ error: "Could not start the payment" }, { status: 500 });
  }
}
