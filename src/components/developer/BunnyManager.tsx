"use client";

import { useState, useEffect } from "react";
import { bunnyService } from "@/services/bunnyService";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Loader2, Save, Trash2, Video, RefreshCw, Upload, Play, Key } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function BunnyManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({ bunnyApiKey: "", bunnyLibraryId: "" });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Settings
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const s = await bunnyService.getSettings();
      setSettings({
        bunnyApiKey: s.bunnyApiKey || "",
        bunnyLibraryId: s.bunnyLibraryId || "",
      });
    } catch (error) {
      console.log("No settings found or error", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "general"), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast("Bunny.net credentials saved", "success");
      fetchVideos(); // Refresh videos with new creds
    } catch (error) {
      console.error(error);
      toast("Failed to save settings", "error");
    }
  };

  // Videos
  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const res = await bunnyService.getVideos(1, 20); // First page, 20 items
      setVideos(res.items || []);
    } catch (error) {
      console.error(error);
      toast("Failed to fetch videos. Check credentials.", "error");
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings.bunnyApiKey && settings.bunnyLibraryId) {
      fetchVideos();
    }
  }, [settings.bunnyApiKey, settings.bunnyLibraryId]);

  // Upload
  const handleUpload = async () => {
    if (!uploadFile) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // 1. Create Video Object in Bunny
      toast("Creating video placeholder...", "info");
      const videoObj = await bunnyService.createVideo(uploadFile.name);
      
      // 2. Upload File
      toast("Uploading content...", "info");
      await bunnyService.uploadVideo(uploadFile, videoObj.guid, (pct) => setUploadProgress(pct));
      
      // 3. Save to Firestore 'recordings' collection
      toast("Saving to database...", "info");
      await addDoc(collection(db, "recordings"), {
        title: uploadFile.name,
        bunnyVideoId: videoObj.guid,
        bunnyLibraryId: settings.bunnyLibraryId,
        status: "processing", // Bunny takes time to process
        createdAt: serverTimestamp(),
        provider: "bunny",
        fileSize: uploadFile.size,
        fileName: uploadFile.name
      });

      toast("Upload complete! Saved to Recordings collection.", "success");
      setUploadFile(null);
      fetchVideos();
    } catch (error: any) {
      console.error(error);
      toast(error.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
     if (!confirm("Are you sure? This will delete the video from Bunny.net.")) return;
     try {
       await bunnyService.deleteVideo(videoId);
       toast("Video deleted", "success");
       fetchVideos();
     } catch (e) {
       toast("Failed to delete video", "error");
     }
  };

  return (
    <div className="space-y-8">
      {/* Credentials Section */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Key className="w-5 h-5 text-yellow-500" />
          Bunny.net Credentials
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input 
              type="password" 
              value={settings.bunnyApiKey}
              onChange={(e) => setSettings(s => ({...s, bunnyApiKey: e.target.value}))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Bunny.net API Key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Library ID</label>
            <input 
              type="text" 
              value={settings.bunnyLibraryId}
              onChange={(e) => setSettings(s => ({...s, bunnyLibraryId: e.target.value}))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Library ID (e.g. 12345)"
            />
          </div>
        </div>
        <button 
          onClick={saveSettings}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Credentials
        </button>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5 text-green-500" />
          Upload Recording
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
           <input 
             type="file" 
             accept="video/*"
             onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
             className="block w-full text-sm text-gray-500
               file:mr-4 file:py-2 file:px-4
               file:rounded-full file:border-0
               file:text-sm file:font-semibold
               file:bg-blue-50 file:text-blue-700
               hover:file:bg-blue-100"
           />
           <button 
             onClick={handleUpload}
             disabled={!uploadFile || uploading}
             className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto"
           >
             {uploading ? `Uploading ${Math.round(uploadProgress)}%` : "Upload & Save"}
           </button>
        </div>
        {uploading && (
           <div className="w-full bg-gray-200 rounded-full h-2.5">
             <div className="bg-green-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
           </div>
        )}
      </div>

      {/* Video List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <h3 className="font-semibold flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            Library Videos
          </h3>
          <button onClick={fetchVideos} className="p-2 hover:bg-gray-200 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loadingVideos ? "animate-spin" : ""}`} />
          </button>
        </div>
        
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {videos.map((video) => (
            <div key={video.guid} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-16 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                   <Play className="w-5 h-5 text-gray-400" />
                 </div>
                 <div className="min-w-0">
                   <p className="font-medium text-sm text-gray-900 truncate">{video.title}</p>
                   <p className="text-xs text-gray-500">{video.guid} • {Math.round(video.length / 60)} mins</p>
                 </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <span className={`text-xs px-2 py-1 rounded-full ${video.status === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                   {video.status === 1 ? 'Processing' : 'Ready'}
                </span>
                <button 
                  onClick={() => handleDeleteVideo(video.guid)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  title="Delete from Bunny.net"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {!loadingVideos && videos.length === 0 && (
             <div className="p-8 text-center text-gray-500">No videos found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
