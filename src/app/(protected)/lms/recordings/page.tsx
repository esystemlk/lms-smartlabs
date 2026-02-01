"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { courseService } from "@/services/courseService";
import { bunnyService } from "@/services/bunnyService";
import { Lesson } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Loader2, Play, Calendar, Clock, Video, X } from "lucide-react";

export default function RecordingsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [recordings, setRecordings] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<{ videoId: string; title: string } | null>(null);
  const [libraryId, setLibraryId] = useState<string>("");

  useEffect(() => {
    fetchRecordings();
    fetchSettings();
  }, [userData]);

  const fetchSettings = async () => {
    try {
      const settings = await bunnyService.getSettings();
      setLibraryId(settings.bunnyLibraryId);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchRecordings = async () => {
    try {
      const data = await courseService.getPastLiveClasses();
      
      // Filter by enrolled batches and recording status
      let filtered = data.filter(l => l.recordingStatus === 'processed' && l.bunnyVideoId);
      
      if (userData && userData.role === 'student') {
        const userBatches = userData.enrolledBatches || [];
        filtered = filtered.filter(cls => {
          if (cls.batchIds && cls.batchIds.length > 0) {
            return cls.batchIds.some(id => userBatches.includes(id));
          }
          return true; // Open to all if no batches
        });
      }
      
      setRecordings(filtered);
    } catch (error) {
      console.error("Error fetching recordings:", error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Recordings</h1>
          <p className="text-gray-500">Watch past sessions you missed</p>
        </div>
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Recordings Available</h3>
          <p className="text-gray-500 mt-1">Past class recordings will appear here once processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((rec) => {
            const date = rec.startTime ? new Date(rec.startTime) : null;
            
            return (
              <div 
                key={rec.id} 
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group cursor-pointer"
                onClick={() => setSelectedVideo({ videoId: rec.bunnyVideoId!, title: rec.title })}
              >
                {/* Thumbnail / Placeholder */}
                <div className="aspect-video bg-gray-900 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <Play className="text-white opacity-80 group-hover:opacity-100 transform group-hover:scale-110 transition-all z-20" size={48} fill="currentColor" />
                  
                  {/* Dynamic Thumbnail from Bunny (if available) */}
                  <img 
                    src={`https://vz-${libraryId}.b-cdn.net/${rec.bunnyVideoId}/thumbnail.jpg`} 
                    alt={rec.title}
                    className="absolute inset-0 w-full h-full object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  
                  <div className="absolute bottom-3 right-3 z-20 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {rec.duration}m
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-blue transition-colors">
                    {rec.title}
                  </h3>
                  
                  <div className="flex flex-col gap-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{date?.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && libraryId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-4 right-4 z-50">
              <button 
                onClick={() => setSelectedVideo(null)}
                className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="aspect-video w-full">
              <iframe 
                src={`https://iframe.mediadelivery.net/embed/${libraryId}/${selectedVideo.videoId}?autoplay=true`}
                loading="lazy"
                className="w-full h-full border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" 
                allowFullScreen={true}
              />
            </div>
            
            <div className="p-4 bg-gray-900 text-white">
              <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
