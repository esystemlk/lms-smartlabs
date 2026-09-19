"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { courseService } from "@/services/courseService";
import { bunnyService } from "@/services/bunnyService";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import {
  Loader2, Download, Search, Video, AlertTriangle, FileDown, Link as LinkIcon, RefreshCw,
} from "lucide-react";

interface VideoItem {
  key: string;
  title: string;
  videoId: string;        // bunny guid or external url
  courseId?: string;
  courseTitle: string;
  batchIds: string[];
  date?: string;
  binded: boolean;
  source: "live" | "batch" | "library";
}

export function VideoLibraryTab() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const isAdmin = ["admin", "superadmin", "developer"].includes(userData?.role || "");

  const [items, setItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryId, setLibraryId] = useState("");
  const [cdnHostname, setCdnHostname] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [includeLibrary, setIncludeLibrary] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async (withLibrary: boolean) => {
    setLoading(true);
    try {
      const settings = await bunnyService.getSettings();
      setLibraryId(settings.bunnyLibraryId || "");
      setCdnHostname(settings.bunnyCdnHostname || "");

      const [live, batchRecs, courses, lib] = await Promise.all([
        courseService.getPastLiveClasses().catch(() => []),
        courseService.getAllBatchRecordings().catch(() => []),
        courseService.getAllCourses().catch(() => []),
        withLibrary ? bunnyService.getVideos(1, 500).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
      ]);

      const courseTitle = (id?: string) =>
        (id && courses.find((c: any) => c.id === id)?.title) || "—";

      const list: VideoItem[] = [];

      // Live class recordings (these carry binded course/timeslot info)
      (live as any[]).forEach((l) => {
        const vid = l.bunnyVideoId || l.recordingUrl;
        if (!vid) return;
        const binded = !!(l.bindedCourseIds?.length || l.bindedTimeSlotIds?.length);
        list.push({
          key: `live_${l.id}`,
          title: l.title || "Untitled recording",
          videoId: vid,
          courseId: l.courseId,
          courseTitle: courseTitle(l.courseId),
          batchIds: l.batchIds || [],
          date: l.startTime,
          binded,
          source: "live",
        });
      });

      // Batch (attached) recordings
      (batchRecs as any[]).forEach((r) => {
        const vid = r.bunnyVideoId || r.recordingUrl;
        if (!vid) return;
        list.push({
          key: `batch_${r.id}`,
          title: r.title || "Untitled recording",
          videoId: vid,
          courseId: r.courseId,
          courseTitle: courseTitle(r.courseId),
          batchIds: r.batchIds || [],
          date: r.startTime,
          binded: false,
          source: "batch",
        });
      });

      // Optionally include any other uploaded videos from the Bunny library
      if (withLibrary) {
        const known = new Set(list.map((v) => v.videoId));
        (lib.items || []).forEach((v: any) => {
          if (known.has(v.guid)) return;
          list.push({
            key: `lib_${v.guid}`,
            title: v.title || "Untitled",
            videoId: v.guid,
            courseTitle: "Unlinked (Bunny library)",
            batchIds: [],
            date: v.dateUploaded,
            binded: false,
            source: "library",
          });
        });
      }

      setItems(list);
    } catch (e: any) {
      toast(e.message || "Failed to load videos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(includeLibrary); /* eslint-disable-next-line */ }, [includeLibrary]);

  const courseOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.courseTitle))).sort(),
    [items]
  );

  const filtered = items.filter((i) => {
    const s = search.toLowerCase();
    const matchesSearch = i.title.toLowerCase().includes(s) || i.courseTitle.toLowerCase().includes(s);
    const matchesCourse = courseFilter === "all" || i.courseTitle === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const downloadUrlFor = (v: VideoItem) => bunnyService.getDownloadUrl(v.videoId, cdnHostname);

  const triggerDownload = (v: VideoItem) => {
    const url = downloadUrlFor(v);
    if (!url) {
      toast("Set the Bunny CDN hostname in Settings to enable downloads.", "error");
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `${v.title}.mp4`;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((i) => i.key)));
  };

  const bulkDownload = async () => {
    if (!cdnHostname) {
      toast("Set the Bunny CDN hostname in Settings to enable downloads.", "error");
      return;
    }
    const chosen = filtered.filter((i) => selected.has(i.key));
    if (chosen.length === 0) return;
    toast(`Starting ${chosen.length} downloads…`, "success");
    // Stagger so the browser doesn't block the rapid succession of downloads.
    for (let i = 0; i < chosen.length; i++) {
      triggerDownload(chosen[i]);
      await new Promise((r) => setTimeout(r, 800));
    }
  };

  const exportLinks = () => {
    const chosen = selected.size > 0 ? filtered.filter((i) => selected.has(i.key)) : filtered;
    let csv = "Title,Course,Date,Download URL,Play URL\n";
    chosen.forEach((v) => {
      const dl = downloadUrlFor(v);
      const play = v.videoId.startsWith("http")
        ? v.videoId
        : `https://iframe.mediadelivery.net/play/${libraryId}/${v.videoId}`;
      const safe = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
      csv += `${safe(v.title)},${safe(v.courseTitle)},${safe(v.date || "")},${safe(dl)},${safe(play)}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video_links_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-sm text-gray-600 dark:text-gray-300">
        <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-500" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Admins only</p>
          <p>Downloading recordings is restricted to administrators.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-blue" /></div>;

  return (
    <div className="space-y-4">
      {!cdnHostname && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-xl p-4 text-sm">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Downloads need a CDN hostname</p>
            <p>Set <strong>Bunny CDN Hostname</strong> in Settings and enable MP4 Fallback in your Bunny library to enable direct downloads. You can still export links below.</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or course..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
          />
        </div>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
        >
          <option value="all">All courses</option>
          {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
          <input type="checkbox" checked={includeLibrary} onChange={(e) => setIncludeLibrary(e.target.checked)} />
          Include Bunny library
        </label>
        <Button variant="outline" size="sm" onClick={() => load(includeLibrary)} className="gap-1.5">
          <RefreshCw size={15} /> Refresh
        </Button>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={selectAll}>
          {selected.size === filtered.length && filtered.length > 0 ? "Clear selection" : "Select all"}
        </Button>
        <span className="text-sm text-gray-500">{selected.size} selected</span>
        {isAdmin && (
          <Button size="sm" onClick={bulkDownload} disabled={selected.size === 0} className="gap-1.5">
            <Download size={15} /> Download selected
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={exportLinks} className="gap-1.5">
          <FileDown size={15} /> Export links (CSV)
        </Button>
        <span className="ml-auto text-sm text-gray-500">{filtered.length} videos</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-3 w-8"></th>
              <th className="px-4 py-3">Video</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.key} className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-3">
                  <input type="checkbox" checked={selected.has(v.key)} onChange={() => toggleSelect(v.key)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                      <Video size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-[280px]">{v.title}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        {v.binded && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30">Binded</span>}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 capitalize">{v.source}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.courseTitle}</td>
                <td className="px-4 py-3 text-gray-500">{v.date ? new Date(v.date).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-right">
                  {isAdmin ? (
                    <button
                      onClick={() => triggerDownload(v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 text-xs font-semibold"
                    >
                      <Download size={14} /> Download
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 inline-flex items-center gap-1"><LinkIcon size={12} /> Admin only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-500 py-12">No videos found.</p>}
      </div>
    </div>
  );
}
