"use client";

import { useState } from "react";
import { FilmStrip, X, ArrowsClockwise, CircleNotch, Trash } from "@phosphor-icons/react";
import type { Batch, Course } from "@/lib/types";
import { recordingPackagesApi, formatLKR, formatUSD, type FxRate, type RecordingPackage } from "@/lib/recordingPackages.client";

interface Props {
  course: Course;
  batch: Batch;
  existing: RecordingPackage | null;
  fx: FxRate | null;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Admin: sell an ended batch as a recording package. Sets the name, description, LKR price, and the USD
 * price (follows today's LKR→USD rate unless a fixed USD price is set), access length and whether it is on sale.
 */
export function RecordingPackageModal({ course, batch, existing, fx, onClose, onSaved }: Props) {
  const videoCount = batch.recordedClasses?.length || 0;
  const [name, setName] = useState(existing?.name || `${course.title} – ${batch.name} (Recordings)`);
  const [description, setDescription] = useState(
    existing?.description ||
      `Every recorded class from the ${batch.name} batch of ${course.title}, plus the course resources and grammar lessons.`,
  );
  const [priceLKR, setPriceLKR] = useState(String(existing?.priceLKR ?? ""));
  const [fixedUsd, setFixedUsd] = useState(existing?.priceUSD != null);
  const [priceUSD, setPriceUSD] = useState(existing?.priceUSD != null ? String(existing.priceUSD) : "");
  const [accessMonths, setAccessMonths] = useState(String(existing?.accessMonths ?? 12));
  const [published, setPublished] = useState(existing?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const lkr = Number(priceLKR) || 0;
  const liveUsd = fx && lkr ? Math.max(1, Math.ceil((lkr / fx.rate) * 100) / 100) : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const fields = {
      name: name.trim(),
      description: description.trim(),
      priceLKR: lkr,
      priceUSD: fixedUsd ? Number(priceUSD) || null : null,
      accessMonths: Number(accessMonths) || 12,
      published,
    };
    try {
      if (existing) await recordingPackagesApi.update(existing.id, fields);
      else await recordingPackagesApi.create(course.id, batch.id, fields);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!existing || !confirm("Take this package off sale? People who already bought it keep their access.")) return;
    setSaving(true);
    try {
      await recordingPackagesApi.remove(existing.id);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const field = "w-full h-11 px-3.5 rounded-xl border border-line bg-white dark:bg-slate-900 dark:border-slate-700 text-sm text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[26px] bg-white dark:bg-slate-900 shadow-2xl"
      >
        <div className="sl-hero relative overflow-hidden rounded-t-[26px] p-5 text-white">
          <span aria-hidden className="absolute -right-10 -top-14 w-40 h-40 rounded-full bg-[radial-gradient(circle,#9EB0FF,transparent_70%)] opacity-60" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                <FilmStrip size={22} weight="duotone" />
              </span>
              <div>
                <h2 className="font-display text-lg font-extrabold leading-tight">{existing ? "Edit recording package" : "Sell as recording package"}</h2>
                <p className="text-[13px] text-[#DCE2FF]">{batch.name} · {videoCount} recorded class{videoCount === 1 ? "" : "es"}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/15">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {videoCount === 0 && (
            <p className="text-[13px] rounded-xl bg-[#FFF5E0] text-[#8A5300] px-3.5 py-2.5">
              This batch has no recorded classes yet. Add them with the Recordings button before selling it.
            </p>
          )}

          <label className="block">
            <span className="text-[13px] font-semibold text-ink dark:text-slate-200">Package name</span>
            <input className={`${field} mt-1.5`} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
          </label>

          <label className="block">
            <span className="text-[13px] font-semibold text-ink dark:text-slate-200">Description</span>
            <textarea
              className={`${field} mt-1.5 h-24 py-2.5 resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1500}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[13px] font-semibold text-ink dark:text-slate-200">Price (LKR)</span>
              <input className={`${field} mt-1.5`} type="number" min={50} step="1" value={priceLKR} onChange={(e) => setPriceLKR(e.target.value)} required />
            </label>
            <label className="block">
              <span className="text-[13px] font-semibold text-ink dark:text-slate-200">Access (months)</span>
              <input className={`${field} mt-1.5`} type="number" min={1} max={60} value={accessMonths} onChange={(e) => setAccessMonths(e.target.value)} required />
            </label>
          </div>

          <div className="rounded-2xl border border-line dark:border-slate-700 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-ink dark:text-slate-200">USD price</p>
                <p className="text-[12px] text-ink-muted flex items-center gap-1">
                  <ArrowsClockwise size={12} />
                  {fx ? `Today: 1 USD = ${fx.rate.toFixed(2)} LKR${fx.source === "fallback" ? " (estimate, live rate unavailable)" : ""}` : "Loading rate…"}
                </p>
              </div>
              <span className="font-display text-lg font-extrabold text-primary">
                {fixedUsd ? (Number(priceUSD) ? formatUSD(Number(priceUSD)) : "–") : liveUsd ? formatUSD(liveUsd) : "–"}
              </span>
            </div>
            <div role="radiogroup" className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-soft dark:bg-slate-800">
              {[
                { v: false, label: "Follow today's rate" },
                { v: true, label: "Fixed USD price" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  type="button"
                  role="radio"
                  aria-checked={fixedUsd === o.v}
                  onClick={() => {
                    setFixedUsd(o.v);
                    if (o.v && !priceUSD && liveUsd) setPriceUSD(String(liveUsd));
                  }}
                  className={`h-9 rounded-lg text-[13px] font-semibold transition-colors ${fixedUsd === o.v ? "bg-white dark:bg-slate-900 text-ink dark:text-white shadow-sm" : "text-ink-muted"}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {fixedUsd && (
              <input className={field} type="number" min={1} step="0.01" value={priceUSD} onChange={(e) => setPriceUSD(e.target.value)} placeholder="e.g. 19.99" required />
            )}
          </div>

          <label className="flex items-center justify-between gap-3 rounded-2xl border border-line dark:border-slate-700 p-3.5 cursor-pointer">
            <span>
              <span className="block text-[13px] font-semibold text-ink dark:text-slate-200">On sale</span>
              <span className="block text-[12px] text-ink-muted">Shown in the Recorded Courses store for anyone to buy</span>
            </span>
            <input type="checkbox" className="w-5 h-5 accent-[#3B5BFD]" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          </label>

          {lkr > 0 && (
            <p className="text-[12.5px] text-ink-muted">
              Buyers pay {formatLKR(lkr)} or {fixedUsd ? (Number(priceUSD) ? formatUSD(Number(priceUSD)) : "the USD price") : liveUsd ? `about ${formatUSD(liveUsd)}` : "USD"} through PayHere and get access straight away for {Number(accessMonths) || 12} months.
            </p>
          )}

          {error && <p className="text-[13px] rounded-xl bg-red-50 text-red-700 px-3.5 py-2.5">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 pb-5">
          {existing ? (
            <button type="button" onClick={remove} disabled={saving} className="h-10 px-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 inline-flex items-center gap-1.5">
              <Trash size={16} /> Remove
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-semibold text-ink-muted hover:bg-soft">Cancel</button>
            <button type="submit" disabled={saving} className="h-10 px-5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-[#2338C9] disabled:opacity-60 inline-flex items-center gap-2">
              {saving && <CircleNotch size={16} className="animate-spin" />}
              {existing ? "Save changes" : "Create package"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
