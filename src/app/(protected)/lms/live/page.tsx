"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { courseService } from "@/services/courseService";
import { Lesson } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Loader2, Video, Calendar, Clock, ExternalLink, Play } from "lucide-react";
import Link from "next/link";

export default function LiveClassesPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, [userData]); // Re-run when userData loads

  const fetchClasses = async () => {
    try {
      // Fetch all upcoming live classes
      const data = await courseService.getUpcomingLiveClasses();
      
      // Filter by enrolled batches if user is a student
      let filteredClasses = data;
      if (userData && userData.role === 'student') {
        // If user has no enrolled batches, they see nothing (or maybe public classes if any)
        const userBatches = userData.enrolledBatches || [];
        
        filteredClasses = data.filter(cls => {
          // If class has specific batches assigned, user must be in one of them
          if (cls.batchIds && cls.batchIds.length > 0) {
            return cls.batchIds.some(id => userBatches.includes(id));
          }
          // If class has NO batches assigned, it's considered "open to all" (or course-level)
          // You might want to restrict this further to enrolled COURSES, but for now:
          return true; 
        });
      }
      
      setClasses(filteredClasses);
    } catch (error) {
      console.error("Error fetching live classes:", error);
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 pt-4 px-4 md:px-0 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-gray-500">Join your scheduled sessions</p>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No Upcoming Classes</h3>
          <p className="text-gray-500 mt-1">Check back later for scheduled sessions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const startDate = cls.startTime ? new Date(cls.startTime) : null;
            const isHappeningNow = startDate 
              ? (new Date() >= startDate && new Date() <= new Date(startDate.getTime() + (cls.duration || 60) * 60000))
              : false;

            return (
              <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                      isHappeningNow 
                        ? "bg-red-100 text-red-600 animate-pulse" 
                        : "bg-blue-50 text-blue-600"
                    }`}>
                      <Video size={12} />
                      {isHappeningNow ? "Happening Now" : "Upcoming"}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{cls.title}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {startDate ? startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBA'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      {startDate ? startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                      <span className="text-gray-300">•</span>
                      {cls.duration} mins
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                  {/* Join Buttons */}
                  {cls.zoomJoinUrl ? (
                    <>
                      <a href={cls.zoomJoinUrl} className="col-span-1">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-xs md:text-sm px-2">
                          Zoom App
                          <ExternalLink size={14} className="ml-2" />
                        </Button>
                      </a>
                      
                      <a 
                        href={`https://app.zoom.us/wc/${cls.zoomMeetingId}/join?pwd=${cls.zoomPassword || ''}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="col-span-1"
                      >
                        <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 text-xs md:text-sm px-2">
                          Web Browser
                          <Play size={14} className="ml-2 fill-current" />
                        </Button>
                      </a>
                    </>
                  ) : (
                    <Button disabled className="col-span-2" variant="secondary">Link Not Available</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
