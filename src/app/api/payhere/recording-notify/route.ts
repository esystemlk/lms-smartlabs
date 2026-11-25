import { NextResponse } from "next/server";
import crypto from "crypto";
import { addMonths } from "date-fns";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { rateLimit } from "@/lib/rateLimit";
import { ORDERS, PACKAGES, adminDb, payhereConfig } from "@/lib/recordingPackages.server";

export const dynamic = "force-dynamic";

const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex").toUpperCase();

/**
 * PayHere server-to-server callback for recording-package orders only (the regular course flow keeps using
 * /api/payhere/notify). On a verified successful payment it grants access straight away: an "active"
 * enrollment for the package's course + batch, and the course/batch added to the user's lists. Batch seat
 * counts are left alone, since a recording buyer does not take a seat in the class.
 */
export async function POST(req: Request) {
  try {
    const rl = rateLimit(req, "api/payhere/recording-notify", 60, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const f = await req.formData();
    const get = (k: string) => String(f.get(k) ?? "");
    const merchant_id = get("merchant_id");
    const order_id = get("order_id");
    const payment_id = get("payment_id");
    const payhere_amount = get("payhere_amount");
    const payhere_currency = get("payhere_currency");
    const status_code = get("status_code");
    const md5sig = get("md5sig");
    if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const db = adminDb();
    const orderRef = db.collection(ORDERS).doc(order_id);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    const order = orderSnap.data()!;

    // Verify with the credentials of the mode the order was created in.
    const cfg = await payhereConfig(db);
    const mode = order.payhereMode === "live" || order.payhereMode === "sandbox" ? order.payhereMode : cfg.mode;
    const merchantId = mode === "live"
      ? (process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID_LIVE || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || "")
      : (process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID_SANDBOX || process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || "");
    const secret = mode === "live"
      ? (process.env.PAYHERE_MERCHANT_SECRET_LIVE || process.env.PAYHERE_MERCHANT_SECRET || "")
      : (process.env.PAYHERE_MERCHANT_SECRET_SANDBOX || process.env.PAYHERE_MERCHANT_SECRET || "");
    if (!merchantId || !secret) return NextResponse.json({ error: "Server config error" }, { status: 500 });
    if (merchant_id !== merchantId) return NextResponse.json({ error: "Merchant mismatch" }, { status: 400 });

    const expectedSig = md5(`${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${md5(secret)}`);
    if (expectedSig !== md5sig) return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });

    if (status_code !== "2") {
      // 0 pending, -1 cancelled, -2 failed, -3 charged back
      const status = status_code === "0" ? "pending" : status_code === "-1" ? "cancelled" : status_code === "-3" ? "chargedback" : "failed";
      if (order.status !== "paid" || status === "chargedback") {
        await orderRef.update({ status, payhereStatusCode: status_code, updatedAt: FieldValue.serverTimestamp() });
      }
      if (status === "chargedback") {
        await db.collection("enrollments").doc(order_id).set({ status: "expired", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
      return NextResponse.json({ status });
    }

    if (payhere_currency !== order.currency || Number(payhere_amount).toFixed(2) !== Number(order.amount).toFixed(2)) {
      await orderRef.update({ status: "amount_mismatch", payhereStatusCode: status_code, updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const validUntil = Timestamp.fromDate(addMonths(new Date(), Number(order.accessMonths) || 12));
    const activated = await db.runTransaction(async (tx) => {
      const pkgRef = db.collection(PACKAGES).doc(order.packageId);
      const [fresh, pkgSnap] = await Promise.all([tx.get(orderRef), tx.get(pkgRef)]);
      if (fresh.data()?.status === "paid") return false; // PayHere can call more than once
      if (pkgSnap.exists) tx.update(pkgRef, { salesCount: FieldValue.increment(1) });
      tx.update(orderRef, {
        status: "paid",
        paymentId: payment_id || null,
        payhereStatusCode: status_code,
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      // Same enrollment shape as a regular student, so recordings, resources and grammar open as normal.
      tx.set(db.collection("enrollments").doc(order_id), {
        id: order_id,
        userId: order.userId,
        userEmail: order.userEmail || "",
        userName: order.userName || "",
        courseId: order.courseId,
        courseTitle: order.courseTitle || "",
        batchId: order.batchId,
        batchName: order.batchName || "",
        status: "active",
        paymentMethod: "payhere",
        paymentProofUrl: payment_id || null,
        amount: order.amountLKR,
        paidAmount: order.amount,
        paidCurrency: order.currency,
        source: "recording_package",
        packageId: order.packageId,
        validUntil,
        progress: 0,
        enrolledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.update(db.collection("users").doc(order.userId), {
        enrolledBatches: FieldValue.arrayUnion(order.batchId),
        enrolledCourses: FieldValue.arrayUnion(order.courseId),
      });
      return true;
    });

    return NextResponse.json({ status: activated ? "activated" : "already_active" });
  } catch (error) {
    console.error("PayHere recording notify error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
