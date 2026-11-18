"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Play, SpeakerHigh, ArrowUp, ArrowDown, ArrowCounterClockwise } from "@phosphor-icons/react";
import type { PtePublicItem, PteResult } from "@/lib/pte/scoring";

type Mode = "practice" | "exam";

/* ---------------- Audio: recording if uploaded, otherwise the browser reads the text ---------------- */

function beep(): Promise<void> {
  return new Promise((done) => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.frequency.value = 1000;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      osc.onended = () => { ctx.close(); done(); };
    } catch { done(); }
  });
}

function AudioBlock({ item, mode }: { item: PtePublicItem; mode: Mode }) {
  const [phase, setPhase] = useState<"countdown" | "playing" | "done" | "idle">(mode === "exam" ? "countdown" : "idle");
  const [left, setLeft] = useState(item.prepSeconds ?? 3);
  const audioRef = useRef<HTMLAudioElement>(null);

  const play = () => {
    setPhase("playing");
    if (item.audioUrl) {
      audioRef.current?.play().catch(() => setPhase("done"));
      return;
    }
    if (!item.ttsText || typeof speechSynthesis === "undefined") { setPhase("done"); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(item.ttsText);
    u.lang = "en-GB";
    u.rate = 0.95;
    u.onend = async () => { if (item.type === "l_smw") await beep(); setPhase("done"); };
    speechSynthesis.speak(u);
  };

  // Exam mode: real-test style countdown, then the clip plays once.
  useEffect(() => {
    if (phase !== "countdown") return;
    if (left <= 0) { play(); return; }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, left]);

  useEffect(() => () => { if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); }, []);

  const label =
    phase === "countdown" ? `Beginning in ${left} seconds` :
    phase === "playing" ? "Playing…" :
    phase === "done" ? (mode === "exam" ? "Completed" : "Finished — you can replay in practice mode") : "Status: ready";

  return (
    <div className="rounded-2xl border border-line bg-slate-50 p-4 flex flex-wrap items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-white text-primary flex items-center justify-center"><SpeakerHigh size={20} /></span>
      <p className="text-sm font-medium text-ink flex-1 min-w-[160px]" aria-live="polite">{label}</p>
      {mode === "practice" && phase !== "playing" && (
        <button type="button" onClick={play} className="sl-btn sl-btn-sm sl-btn-primary">
          <Play size={14} weight="fill" /> {phase === "done" ? "Replay" : "Play"}
        </button>
      )}
      {item.audioUrl && <audio ref={audioRef} src={item.audioUrl} preload="auto" onEnded={() => setPhase("done")} />}
      {!item.audioUrl && <p className="w-full text-[12px] text-ink-muted">Practice voice (computer-read). Recorded audio will replace this.</p>}
    </div>
  );
}

/* ---------------- Text with {{n}} gaps ---------------- */

function Gapped({ text, renderGap }: { text: string; renderGap: (id: string) => React.ReactNode }) {
  const parts = text.split(/(\{\{\d+\}\})/g);
  return (
    <p className="text-[15.5px] leading-[2.1] text-ink whitespace-pre-line">
      {parts.map((p, i) => {
        const m = p.match(/^\{\{(\d+)\}\}$/);
        return m ? <span key={i} className="inline-block align-middle mx-0.5">{renderGap(m[1])}</span> : <span key={i}>{p}</span>;
      })}
    </p>
  );
}

const choiceCls = (on: boolean) =>
  clsx("w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors",
    on ? "bg-[#FFF5CC] border-[#E9C94C]" : "bg-white border-line hover:border-[#C9D3FF]");

/* ---------------- Player ---------------- */

