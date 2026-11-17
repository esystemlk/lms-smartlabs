"use client";

import { useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  MagnifyingGlass,
  VideoCamera,
  FilmStrip,
  BookOpenText,
  ArrowSquareOut,
  ArrowClockwise,
  CircleNotch,
  WarningCircle,
  CalendarBlank,
  Users,
} from "@phosphor-icons/react";
import { courseService } from "@/services/courseService";
import { bunnyService } from "@/services/bunnyService";

type Source = "class" | "batch" | "lesson";

interface CheckVideo {
  key: string;
  title: string;
  /** Bunny video GUID, or a full URL */
  video: string;
  courseTitle: string;
  extra?: string; // batch names or lesson position
  date?: string;
  source: Source;
}

const SOURCE_LABEL: Record<Source, string> = {
  class: "Live class recording",
  batch: "Batch recording",
  lesson: "Course lesson",
};

const FALLBACK_LIBRARY_ID = "301323"; // same fallback the Schedule Classes preview uses

/** Turn a stored video value into something we can play: a Bunny/YouTube iframe or a direct file. */
export function playableSource(video: string, libraryId: string): { kind: "iframe" | "file"; src: string } {
  const v = video.trim();
  if (!v.includes("http")) {
    return {
      kind: "iframe",
      src: `https://player.mediadelivery.net/embed/${libraryId || FALLBACK_LIBRARY_ID}/${v}?autoplay=false&preload=true&playsinline=true`,
    };
  }
  const yt = v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  if (v.includes("mediadelivery.net")) return { kind: "iframe", src: v.replace("/play/", "/embed/") };
  if (v.includes("vimeo.com")) {
    const id = v.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
    if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }
  return { kind: "file", src: v };
}

const toTime = (d?: string) => (d ? new Date(d).getTime() || 0 : 0);

/**
 * Admin / lecturer page to watch every uploaded video and confirm the right
 * file is attached to the right class or lesson.
 */
