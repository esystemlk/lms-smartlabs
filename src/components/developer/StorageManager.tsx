"use client";

import { useState, useEffect } from "react";
import { storage } from "@/lib/firebase";
import { ref, listAll, deleteObject, getDownloadURL, StorageReference } from "firebase/storage";
import { Loader2, Trash2, Folder, FileIcon, Image as ImageIcon, Video, RefreshCw, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface FileItem {
  name: string;
  fullPath: string;
  isFolder: boolean;
  ref: StorageReference;
  url?: string;
  type?: "image" | "video" | "other";
}

export function StorageManager() {
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchItems = async (path: string) => {
    setLoading(true);
    try {
      const storageRef = ref(storage, path);
      const res = await listAll(storageRef);

      const folders: FileItem[] = res.prefixes.map((folderRef) => ({
        name: folderRef.name,
        fullPath: folderRef.fullPath,
        isFolder: true,
        ref: folderRef,
      }));

      const files: FileItem[] = await Promise.all(
        res.items.map(async (fileRef) => {
          let url = "";
          let type: FileItem["type"] = "other";
          
          try {
             // Only get URL for images/videos to save bandwidth/time, or lazy load. 
             // For now, let's get it to determine type or preview.
             url = await getDownloadURL(fileRef);
             const name = fileRef.name.toLowerCase();
             if (name.match(/\.(jpg|jpeg|png|gif|webp)$/)) type = "image";
             else if (name.match(/\.(mp4|webm|ogg)$/)) type = "video";
          } catch (e) {
             console.error("Error getting URL", e);
          }

          return {
            name: fileRef.name,
            fullPath: fileRef.fullPath,
            isFolder: false,
            ref: fileRef,
            url,
            type,
          };
        })
      );

      setItems([...folders, ...files]);
    } catch (error) {
      console.error("Error listing files:", error);
      toast("Failed to list files", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath]);

  const handleDelete = async (item: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;

    try {
      await deleteObject(item.ref);
      toast("File deleted successfully", "success");
      fetchItems(currentPath);
    } catch (error) {
      console.error("Error deleting file:", error);
      toast("Failed to delete file", "error");
    }
  };

  const navigateTo = (folderName: string) => {
    setCurrentPath((prev) => (prev === "/" ? "" : prev) + "/" + folderName);
  };

  const navigateUp = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length ? parts.join("/") : "/");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm gap-2">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
           <button 
             onClick={navigateUp} 
             disabled={currentPath === "/"}
             className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 flex-shrink-0"
           >
             <ChevronRight className="w-5 h-5 rotate-180" />
           </button>
           <h2 className="font-mono text-sm truncate" title={`root${currentPath === "/" ? "" : "/" + currentPath.split("/").filter(Boolean).join("/")}`}>
             root{currentPath === "/" ? "" : "/" + currentPath.split("/").filter(Boolean).join("/")}
           </h2>
        </div>
        <button 
          onClick={() => fetchItems(currentPath)} 
          className="p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
          disabled={loading}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.fullPath} className="bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-3 group relative">
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
              {item.isFolder ? (
                <Folder className="w-16 h-16 text-blue-400" />
              ) : item.type === "image" ? (
                <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
              ) : item.type === "video" ? (
                <Video className="w-16 h-16 text-purple-400" />
              ) : (
                <FileIcon className="w-16 h-16 text-gray-400" />
              )}
            </div>
            
            <div className="flex items-start justify-between gap-2">
               <div className="min-w-0">
                 <p className="font-medium text-sm truncate" title={item.name}>{item.name}</p>
                 <p className="text-xs text-gray-500 capitalize">{item.isFolder ? "Folder" : item.type}</p>
               </div>
               
               {!item.isFolder && (
                 <button 
                   onClick={() => handleDelete(item)}
                   className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               )}
            </div>

            {item.isFolder && (
               <button 
                 onClick={() => navigateTo(item.name)}
                 className="absolute inset-0 z-10"
               />
            )}
            
            {!item.isFolder && item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-auto"
                >
                  View / Download
                </a>
            )}
          </div>
        ))}
        
        {!loading && items.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No items found in this directory.
          </div>
        )}
      </div>
    </div>
  );
}
