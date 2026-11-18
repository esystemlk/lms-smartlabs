"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { BookOpenText, Headphones, CircleNotch, LockSimple, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { pteApi, type PteListEntry } from "@/lib/pte/client";
import { TYPE_LABELS, TYPE_ORDER, type PteType } from "@/lib/pte/scoring";

export default function PteTrainingPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<PteListEntry[] | null>(null);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [section, setSection] = useState<"reading" | "listening">("reading");

  useEffect(() => {
    if (!user) return;
    pteApi.list().then((r) => setItems(r.items)).catch((e) => setError({ status: e.status, message: e.message }));
  }, [user]);

  const byType = useMemo(() => {
    const m = new Map<PteType, PteListEntry[]>();
    (items || []).forEach((i) => m.set(i.type, [...(m.get(i.type) || []), i]));
    return m;
  }, [items]);

  if (error) {
    return (
      <div className="sl-card p-8 max-w-xl mx-auto mt-10 text-center flex flex-col items-center gap-3">
        <span className="w-14 h-14 rounded-2xl bg-soft text-primary flex items-center justify-center"><LockSimple size={28} /></span>
        <h1 className="text-xl font-bold text-ink">PTE Academic Training</h1>
        <p className="text-ink-muted text-sm">
          {error.status === 403 ? "PTE training is included with PTE courses. Enrol in a PTE course to unlock it." : error.message}
        </p>
        <Link href="/courses" className="sl-btn sl-btn-primary">Browse courses</Link>
      </div>
    );
  }
  if (!items) return <div className="min-h-[50vh] flex items-center justify-center"><CircleNotch size={32} className="animate-spin text-primary" /></div>;

  const done = items.filter((i) => i.best !== null).length;
  const types = TYPE_ORDER.filter((t) => byType.get(t)?.[0]?.section === section);

  return (
    <div className="flex flex-col gap-5">
      <section className="sl-hero sl-rise relative overflow-hidden rounded-[26px] p-5 md:p-7 text-white">
        <h1 className="text-[24px] md:text-[30px] font-extrabold">PTE Academic Training</h1>
        <p className="text-[#DCE2FF] mt-1 text-sm md:text-base max-w-2xl">
          Practice every PTE task that is marked by an answer key, in the real test format, with instant marking and explanations.
        </p>
        <div className="mt-4 flex items-center gap-3 max-w-md">
          <div className="flex-1 h-2.5 rounded-full bg-white/20 overflow-hidden">
            <span className="block h-full bg-white rounded-full" style={{ width: `${(done / Math.max(items.length, 1)) * 100}%` }} />
          </div>
          <span className="text-sm font-semibold whitespace-nowrap">{done} / {items.length} done</span>
        </div>
      </section>

      <div role="tablist" className="flex gap-1 p-1.5 bg-white dark:bg-slate-900 border border-line rounded-2xl w-fit">
        {(["reading", "listening"] as const).map((s) => (
          <button key={s} type="button" role="tab" aria-selected={section === s} onClick={() => setSection(s)}
            className={clsx("h-10 px-4 rounded-xl inline-flex items-center gap-2 text-sm font-semibold capitalize", section === s ? "bg-ink text-white" : "text-slate-600")}>
            {s === "reading" ? <BookOpenText size={18} /> : <Headphones size={18} />} {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {types.map((t) => {
          const list = byType.get(t) || [];
          const next = list.find((i) => i.best === null) || list[0];
          const got = list.reduce((s, i) => s + (i.best ?? 0), 0);
          const max = list.reduce((s, i) => s + i.maxScore, 0);
          return (
            <section key={t} className="sl-card p-4 md:p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[16px] font-bold text-ink">{TYPE_LABELS[t]}</h2>
                  <p className="text-[13px] text-ink-muted">{list.filter((i) => i.best !== null).length} of {list.length} done · {got}/{max} marks</p>
                </div>
                <Link href={`/lms/pte/${next.id}`} className="sl-btn sl-btn-sm sl-btn-primary shrink-0">Practice <ArrowRight size={14} /></Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {list.map((i, n) => (
                  <Link key={i.id} href={`/lms/pte/${i.id}`} title={i.best === null ? "Not tried" : `Best ${i.best}/${i.maxScore}`}
                    className={clsx("w-9 h-9 rounded-lg text-[13px] font-semibold flex items-center justify-center border",
                      i.best === null ? "border-line text-slate-600 hover:border-primary" : i.best === i.maxScore ? "bg-[#E6F8F1] border-[#B7EBD6] text-[#08795A]" : "bg-[#FFF5E0] border-[#F7DFAE] text-[#8A5300]")}>
                    {i.best === i.maxScore ? <CheckCircle size={16} weight="fill" /> : n + 1}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
