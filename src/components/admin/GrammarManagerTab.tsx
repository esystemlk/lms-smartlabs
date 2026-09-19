"use client";

import { useEffect, useState, useRef } from "react";
import { grammarService, GrammarClass } from "@/services/grammarService";
import { bunnyService } from "@/services/bunnyService";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import {
  Loader2, Upload, Trash2, Check, Search, RefreshCw, Video,
  Eye, EyeOff, Plus, BookText,
} from "lucide-react";

interface BunnyVideo { guid: string; title: string; length?: number; thumbnailUrl?: string }

export function GrammarManagerTab() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"manage" | "library" | "upload">("manage");
  const [classes, setClasses] = useState<GrammarClass[]>([]);
  const [bunnyVideos, setBunnyVideos] = useState<BunnyVideo[]>([]);
  const [libraryId, setLibraryId] = useState("");
  const [loading, setLoading] = useState(true);

  // Bulk-add-from-library selection
  const [selectedGuids, setSelectedGuids] = useState<Set<string>>(new Set());
  const [defaultCategory, setDefaultCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");

  // Bulk upload
  const [uploads, setUploads] = useState<{ name: string; percent: number; status: "uploading" | "done" | "error" }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const settings = await bunnyService.getSettings();
      const libId = settings.bunnyLibraryId;
      const cdn = settings.bunnyCdnHostname;
      setLibraryId(libId);
      const [cls, apiVideos] = await Promise.all([
        grammarService.getClasses(),
        bunnyService.getVideos(1, 200).catch(() => ({ items: [] })),
      ]);
      setClasses(cls);
      const host = (cdn || `vz-${libId}.b-cdn.net`).replace(/^https?:\/\//, "").replace(/\/+$/, "");
      setBunnyVideos(
        (apiVideos.items || []).map((v: any) => ({
          guid: v.guid,
          title: v.title,
          length: v.length,
          thumbnailUrl: v.thumbnailFileName ? `https://${host}/${v.guid}/${v.thumbnailFileName}` : undefined,
        }))
      );
    } catch (e: any) {
      toast(e.message || "Failed to load Bunny library", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const existingIds = new Set(classes.map((c) => c.bunnyVideoId));
  const availableVideos = bunnyVideos.filter(
    (v) => !existingIds.has(v.guid) && v.title.toLowerCase().includes(search.toLowerCase())
  );

  const toggleGuid = (guid: string) => {
    setSelectedGuids((prev) => {
      const next = new Set(prev);
      next.has(guid) ? next.delete(guid) : next.add(guid);
      return next;
    });
  };

  const selectAllAvailable = () => {
    if (selectedGuids.size === availableVideos.length) setSelectedGuids(new Set());
    else setSelectedGuids(new Set(availableVideos.map((v) => v.guid)));
  };

  const handleBulkAdd = async () => {
    if (selectedGuids.size === 0) return;
    setAdding(true);
    try {
      const items = bunnyVideos
        .filter((v) => selectedGuids.has(v.guid))
        .map((v, i) => ({
          bunnyVideoId: v.guid,
          title: v.title,
          category: defaultCategory || undefined,
          durationSeconds: v.length,
          thumbnailUrl: v.thumbnailUrl,
          order: Date.now() + i,
          active: true,
        }));
      const added = await grammarService.addMany(items);
      toast(`Added ${added} grammar ${added === 1 ? "class" : "classes"}`, "success");
      setSelectedGuids(new Set());
      await load();
      setTab("manage");
    } catch (e: any) {
      toast(e.message || "Failed to add classes", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const list = Array.from(files);
    setUploads(list.map((f) => ({ name: f.name, percent: 0, status: "uploading" as const })));

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const title = file.name.replace(/\.[^/.]+$/, "");
      try {
        const created: any = await bunnyService.createVideo(title);
        const guid = created.guid;
        await bunnyService.uploadVideo(file, guid, (p) => {
          setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, percent: Math.round(p) } : u)));
        });
        await grammarService.addClass({
          bunnyVideoId: guid,
          title,
          category: uploadCategory || undefined,
          order: Date.now() + i,
          active: true,
        });
        setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, percent: 100, status: "done" } : u)));
      } catch (e) {
        setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, status: "error" } : u)));
      }
    }

    setUploading(false);
    toast("Upload complete", "success");
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this grammar class? (The video stays in Bunny.)")) return;
    await grammarService.deleteClass(id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    toast("Removed", "success");
  };

  const handleToggle = async (c: GrammarClass) => {
    await grammarService.toggleStatus(c.id!, !c.active);
    setClasses((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));
  };

  const handleRename = async (c: GrammarClass) => {
    const title = prompt("Title", c.title);
    if (title == null) return;
    const category = prompt("Category (optional)", c.category || "") || "";
    await grammarService.updateClass(c.id!, { title, category });
    setClasses((prev) => prev.map((x) => (x.id === c.id ? { ...x, title, category } : x)));
    toast("Updated", "success");
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-blue" /></div>;

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-1">
        {[
          { id: "manage", label: `Grammar Classes (${classes.length})`, icon: BookText },
          { id: "library", label: "Add from Bunny Library", icon: Plus },
          { id: "upload", label: "Bulk Upload", icon: Upload },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${
              tab === t.id ? "bg-white dark:bg-gray-800 text-brand-blue border-b-2 border-brand-blue" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-brand-blue" title="Refresh">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* MANAGE */}
      {tab === "manage" && (
        classes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Video size={40} className="mx-auto mb-3 opacity-30" />
            <p>No grammar classes yet. Add some from your Bunny library or upload files.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {classes.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="w-24 h-14 rounded-lg bg-gray-900 overflow-hidden shrink-0 flex items-center justify-center">
                  {c.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : <Video className="text-white/30" size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">
                    {c.category || "Uncategorized"} · {c.views || 0} views {c.active ? "" : "· Hidden"}
                  </p>
                </div>
                <button onClick={() => handleRename(c)} className="p-2 text-gray-400 hover:text-brand-blue" title="Edit">✎</button>
                <button onClick={() => handleToggle(c)} className="p-2 text-gray-400 hover:text-amber-600" title={c.active ? "Hide" : "Show"}>
                  {c.active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => c.id && handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-600" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ADD FROM LIBRARY (bulk) */}
      {tab === "library" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
              />
            </div>
            <input
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              placeholder="Category for selected (optional)"
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
            />
            <Button variant="outline" size="sm" onClick={selectAllAvailable}>
              {selectedGuids.size === availableVideos.length && availableVideos.length > 0 ? "Clear" : "Select all"}
            </Button>
            <Button size="sm" onClick={handleBulkAdd} disabled={selectedGuids.size === 0 || adding}>
              {adding ? <Loader2 className="animate-spin" size={16} /> : `Add ${selectedGuids.size || ""} selected`}
            </Button>
          </div>

          {availableVideos.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No new videos in your Bunny library to add.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableVideos.map((v) => {
                const sel = selectedGuids.has(v.guid);
                return (
                  <button
                    key={v.guid}
                    onClick={() => toggleGuid(v.guid)}
                    className={`text-left rounded-xl border overflow-hidden transition-all ${sel ? "border-brand-blue ring-2 ring-brand-blue/30" : "border-gray-200 dark:border-gray-700"}`}
                  >
                    <div className="aspect-video bg-gray-900 relative flex items-center justify-center">
                      {v.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : <Video className="text-white/30" size={24} />}
                      {sel && <div className="absolute top-2 right-2 bg-brand-blue text-white rounded-full p-1"><Check size={14} /></div>}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{v.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BULK UPLOAD */}
      {tab === "upload" && (
        <div className="space-y-4 max-w-2xl">
          <input
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            placeholder="Category for these uploads (optional)"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
          />
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFilesUpload(e.target.files)}
            />
            <Upload className="mx-auto text-gray-400 mb-3" size={36} />
            <p className="font-medium text-gray-900 dark:text-white">Click to select multiple video files</p>
            <p className="text-sm text-gray-500 mt-1">Each file is uploaded to Bunny and added as a grammar class.</p>
          </div>

          {uploads.length > 0 && (
            <div className="space-y-2">
              {uploads.map((u, i) => (
                <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="truncate text-gray-800 dark:text-gray-200">{u.name}</span>
                    <span className={u.status === "error" ? "text-red-600" : u.status === "done" ? "text-green-600" : "text-gray-500"}>
                      {u.status === "error" ? "Failed" : u.status === "done" ? "Done" : `${u.percent}%`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${u.status === "error" ? "bg-red-500" : "bg-brand-blue"}`} style={{ width: `${u.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
