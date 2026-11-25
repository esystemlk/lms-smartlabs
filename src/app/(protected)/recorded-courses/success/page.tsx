"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, CircleNotch, Clock, PlayCircle, FolderOpen, TextAa, WarningCircle } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { recordingPackagesApi, formatLKR, formatUSD } from "@/lib/recordingPackages.client";

type Order = Awaited<ReturnType<typeof recordingPackagesApi.order>>;

/**
 * Where PayHere sends the buyer back. Access is granted by the server callback (not by this page), so it
 * just waits for the order to turn "paid" and then opens the way in.
 */
export default function RecordingPurchaseSuccessPage() {
  return <Suspense fallback={null}><RecordingPurchaseSuccessPageInner /></Suspense>;
}

function RecordingPurchaseSuccessPageInner() {
  const { userData } = useAuth();
  const orderId = useSearchParams().get("order") || "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [waitedOut, setWaitedOut] = useState(false);

  useEffect(() => {
    if (!userData || !orderId) return;
    let stop = false;
    let tries = 0;
    const tick = async () => {
      try {
        const o = await recordingPackagesApi.order(orderId);
        if (stop) return;
        setOrder(o);
        if (o.status === "paid" || ["failed", "cancelled", "chargedback", "amount_mismatch"].includes(o.status)) return;
      } catch (e) {
        if (stop) return;
        setError((e as Error).message);
        return;
      }
      tries += 1;
      if (tries >= 30) { setWaitedOut(true); return; }
      window.setTimeout(tick, 2500);
    };
    tick();
    return () => { stop = true; };
  }, [userData, orderId]);

  const paid = order?.status === "paid";
  const failed = !!order && ["failed", "cancelled", "chargedback", "amount_mismatch"].includes(order.status);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="sl-card sl-rise w-full max-w-md overflow-hidden text-center">
        <div className={`p-8 ${paid ? "bg-gradient-to-br from-[#E6F8F1] to-[#EEF1FF]" : failed || error ? "bg-red-50" : "bg-soft"} dark:bg-slate-800`}>
          <span className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-white shadow-sm ${paid ? "text-[#08795A]" : failed || error ? "text-red-600" : "text-primary"}`}>
            {paid ? <CheckCircle size={36} weight="fill" /> : failed || error ? <WarningCircle size={36} weight="fill" /> : waitedOut ? <Clock size={34} weight="duotone" /> : <CircleNotch size={34} className="animate-spin" />}
          </span>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-ink dark:text-white">
            {paid ? "You're in!" : failed ? "Payment not completed" : error ? "Something went wrong" : waitedOut ? "Still confirming…" : "Confirming your payment"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {paid
              ? `${order!.packageName} is unlocked.`
              : failed
                ? "PayHere did not confirm this payment, so you have not been given access. If money left your account, contact us with your order number."
                : error
                  ? error
                  : waitedOut
                    ? "PayHere has not confirmed the payment yet. It usually takes a minute. You can leave this page; access appears automatically once it does."
                    : "This only takes a few seconds."}
          </p>
          {order && (
            <p className="mt-3 text-[12px] text-ink-muted">
              Order {orderId} · {order.currency === "USD" ? formatUSD(order.amount) : formatLKR(order.amount)}
            </p>
          )}
        </div>

        <div className="p-6 space-y-3">
          {paid ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-[12px] font-semibold">
                <Link href={`/courses/${order!.courseId}`} className="rounded-2xl border border-line dark:border-slate-700 p-3 hover:bg-soft flex flex-col items-center gap-1.5 text-ink dark:text-white">
                  <PlayCircle size={22} weight="duotone" className="text-primary" /> Videos
                </Link>
                <Link href="/lms/resources" className="rounded-2xl border border-line dark:border-slate-700 p-3 hover:bg-soft flex flex-col items-center gap-1.5 text-ink dark:text-white">
                  <FolderOpen size={22} weight="duotone" className="text-primary" /> Resources
                </Link>
                <Link href="/lms/grammar" className="rounded-2xl border border-line dark:border-slate-700 p-3 hover:bg-soft flex flex-col items-center gap-1.5 text-ink dark:text-white">
                  <TextAa size={22} weight="duotone" className="text-primary" /> Grammar
                </Link>
              </div>
              <Link href={`/courses/${order!.courseId}`} className="block w-full h-12 leading-[48px] rounded-2xl bg-primary text-white font-bold hover:bg-[#2338C9]">
                Start watching
              </Link>
            </>
          ) : (
            <Link href="/recorded-courses" className="block w-full h-12 leading-[48px] rounded-2xl border-2 border-line dark:border-slate-700 font-bold text-ink dark:text-white hover:bg-soft">
              Back to Recorded Courses
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