export function PtePlayer({ item, mode, disabled, onSubmit }: {
  item: PtePublicItem; mode: Mode; disabled: boolean; onSubmit: (response: unknown) => void;
}) {
  const [blanks, setBlanks] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [single, setSingle] = useState("");
  const [order, setOrder] = useState<string[]>(item.displayOrder || []);
  const [hiw, setHiw] = useState<number[]>([]);
  const [text, setText] = useState("");
  const [activeGap, setActiveGap] = useState<string | null>(null);

  const t = item.type;
  const response =
    t === "rw_fib" || t === "r_fib" || t === "l_fib" ? blanks :
    t === "r_mcma" || t === "l_mcma" ? picked :
    t === "r_reorder" ? order :
    t === "l_hiw" ? hiw :
    t === "l_wfd" ? text : single;

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const usedWords = Object.values(blanks);
  const placeWord = (w: string, gap?: string | null) => {
    const ids = [...(item.passage || "").matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]);
    setBlanks((b) => {
      const target = gap || ids.find((id) => !b[id]);
      return target ? { ...b, [target]: w } : b;
    });
    setActiveGap(null);
  };
  const move = (i: number, d: -1 | 1) => setOrder((o) => {
    const n = [...o]; const j = i + d;
    if (j < 0 || j >= n.length) return o;
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14.5px] text-ink-muted font-medium">{item.instructions}</p>
      {item.section === "listening" && <AudioBlock key={`${item.id}-${mode}`} item={item} mode={mode} />}

      {/* Reading passage for MC tasks */}
      {item.passage && (t === "r_mcma" || t === "r_mcsa") && (
        <div className="rounded-2xl bg-white border border-line p-4 md:p-5 text-[15.5px] leading-relaxed text-ink whitespace-pre-line">{item.passage}</div>
      )}

      {t === "rw_fib" && (
        <div className="rounded-2xl bg-white border border-line p-4 md:p-5">
          <Gapped text={item.passage || ""} renderGap={(id) => (
            <select aria-label={`Blank ${id}`} value={blanks[id] || ""} disabled={disabled}
              onChange={(e) => setBlanks((b) => ({ ...b, [id]: e.target.value }))}
              className="h-9 rounded-lg border border-[#C9D3FF] bg-soft px-2 text-[14px] font-semibold text-ink">
              <option value="">—</option>
              {item.blanks?.find((b) => String(b.id) === id)?.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )} />
        </div>
      )}

      {t === "r_fib" && (
        <>
          <div className="rounded-2xl bg-white border border-line p-4 md:p-5">
            <Gapped text={item.passage || ""} renderGap={(id) => (
              <button type="button" disabled={disabled}
                onClick={() => (blanks[id] ? setBlanks(({ [id]: _, ...rest }) => rest) : setActiveGap(activeGap === id ? null : id))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => placeWord(e.dataTransfer.getData("text/plain"), id)}
                aria-label={blanks[id] ? `Blank ${id}: ${blanks[id]}, tap to remove` : `Blank ${id}, empty`}
                className={clsx("min-w-[96px] h-9 px-3 rounded-lg border-2 border-dashed text-[14px] font-semibold",
                  blanks[id] ? "border-primary bg-soft text-[#2338C9] border-solid" : activeGap === id ? "border-primary bg-soft/60" : "border-[#C9CFDA] bg-slate-50")}>
                {blanks[id] || ""}
              </button>
            )} />
          </div>
          <div className="rounded-2xl border border-line bg-slate-50 p-3 flex flex-wrap gap-2" aria-label="Word bank">
            {item.wordBank?.filter((w) => !usedWords.includes(w)).map((w) => (
              <button key={w} type="button" draggable={!disabled} disabled={disabled}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", w)}
                onClick={() => placeWord(w, activeGap)}
                className="h-9 px-3 rounded-lg bg-white border border-line text-[14px] font-semibold text-ink hover:border-primary cursor-grab">
                {w}
              </button>
            ))}
          </div>
          <p className="text-[12.5px] text-ink-muted">Drag a word into a gap, or tap a gap and then a word. Tap a filled gap to send the word back.</p>
        </>
      )}

      {t === "l_fib" && (
        <div className="rounded-2xl bg-white border border-line p-4 md:p-5">
          <Gapped text={item.passage || ""} renderGap={(id) => (
            <input aria-label={`Blank ${id}`} value={blanks[id] || ""} disabled={disabled} autoComplete="off" autoCapitalize="off" spellCheck={false}
              onChange={(e) => setBlanks((b) => ({ ...b, [id]: e.target.value }))}
              className="w-[120px] h-9 rounded-lg border border-[#C9D3FF] px-2 text-[14px] text-ink" />
          )} />
        </div>
      )}

      {(item.question && t !== "l_hcs") && <p className="text-[15.5px] font-semibold text-ink">{item.question}</p>}

      {(t === "r_mcma" || t === "l_mcma") && (
        <div className="grid gap-2" role="group" aria-label="Options">
          {item.options?.map((o) => (
            <label key={o.id} className={choiceCls(picked.includes(o.id))}>
              <input type="checkbox" className="mt-1 w-4 h-4" checked={picked.includes(o.id)} disabled={disabled} onChange={() => setPicked((p) => toggle(p, o.id))} />
              <span className="text-[14.5px] text-ink">{o.text}</span>
            </label>
          ))}
        </div>
      )}

      {(t === "r_mcsa" || t === "l_mcsa" || t === "l_hcs" || t === "l_smw") && (
        <div className="grid gap-2" role="radiogroup" aria-label="Options">
          {item.options?.map((o) => (
            <label key={o.id} className={choiceCls(single === o.id)}>
              <input type="radio" name={`pte-${item.id}`} className="mt-1 w-4 h-4" checked={single === o.id} disabled={disabled} onChange={() => setSingle(o.id)} />
              <span className="text-[14.5px] text-ink">{o.text}</span>
            </label>
          ))}
        </div>
      )}

      {t === "r_reorder" && (
        <ol className="grid gap-2">
          {order.map((id, i) => (
            <li key={id} className="flex items-start gap-2 p-3 rounded-xl border border-line bg-white">
              <span className="w-7 h-7 rounded-lg bg-soft text-primary text-[13px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="flex-1 text-[14.5px] text-ink">{item.paragraphs?.find((p) => p.id === id)?.text}</span>
              <span className="flex flex-col gap-1 shrink-0">
                <button type="button" aria-label="Move up" disabled={disabled || i === 0} onClick={() => move(i, -1)} className="w-9 h-9 rounded-lg border border-line flex items-center justify-center disabled:opacity-30"><ArrowUp size={16} /></button>
                <button type="button" aria-label="Move down" disabled={disabled || i === order.length - 1} onClick={() => move(i, 1)} className="w-9 h-9 rounded-lg border border-line flex items-center justify-center disabled:opacity-30"><ArrowDown size={16} /></button>
              </span>
            </li>
          ))}
        </ol>
      )}

      {t === "l_hiw" && (
        <div className="rounded-2xl bg-white border border-line p-4 md:p-5 leading-[2.2] text-[15.5px]">
          {(item.displayedText || "").split(/\s+/).map((w, i) => (
            <button key={i} type="button" disabled={disabled} aria-pressed={hiw.includes(i)} onClick={() => setHiw((h) => toggle(h, i))}
              className={clsx("px-0.5 rounded", hiw.includes(i) ? "bg-[#FFE066]" : "hover:bg-slate-100")}>
              {w}
            </button>
          )).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, " ", el] : [el]), [])}
        </div>
      )}

      {t === "l_wfd" && (
        <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={disabled} rows={3} aria-label="Type the sentence you heard"
          autoCapitalize="off" autoComplete="off" spellCheck={false}
          className="w-full rounded-2xl border border-line p-4 text-[15.5px] text-ink" placeholder="Type the sentence exactly as you hear it" />
      )}

      {!disabled && (
        <div className="flex justify-end">
          <button type="button" onClick={() => onSubmit(response)} className="sl-btn sl-btn-primary">Submit answer</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Marking result ---------------- */

export function PteResultPanel({ item, result, onRetry }: { item: PtePublicItem; result: PteResult; onRetry: () => void }) {
  const opt = (id: string) => item.options?.find((o) => o.id === id)?.text || id;
  const k = result.key as Record<string, string> | string[] | string | { index: number; shown: string; spoken: string }[];
  const pct = result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0;
  return (
    <section className="sl-card p-4 md:p-5 flex flex-col gap-3" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wide text-ink-muted">Your mark</p>
          <p className="font-display text-3xl font-extrabold text-ink">{result.score}<span className="text-ink-muted text-xl"> / {result.maxScore}</span></p>
        </div>
        <span className={clsx("pill-sm", pct === 100 ? "bg-[#E6F8F1] text-[#08795A]" : pct >= 50 ? "bg-[#FFF5E0] text-[#8A5300]" : "bg-[#FFECEF] text-[#C0283D]")}>{pct}%</span>
      </div>
      <div className="rounded-xl bg-slate-50 p-3 text-[14.5px] text-ink">
        <p className="font-semibold mb-1">Correct answer</p>
        {item.type === "l_hiw" && Array.isArray(k) ? (
          <ul className="list-disc pl-5">{(k as { shown: string; spoken: string }[]).map((a, i) => <li key={i}><b>{a.shown}</b> → the speaker said “{a.spoken}”</li>)}</ul>
        ) : item.type === "r_reorder" && Array.isArray(k) ? (
          <ol className="list-decimal pl-5">{(k as string[]).map((id) => <li key={id}>{item.paragraphs?.find((p) => p.id === id)?.text}</li>)}</ol>
        ) : Array.isArray(k) ? (
          <ul className="list-disc pl-5">{(k as string[]).map((id) => <li key={id}>{opt(id)}</li>)}</ul>
        ) : typeof k === "string" ? (
          <p>{item.options ? opt(k) : k}</p>
        ) : (
          <ol className="list-decimal pl-5">{Object.entries(k).map(([n, w]) => <li key={n} value={Number(n)}>{w}</li>)}</ol>
        )}
      </div>
      {result.explanation && <p className="text-[14px] text-ink-muted"><b className="text-ink">Why: </b>{result.explanation}</p>}
      <div className="flex justify-end">
        <button type="button" onClick={onRetry} className="sl-btn sl-btn-outline"><ArrowCounterClockwise size={16} /> Try again</button>
      </div>
    </section>
  );
}
