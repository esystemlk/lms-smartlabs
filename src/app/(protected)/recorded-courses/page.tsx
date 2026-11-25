"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FilmStrip, PlayCircle, FolderOpen, TextAa, CalendarCheck, ShieldCheck, X, CircleNotch, CheckCircle, ArrowRight, Lightning,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import {
  recordingPackagesApi, openPayHere, formatLKR, formatUSD, type FxRate, type RecordingPackage,
} from "@/lib/recordingPackages.client";

type Currency = "LKR" | "USD";

export default function RecordedCoursesPage() {
  return <Suspense fallback={null}><RecordedCoursesPageInner /></Suspense>;
}

function RecordedCoursesPageInner() {
  const { userData } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [packages, setPackages] = useState<RecordingPackage[] | null>(null);
  const [fx, setFx] = useState<FxRate | null>(null);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState<Currency>("LKR");
  const [buying, setBuying] = useState<RecordingPackage | null>(null);
  const [notice, setNotice] = useState(search.get("cancelled") ? "Payment cancelled. You have not been charged." : "");

  // Buyers outside Sri Lanka start on USD.
  useEffect(() => {
    const c = String(userData?.country || "").toLowerCase();
    if (c && !c.includes("sri lanka") && c !== "lk") setCurrency("USD");
  }, [userData?.country]);

  useEffect(() => {
    if (!userData) return;
    recordingPackagesApi
      .list()
      .then((r) => { setPackages(r.packages); setFx(r.fx); })
      .catch((e) => { setError((e as Error).message); setPackages([]); });
  }, [userData]);

  const totalVideos = useMemo(() => (packages || []).reduce((n, p) => n + (p.videoCount || 0), 0), [packages]);
  const price = (p: RecordingPackage) => (currency === "USD" ? formatUSD(p.usd) : formatLKR(p.priceLKR));

  return (
    <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <section className="sl-hero sl-rise relative overflow-hidden rounded-[26px] p-5 md:p-8 text-white">
        <span aria-hidden className="sl-float absolute -right-12 -top-20 w-56 h-56 rounded-full bg-[radial-gradient(circle,#9EB0FF,transparent_70%)] opacity-60" />
        <span aria-hidden className="sl-float absolute right-40 -bottom-24 w-44 h-44 rounded-full bg-[radial-gradient(circle,#FFB070,transparent_70%)] opacity-50" style={{ animationDelay: "-3s" }} />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-[12px] font-semibold">
              <Lightning size={14} weight="fill" /> Instant access after payment
            </span>
            <h1 className="mt-3 text-[24px] md:text-[34px] font-extrabold leading-tight">Recorded Courses</h1>
            <p className="text-[#DCE2FF] mt-1.5 text-sm md:text-base">
              Recorded classes from our batches. Watch every lesson at your own pace, with the same resources and grammar lessons our live students get. For batches still running, new recordings appear as each class finishes.
            </p>
          </div>
          <div className="flex gap-2.5">
            <div className="rounded-2xl bg-white/15 border border-white/25 px-4 py-2.5 text-center min-w-[92px]">
              <b className="block font-display text-2xl">{packages?.length ?? "–"}</b>
              <span className="text-[12px] text-[#DCE2FF]">Courses</span>
            </div>
            <div className="rounded-2xl bg-white/15 border border-white/25 px-4 py-2.5 text-center min-w-[92px]">
              <b className="block font-display text-2xl">{packages ? totalVideos : "–"}</b>
              <span className="text-[12px] text-[#DCE2FF]">Videos</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Currency" className="flex gap-1 p-1.5 bg-white dark:bg-slate-900 border border-line dark:border-slate-800 rounded-2xl w-fit">
          {(["LKR", "USD"] as Currency[]).map((c) => {
            const on = currency === c;
            return (
              <button
                key={c}
                role="radio"
                aria-checked={on}
                onClick={() => setCurrency(c)}
                className={`h-10 px-5 rounded-xl text-sm font-semibold transition-colors ${on ? "bg-ink text-white shadow-[0_4px_12px_rgba(15,23,42,.18)]" : "text-slate-600 dark:text-slate-300 hover:text-ink"}`}
              >
                Pay in {c}
              </button>
            );
          })}
        </div>
        {currency === "USD" && fx && (
          <p className="text-[12.5px] text-ink-muted">USD prices follow today&apos;s rate: 1 USD = {fx.rate.toFixed(2)} LKR</p>
        )}
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFF5E0] text-[#8A5300] px-4 py-3 text-sm">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}
      {error && <div className="rounded-2xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      {packages === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {[0, 1, 2].map((i) => <div key={i} className="sl-card h-[380px] animate-pulse bg-slate-100 dark:bg-slate-800" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="sl-card p-10 text-center">
          <span className="mx-auto w-14 h-14 rounded-2xl bg-soft text-primary flex items-center justify-center"><FilmStrip size={28} weight="duotone" /></span>
          <h2 className="mt-4 font-display text-lg font-bold text-ink dark:text-white">No recorded courses yet</h2>
          <p className="mt-1 text-sm text-ink-muted">New recorded courses are added regularly. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {packages.map((p, i) => (
            <article key={p.id} className="sl-card sl-card-hover sl-rise group flex flex-col overflow-hidden" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
              <div className="relative h-40 bg-gradient-to-br from-[#EEF1FF] to-[#FFF1E6] dark:from-slate-800 dark:to-slate-800 overflow-hidden">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <FilmStrip size={64} weight="duotone" className="absolute right-5 bottom-4 text-primary/30" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className="absolute left-4 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-bold text-ink">
                  <PlayCircle size={14} weight="fill" className="text-primary" /> {p.videoCount} video{p.videoCount === 1 ? "" : "s"}
                </span>
                {p.owned && (
                  <span className="absolute right-3 top-3 pill-sm bg-[#E6F8F1] text-[#08795A]">Owned</span>
                )}
              </div>

              <div className="p-5 flex flex-col gap-3 flex-1">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">{p.courseTitle}</p>
                  <h2 className="mt-1 font-display text-[17px] font-bold leading-snug text-ink dark:text-white">{p.name}</h2>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted">{p.batchName} batch</p>
                </div>
                {p.description && <p className="text-[13.5px] text-slate-600 dark:text-slate-300 line-clamp-3">{p.description}</p>}

                <ul className="grid grid-cols-2 gap-2 text-[12.5px] text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-1.5"><PlayCircle size={16} className="text-primary" /> Batch videos</li>
                  <li className="flex items-center gap-1.5"><FolderOpen size={16} className="text-primary" /> Resources</li>
                  <li className="flex items-center gap-1.5"><TextAa size={16} className="text-primary" /> Grammar classes</li>
                  <li className="flex items-center gap-1.5"><CalendarCheck size={16} className="text-primary" /> {p.accessMonths} months access</li>
                </ul>

                <div className="mt-auto pt-3 border-t border-line dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-extrabold text-ink dark:text-white">{price(p)}</p>
                    <p className="text-[11.5px] text-ink-muted">One-time payment</p>
                  </div>
                  {p.owned ? (
                    <Link href={`/courses/${p.courseId}`} className="h-10 px-4 rounded-xl bg-[#E6F8F1] text-[#08795A] text-sm font-bold inline-flex items-center gap-1.5 hover:bg-[#d5f2e7]">
                      Watch <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <button onClick={() => setBuying(p)} className="h-10 px-5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-[#2338C9] shadow-[0_6px_16px_rgba(59,91,253,.3)]">
                      Buy now
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {buying && (
        <CheckoutSheet
          pkg={buying}
          initialCurrency={currency}
          onClose={() => setBuying(null)}
          onPaid={(orderId) => router.push(`/recorded-courses/success?order=${orderId}`)}
        />
      )}
    </div>
  );
}

function CheckoutSheet({ pkg, initialCurrency, onClose, onPaid }: {
  pkg: RecordingPackage;
  initialCurrency: Currency;
  onClose: () => void;
  onPaid: (orderId: string) => void;
}) {
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    setError("");
    setBusy(true);
    try {
      const { orderId, payment } = await recordingPackagesApi.checkout(pkg.id, currency);
      await openPayHere(payment, {
        onCompleted: () => onPaid(orderId),
        onDismissed: () => setBusy(false),
        onError: (e) => { setError(typeof e === "string" ? e : "Payment failed. Please try again."); setBusy(false); },
      });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-in fade-in" onClick={() => !busy && onClose()}>
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md rounded-t-[26px] sm:rounded-[26px] bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-primary">{pkg.courseTitle}</p>
            <h2 className="font-display text-lg font-extrabold leading-snug text-ink dark:text-white">{pkg.name}</h2>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Close" className="p-1.5 rounded-lg hover:bg-soft text-ink-muted"><X size={18} /></button>
        </div>

        <div className="px-5 space-y-4">
          <div>
            <p className="text-[13px] font-semibold text-ink dark:text-slate-200 mb-2">Pay in</p>
            <div role="radiogroup" className="grid grid-cols-2 gap-2">
              {(["LKR", "USD"] as Currency[]).map((c) => {
                const on = currency === c;
                return (
                  <button
                    key={c}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setCurrency(c)}
                    disabled={busy}
                    className={`rounded-2xl border-2 p-3 text-left transition-colors ${on ? "border-primary bg-soft" : "border-line dark:border-slate-700 hover:border-primary/40"}`}
                  >
                    <span className="block text-[12px] font-semibold text-ink-muted">{c === "LKR" ? "Sri Lankan rupees" : "US dollars"}</span>
                    <span className="block font-display text-lg font-extrabold text-ink dark:text-white">{c === "LKR" ? formatLKR(pkg.priceLKR) : formatUSD(pkg.usd)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2 text-[13px] text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="fill" className="text-brand-mint" /> {pkg.videoCount} recorded classes from the {pkg.batchName} batch</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="fill" className="text-brand-mint" /> Course resources and grammar classes</li>
            <li className="flex items-center gap-2"><CheckCircle size={16} weight="fill" className="text-brand-mint" /> {pkg.accessMonths} months of access, starting right after payment</li>
          </ul>

          {error && <p className="text-[13px] rounded-xl bg-red-50 text-red-700 px-3.5 py-2.5">{error}</p>}
        </div>

        <div className="p-5 space-y-3">
          <button onClick={pay} disabled={busy} className="w-full h-12 rounded-2xl bg-primary text-white font-bold hover:bg-[#2338C9] disabled:opacity-70 inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(59,91,253,.3)]">
            {busy ? <CircleNotch size={18} className="animate-spin" /> : <ShieldCheck size={18} weight="fill" />}
            {busy ? "Opening PayHere…" : `Pay ${currency === "LKR" ? formatLKR(pkg.priceLKR) : formatUSD(pkg.usd)}`}
          </button>
          <p className="text-center text-[11.5px] text-ink-muted">Secure card payment by PayHere. Your card details never reach Smart Labs.</p>
        </div>
      </div>
    </div>
  );
}
