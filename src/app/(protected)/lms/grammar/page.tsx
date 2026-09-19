"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWatchTracker } from "@/hooks/useWatchTracker";
import { grammarService, GrammarClass } from "@/services/grammarService";
import { bunnyService } from "@/services/bunnyService";
import { Loader2, Play, Video, X, Search, BookText, Clock } from "lucide-react";

export default function GrammarPage() {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<GrammarClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryId, setLibraryId] = useState("");
  const [selected, setSelected] = useState<GrammarClass | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Track how long the student actually watches the open grammar video.
  useWatchTracker({
    iframeRef,
    recordingId: selected?.id,
    title: selected?.title,
    user: userData,
  });

  useEffect(() => {
    (async () => {
      try {
        const [cls, settings] = await Promise.all([
          grammarService.getClasses(true),
          bunnyService.getSettings().catch(() => ({} as any)),
        ]);
        setClasses(cls);
        setLibraryId(settings?.bunnyLibraryId || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(classes.map((c) => c.category).filter(Boolean) as string[]))],
    [classes]
  );

  const filtered = classes.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || (c.category || "") === category;
    return matchesSearch && matchesCat;
  });

  const openClass = (c: GrammarClass) => {
    setSelected(c);
    if (c.id) grammarService.incrementView(c.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 pt-4 px-4 md:px-0 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
            <BookText size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grammar Classes</h1>
            <p className="text-gray-500 dark:text-gray-400">Watch our grammar lessons anytime</p>
          </div>
        </div>

        {classes.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search grammar lessons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
              />
            </div>
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
                      category === cat
                        ? "bg-brand-blue text-white border-brand-blue"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookText size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Grammar Classes Yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Grammar lessons will appear here once published.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => openClass(c)}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
            >
              <div className="aspect-video bg-gray-900 relative flex items-center justify-center overflow-hidden">
                {c.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnailUrl} alt={c.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                ) : (
                  <Video className="text-white/20" size={48} />
                )}
                <div className="absolute inset-0 bg-black/40 z-10" />
                <Play className="text-white opacity-90 drop-shadow group-hover:scale-110 transition-transform z-20" size={52} strokeWidth={1.5} />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{c.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {c.category && <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-xs">{c.category}</span>}
                  {c.durationSeconds ? (
                    <span className="flex items-center gap-1"><Clock size={13} />{Math.floor(c.durationSeconds / 60)}m</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Player Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-black rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl relative">
            <div className="p-3 md:p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
              <h3 className="text-white font-medium truncate pr-8 text-sm md:text-base">{selected.title}</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1 shrink-0"
              >
                <X size={22} />
              </button>
            </div>
            <div className="relative pt-[56.25%] bg-black">
              <iframe
                ref={iframeRef}
                key={selected.id}
                src={selected.bunnyVideoId.startsWith("http")
                  ? selected.bunnyVideoId
                  : `https://player.mediadelivery.net/embed/${libraryId}/${selected.bunnyVideoId}?autoplay=false&preload=true&playsinline=true&disableIosPlayer=true`}
                className="absolute top-0 left-0 w-full h-full border-0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; screen-wake-lock"
                allowFullScreen
              />
            </div>
            {selected.description && (
              <div className="p-4 bg-gray-900 text-gray-300 text-sm max-h-32 overflow-y-auto">{selected.description}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
