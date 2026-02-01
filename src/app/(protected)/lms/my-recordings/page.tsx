"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { courseService } from "@/services/courseService";
import { bunnyService } from "@/services/bunnyService";
import { Lesson } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Loader2, Play, Calendar, Clock, Video, X } from "lucide-react";
import { format } from "date-fns";

export default function MyRecordingsPage() {
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
        
        if (userBatches.length === 0) {
            // If student has no batches, show nothing (strict)
            filtered = [];
        } else {
            filtered = filtered.filter(cls => {
                // Must have batchIds and at least one must match user's batches
                // STRICT MODE: Only show videos that belong to the user's batches
                return cls.batchIds && cls.batchIds.length > 0 && cls.batchIds.some(id => userBatches.includes(id));
            });
        }
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
          <h1 className="text-2xl font-bold text-gray-900">My Class Recordings</h1>
          <p className="text-gray-500">Watch past sessions from your enrolled batches</p>
        </div>
      </div>

      {recordings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Recordings Found</h3>
          <p className="text-gray-500 mt-1">You don't have any class recordings available for your batches.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((rec) => {
            const date = rec.startTime ? new Date(rec.startTime) : null;
            
            return (
              <div 
                key={rec.id} 
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
                onClick={() => setSelectedVideo({ videoId: rec.bunnyVideoId!, title: rec.title })}
              >
                {/* Thumbnail / Placeholder */}
                <div className="aspect-video bg-gray-900 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-black/40 z-10" />
                  <Play className="text-white opacity-80 group-hover:opacity-100 transition-opacity z-20" size={48} fill="currentColor" />
                  
                  {/* Dynamic Thumbnail from Bunny (if available) */}
                  {libraryId && rec.bunnyVideoId && (
                    <img 
                      src={`https://vz-${libraryId}.b-cdn.net/${rec.bunnyVideoId}/thumbnail.jpg`} 
                      alt={rec.title}
                      className="absolute inset-0 w-full h-full object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{rec.title}</h3>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>{format(date, 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {rec.duration && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        <span>{rec.duration} mins</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-black rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl relative">
            <div className="p-4 flex items-center justify-between border-b border-gray-800 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
              <h3 className="text-white font-medium truncate pr-8">{selectedVideo.title}</h3>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="text-white/70 hover:text-white transition-colors bg-black/20 hover:bg-black/40 rounded-full p-1"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="relative pt-[56.25%] bg-black">
              <iframe 
                src={`https://iframe.mediadelivery.net/embed/${libraryId}/${selectedVideo.videoId}?autoplay=true`}
                loading="lazy"
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" 
                allowFullScreen={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