export function VideoCheckTab() {
  const [items, setItems] = useState<CheckVideo[]>([]);
  const [libraryId, setLibraryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("all");
  const [source, setSource] = useState<"all" | Source>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [settings, live, batchRecs, courses, batches] = await Promise.all([
        bunnyService.getSettings().catch(() => ({} as any)),
        courseService.getPastLiveClasses().catch(() => []),
        courseService.getAllBatchRecordings().catch(() => []),
        courseService.getAllCourses().catch(() => []),
        courseService.getAllBatches().catch(() => []),
      ]);
      setLibraryId(settings?.bunnyLibraryId || "");

      const titleOf = (id?: string) => (id && (courses as any[]).find((c) => c.id === id)?.title) || "No course";
      const batchName: Record<string, string> = {};
      (batches as any[]).forEach((b) => (batchName[b.id] = b.name || "Batch"));
      const batchesOf = (ids: string[] = []) => ids.map((id) => batchName[id]).filter(Boolean).join(", ");

      const list: CheckVideo[] = [];
      (live as any[]).forEach((l) => {
        const video = l.bunnyVideoId || l.recordingUrl;
        if (!video) return;
        list.push({ key: `class_${l.id}`, title: l.title || "Untitled class", video, courseTitle: titleOf(l.courseId), extra: batchesOf(l.batchIds), date: l.startTime, source: "class" });
      });
      (batchRecs as any[]).forEach((r) => {
        const video = r.bunnyVideoId || r.recordingUrl;
        if (!video) return;
        list.push({ key: `batch_${r.id}`, title: r.title || "Untitled recording", video, courseTitle: titleOf(r.courseId), extra: batchesOf(r.batchIds), date: r.startTime, source: "batch" });
      });

      // Lesson videos live under each course; fetch courses in parallel.
      const lessonLists = await Promise.all(
        (courses as any[]).map((c) => courseService.getLessons(c.id).then((ls) => ({ c, ls })).catch(() => ({ c, ls: [] as any[] })))
      );
      lessonLists.forEach(({ c, ls }) =>
        ls.forEach((l: any, i: number) => {
          if (!l.videoUrl) return;
          list.push({ key: `lesson_${c.id}_${l.id}`, title: l.title || `Lesson ${i + 1}`, video: l.videoUrl, courseTitle: c.title || "Course", extra: `Lesson ${i + 1}`, date: l.updatedAt?.toDate?.()?.toISOString?.() || l.createdAt?.toDate?.()?.toISOString?.(), source: "lesson" });
        })
      );

      list.sort((a, b) => toTime(b.date) - toTime(a.date));
      setItems(list);
      setSelectedKey((k) => k ?? list[0]?.key ?? null);
    } catch (e: any) {
      setError(e?.message || "Could not load videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const courseOptions = useMemo(() => Array.from(new Set(items.map((i) => i.courseTitle))).sort(), [items]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (i) =>
        (course === "all" || i.courseTitle === course) &&
        (source === "all" || i.source === source) &&
        (!q || `${i.title} ${i.courseTitle} ${i.extra || ""}`.toLowerCase().includes(q))
    );
  }, [items, search, course, source]);

  const selected = items.find((i) => i.key === selectedKey) || visible[0];
  const player = selected ? playableSource(selected.video, libraryId) : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5 items-start">
      {/* Player */}
      <section className="sl-card overflow-hidden xl:sticky xl:top-36">
        <div className="aspect-video w-full bg-black">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-white/70"><CircleNotch size={32} className="animate-spin" /></div>
          ) : !player ? (
            <div className="w-full h-full flex items-center justify-center text-white/70 text-sm px-6 text-center">No uploaded videos found yet.</div>
          ) : player.kind === "iframe" ? (
            <iframe
              key={selected!.key}
              src={player.src}
              title={selected!.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video key={selected!.key} src={player.src} controls className="w-full h-full object-contain" />
          )}
        </div>
        {selected && (
          <div className="p-4 md:p-5 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="pill-sm bg-soft text-primary">{SOURCE_LABEL[selected.source]}</span>
                <h2 className="text-lg md:text-xl font-bold text-ink dark:text-white mt-2 break-words">{selected.title}</h2>
              </div>
              {player && (
                <a href={player.src} target="_blank" rel="noopener noreferrer" className="sl-btn sl-btn-sm sl-btn-outline shrink-0">
                  <ArrowSquareOut size={16} /> Open full screen
                </a>
              )}
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13.5px]">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Course</dt>
                <dd className="font-semibold text-ink dark:text-white mt-0.5 break-words">{selected.courseTitle}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{selected.source === "lesson" ? "Position" : "Batches"}</dt>
                <dd className="font-semibold text-ink dark:text-white mt-0.5 break-words">{selected.extra || "—"}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{selected.source === "lesson" ? "Last updated" : "Class date"}</dt>
                <dd className="font-semibold text-ink dark:text-white mt-0.5">{selected.date ? new Date(selected.date).toLocaleString() : "—"}</dd>
              </div>
            </dl>
            <p className="text-[13px] text-ink-muted">
              Watch a few seconds to confirm this is the right video. If it&apos;s wrong, replace it from Schedule Classes, Live Recordings or the course&apos;s lessons.
            </p>
          </div>
        )}
      </section>

      {/* List */}
      <section className="sl-card p-4 flex flex-col gap-3 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[17px] font-bold text-ink dark:text-white">Uploaded videos <span className="text-ink-muted font-semibold">({visible.length})</span></h3>
          <button type="button" onClick={load} className="sl-btn sl-btn-sm sl-btn-soft" aria-label="Reload videos">
            <ArrowClockwise size={16} /> <span className="hidden sm:inline">Reload</span>
          </button>
        </div>
        <label className="h-11 rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center gap-2 px-3 text-ink-muted">
          <MagnifyingGlass size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, course or batch…" className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] text-ink dark:text-white" />
        </label>
        <select value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Filter by course" className="h-11 rounded-xl border border-line dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-[14.5px] text-ink dark:text-white">
          <option value="all">All courses</option>
          {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex flex-wrap gap-2">
          {([["all", "All"], ["class", "Live classes"], ["batch", "Batch"], ["lesson", "Lessons"]] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setSource(id)} className={clsx("h-9 px-3.5 rounded-full border text-[13px] font-semibold", source === id ? "bg-soft border-[#C9D3FF] text-[#2338C9]" : "border-line dark:border-slate-700 text-slate-600 dark:text-slate-300")}>
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-[#FFECEF] text-[#C0283D] p-3 text-sm"><WarningCircle size={18} /> {error}</div>
        )}

        <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1 -mr-1">
          {loading
            ? [0, 1, 2, 3].map((i) => <div key={i} className="h-[68px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)
            : visible.length === 0
              ? <p className="text-sm text-ink-muted text-center py-8">No videos match these filters.</p>
              : visible.map((v) => {
                  const on = v.key === selected?.key;
                  const Icon = v.source === "lesson" ? BookOpenText : v.source === "class" ? VideoCamera : FilmStrip;
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => {
                        setSelectedKey(v.key);
                        if (window.innerWidth < 1280) window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      aria-pressed={on}
                      className={clsx(
                        "w-full text-left flex items-start gap-3 p-3 rounded-2xl border transition-colors",
                        on ? "bg-soft border-[#C9D3FF] dark:bg-blue-500/15" : "bg-slate-50 dark:bg-slate-800/60 border-transparent hover:border-line"
                      )}
                    >
                      <span className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", on ? "bg-primary text-white" : "bg-white dark:bg-slate-900 text-primary")}>
                        <Icon size={20} weight={on ? "fill" : "regular"} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-[14px] text-ink dark:text-white line-clamp-2">{v.title}</span>
                        <span className="block text-[12.5px] text-ink-muted truncate">{v.courseTitle}</span>
                        <span className="flex flex-wrap gap-x-3 text-[12px] text-ink-muted mt-0.5">
                          {v.date && <span className="inline-flex items-center gap-1"><CalendarBlank size={13} /> {new Date(v.date).toLocaleDateString()}</span>}
                          {v.extra && <span className="inline-flex items-center gap-1 min-w-0"><Users size={13} /> <span className="truncate max-w-[160px]">{v.extra}</span></span>}
                        </span>
                      </span>
                    </button>
                  );
                })}
        </div>
      </section>
    </div>
  );
}
