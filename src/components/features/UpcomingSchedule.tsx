
import { Calendar, Clock, Video, RefreshCw } from "lucide-react";
import { UserData, Lesson } from "@/lib/types";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { courseService } from "@/services/courseService";
import { attendanceService } from "@/services/attendanceService";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface UpcomingScheduleProps {
  userData: UserData | null;
}

export function UpcomingSchedule({ userData }: UpcomingScheduleProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!userData) return;
      
      try {
        const allClasses = await courseService.getUpcomingLiveClasses();
        
        // Filter classes based on user's enrollment
        const userClasses = allClasses.filter(cls => {
          // Check if user is enrolled in the course
          const isEnrolledInCourse = userData.enrolledCourses?.includes(cls.courseId);
          
          // Check if class is specific to batches and user is in one of them
          // If cls.batchIds is empty/undefined, it might be for all batches in the course
          const isEnrolledInBatch = cls.batchIds && cls.batchIds.length > 0 
            ? cls.batchIds.some(bid => userData.enrolledBatches?.includes(bid))
            : true; // If no specific batches, assume open to course students

          return isEnrolledInCourse && isEnrolledInBatch;
        });

        // Sort by start time (closest first)
        userClasses.sort((a, b) => {
          return new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime();
        });

        setClasses(userClasses.slice(0, 3)); // Show max 3
      } catch (error) {
        console.error("Failed to fetch upcoming classes", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [userData]);

  const handleJoinClass = async (cls: Lesson) => {
    if (!userData) return;
    
    try {
      setJoiningId(cls.id);
      
      // Auto-mark attendance
      await attendanceService.markAttendance({
        userId: userData.uid,
        userEmail: userData.email,
        userName: userData.name,
        courseId: cls.courseId,
        lessonId: cls.id,
        date: new Date(),
        status: 'present',
        method: 'zoom_auto'
      });
      
      // Navigate to class
      router.push(`/lms/live/room/${cls.courseId}/${cls.id}`);
    } catch (error) {
      console.error("Failed to mark attendance or join:", error);
      // Still try to navigate even if attendance fails
      router.push(`/lms/live/room/${cls.courseId}/${cls.id}`);
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-6 shadow-sm border-0 h-full flex flex-col items-center justify-center min-h-[200px]">
        <RefreshCw className="animate-spin text-brand-blue mb-2" size={24} />
        <p className="text-sm text-gray-500">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6 shadow-sm border-0 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="text-brand-blue" size={20} />
          Upcoming Classes
        </h3>
        <Link href="/live-classes">
          <span className="text-xs font-bold text-brand-blue hover:underline cursor-pointer">View All</span>
        </Link>
      </div>
      
      {classes.length > 0 ? (
        <div className="space-y-4 flex-1">
          {classes.map((cls) => (
            <div key={cls.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 transition-colors group border border-transparent hover:border-blue-100 dark:hover:border-blue-800">
              <div className="flex-shrink-0 w-14 h-14 bg-white dark:bg-gray-600 text-brand-blue rounded-xl flex flex-col items-center justify-center text-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-300">
                  {cls.startTime ? format(new Date(cls.startTime), "MMM") : 'N/A'}
                </span>
                <span className="text-xl font-bold leading-none">
                  {cls.startTime ? format(new Date(cls.startTime), "d") : '0'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-blue transition-colors">
                  {cls.title}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock size={12} className="mr-1" />
                    {cls.startTime ? format(new Date(cls.startTime), "h:mm a") : 'TBA'}
                  </span>
                  <span className="flex items-center text-xs text-brand-blue bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full font-medium">
                    <Video size={10} className="mr-1" />
                    Live
                  </span>
                </div>
              </div>
              <Button 
                onClick={() => handleJoinClass(cls)}
                disabled={joiningId === cls.id}
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-brand-blue hover:bg-white shadow-sm disabled:opacity-50"
              >
                {joiningId === cls.id ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <Video size={16} />
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
          <div className="w-16 h-16 bg-white/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600">
            <Calendar size={28} />
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">No upcoming classes</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px]">
            You're all caught up! Check back later for new sessions.
          </p>
        </div>
      )}
    </div>
  );
}
