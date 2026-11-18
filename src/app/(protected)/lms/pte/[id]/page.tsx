"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { clsx } from "clsx";
import { CircleNotch, ArrowLeft, ArrowRight, WarningCircle } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { pteApi, type PteListEntry } from "@/lib/pte/client";
import { TYPE_LABELS, type PtePublicItem, type PteResult } from "@/lib/pte/scoring";
import { PtePlayer, PteResultPanel } from "@/components/pte/PtePlayer";

export default function PteItemPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<PtePublicItem | null>(null);
  const [list, setList] = useState<PteListEntry[]>([]);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [result, setResult] = useState<PteResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0); // bump to reset the player

  useEffect(() => {
    if (!user || !id) return;
    setItem(null); setResult(null); setError("");
    pteApi.item(id).then((r) => setItem(r.item)).catch((e) => setError(e.message));
    pteApi.list().then((r) => setList(r.items)).catch(() => {});
  }, [user, id]);

  const sameType = list.filter((i) => i.type === item?.type);
  const pos = sameType.findIndex((i) => i.id === id);
  const prev = sameType[pos - 1];
  const next = sameType[pos + 1];

  const submit = async (response: unknown) => {
    if (!item) return;
    setSaving(true);
    try {
      setResult(await pteApi.score(item.id, response, mode));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !item) {
    return (
      <div className="sl-card p-6 max-w-xl mx-auto mt-10 flex flex-col items-center gap-3 text-center">
        <WarningCircle size={32} className="text-[#C0283D]" />
        <p className="text-ink">{error}</p>
        <Link href="/lms/pte" className="sl-btn sl-btn-outline">Back to PTE training</Link>
      </div>
    );
  }
  if (!item) return <div className="min-h-[50vh] flex items-center justify-center"><CircleNotch size={32} className="animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/lms/pte" className="text-[13px] font-semibold text-primary inline-flex items-center gap-1"><ArrowLeft size={14} /> PTE training</Link>
          <h1 className="text-[20px] md:text-[24px] font-extrabold text-ink leading-tight">{TYPE_LABELS[item.type]}</h1>
          <p className="text-[13px] text-ink-muted">
            Question {pos + 1 || "–"} of {sameType.length || "–"} · {item.maxScore} mark{item.maxScore === 1 ? "" : "s"} · {item.section}
          </p>
        </div>
        {item.section === "listening" && (
          <div role="tablist" aria-label="Mode" className="flex gap-1 p-1 bg-white border border-line rounded-xl">
            {(["practice", "exam"] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} disabled={!!result}
                onClick={() => { setMode(m); setAttempt((a) => a + 1); }}
                className={clsx("h-9 px-3 rounded-lg text-[13px] font-semibold capitalize", mode === m ? "bg-ink text-white" : "text-slate-600")}>
                {m === "exam" ? "Exam (plays once)" : "Practice"}
              </button>
            ))}
          </div>
        )}
      </div>

      <section className="sl-card p-4 md:p-6">
        <PtePlayer key={`${item.id}-${attempt}`} item={item} mode={mode} disabled={!!result || saving} onSubmit={submit} />
        {saving && <p className="text-sm text-ink-muted mt-3 flex items-center gap-2"><CircleNotch size={16} className="animate-spin" /> Marking…</p>}
        {error && item && <p className="text-sm text-[#C0283D] mt-3">{error}</p>}
      </section>

      {result && <PteResultPanel item={item} result={result} onRetry={() => { setResult(null); setAttempt((a) => a + 1); }} />}

      <div className="flex justify-between gap-2">
        {prev ? <Link href={`/lms/pte/${prev.id}`} className="sl-btn sl-btn-outline"><ArrowLeft size={16} /> Previous</Link> : <span />}
        {next && <Link href={`/lms/pte/${next.id}`} className="sl-btn sl-btn-primary">Next <ArrowRight size={16} /></Link>}
      </div>
    </div>
  );
}
