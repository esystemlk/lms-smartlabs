"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { Lesson } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Loader2, Video, Calendar, Clock, ExternalLink, Play, Presentation } from "lucide-react";
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
        const userBatches = userData.enrolledBatches || [];

        // Fetch user enrollments to check for time slots
        const userEnrollments = await enrollmentService.getUserEnrollments(userData.uid);
        const activeEnrollments = userEnrollments.filter(e => e.status === 'active' || e.status === 'completed');

        filteredClasses = data.filter(cls => {
          // 1. Check Course Access
          const userCourseIds = activeEnrollments.map(e => e.courseId);
          if (cls.courseId && !userCourseIds.includes(cls.courseId)) {
            return false;
          }

          // 2. Check Batch Access
          if (cls.batchIds && cls.batchIds.length > 0) {
            const hasBatchMatch = cls.batchIds.some(id => userBatches.includes(id));
            if (!hasBatchMatch) return false;

            // 3. Check Time Slot Access (if specified in class)
            if (cls.timeSlotId) {
              const matchingEnrollment = activeEnrollments.find(e =>
                cls.batchIds?.includes(e.batchId) && e.timeSlotId === cls.timeSlotId
              );
              if (!matchingEnrollment) return false;
            }
          }

          return true;
        });
      } else if (userData && userData.role === 'lecturer') {
        // Fetch courses to filter by lecturer
        const allCourses = await courseService.getAllCourses();
        const myCourseIds = allCourses
          .filter(c => 
            c.lecturerId === userData.uid || 
            c.instructorId === userData.uid ||
            (c.lecturerIds && c.lecturerIds.includes(userData.uid))
          )
          .map(c => c.id);

        filteredClasses = data.filter(cls => cls.courseId && myCourseIds.includes(cls.courseId));
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
          <p className="text-gray-500">
            {userData?.role === 'student' ? 'Join your scheduled sessions' : 'Manage and start your live sessions'}
          </p>
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
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${isHappeningNow
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
                  {/* Join buttons for students, Start buttons for hosts */}
                  {cls.zoomStartUrl && userData?.role !== 'student' ? (
                    <div className="col-span-2">
                      <a href={cls.zoomStartUrl} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-sm">
                          Start Class (Host)
                          <Presentation size={16} className="ml-2" />
                        </Button>
                      </a>
                    </div>
                  ) : cls.zoomJoinUrl ? (
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
