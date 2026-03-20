import { Calendar, Clock, Video, RefreshCw } from "lucide-react";
import { UserData, Lesson, Enrollment } from "@/lib/types";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import Link from "next/link";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";

interface UpcomingScheduleProps {
  userData: UserData | null;
}

export function UpcomingSchedule({ userData }: UpcomingScheduleProps) {
  const [classes, setClasses] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!userData?.uid) return;

      try {
        const [allClasses, enrollments] = await Promise.all([
          courseService.getUpcomingLiveClasses(),
          enrollmentService.getUserEnrollments(userData.uid)
        ]);

        const activeEnrollments = enrollments.filter((e: Enrollment) => e.status === 'active' || e.status === 'completed');
        const userCourseIds = activeEnrollments.map((e: Enrollment) => e.courseId);
        const userBatchIds = activeEnrollments.map((e: Enrollment) => e.batchId);

        // Map batchId -> timeSlotId for precise filtering
        const userBatchSlotMap = new Map<string, string>();
        activeEnrollments.forEach((e: Enrollment) => {
          if (e.timeSlotId) userBatchSlotMap.set(e.batchId, e.timeSlotId);
        });

        // Filter classes based on user's enrollment
        const userClasses = allClasses.filter((cls: Lesson) => {
          // 1. Basic course access
          const hasCourseAccess = userCourseIds.includes(cls.courseId);
          if (!hasCourseAccess) return false;

          // 2. Batch-level access
          const hasBatchAccess = cls.batchIds && cls.batchIds.length > 0
            ? cls.batchIds.some((bid: string) => userBatchIds.includes(bid))
            : true; // Open to course if no batch specified

          if (!hasBatchAccess) return false;

          // 3. Time-slot precision (only if class specifies a slot)
          if (cls.timeSlotId && cls.batchIds && cls.batchIds.length > 0) {
            // Find which enrolled batch this class is for
            const relevantBatchId = cls.batchIds.find((bid: string) => userBatchIds.includes(bid));
            if (relevantBatchId) {
              const studentSlot = userBatchSlotMap.get(relevantBatchId);
              // Only show if student is in the EXACT same time slot
              return studentSlot === cls.timeSlotId;
            }
          }

          return true;
        });

        // Sort by start time (closest first)
        userClasses.sort((a: Lesson, b: Lesson) => {
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

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-6 shadow-sm border-0 h-full flex flex-col items-center justify-center min-h-[300px] animate-pulse">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4" />
        <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-full mb-2" />
        <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-[2.5rem] p-5 md:p-8 shadow-sm border-0 h-full flex flex-col transition-all">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <Calendar className="text-brand-blue" size={20} />
            </div>
            Schedule
          </h3>
          <p className="text-xs text-gray-500 font-medium ml-11">Your upcoming sessions</p>
        </div>
        <Link href="/lms/live">
          <Button variant="ghost" size="sm" className="text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold rounded-xl text-xs">
            View All
          </Button>
        </Link>
      </div>

      {classes.length > 0 ? (
        <div className="space-y-4 flex-1">
          {classes.map((cls) => {
            const startTime = new Date(cls.startTime!);
            const isLive = Math.abs(new Date().getTime() - startTime.getTime()) < 3600000; // Within 1 hour
            
            return (
              <div key={cls.id} className="relative group">
                <Link href="/lms/live">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-[1.75rem] bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800 shadow-sm hover:shadow-xl group-hover:-translate-y-1">
                    {/* Date Icon */}
                    <div className="flex-shrink-0 w-14 h-14 bg-white dark:bg-gray-600 text-brand-blue rounded-2xl flex flex-col items-center justify-center text-center shadow-sm group-hover:scale-105 transition-transform border border-gray-100 dark:border-gray-700">
                      <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-300 tracking-tighter">
                        {format(startTime, "MMM")}
                      </span>
                      <span className="text-2xl font-black leading-none tracking-tighter">
                        {format(startTime, "d")}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={clsx(
                          "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                          isLive ? "bg-red-500 text-white animate-pulse" : "bg-blue-100 text-brand-blue dark:bg-blue-900/40"
                        )}>
                          {isLive ? "Live Now" : "Upcoming"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                          {format(startTime, "EEEE")}
                        </span>
                      </div>
                      
                      <h4 className="text-base font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-blue transition-colors">
                        {cls.title}
                      </h4>
                      
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
                          <Clock size={12} className="mr-1.5 text-brand-blue" />
                          {format(startTime, "h:mm a")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-0 flex items-center justify-between sm:justify-end gap-3">
                      {isLive ? (
                        <Button className="h-10 px-6 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/30">
                          Join Room
                        </Button>
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-brand-blue group-hover:text-white group-hover:rotate-45 transition-all shadow-sm">
                          <Video size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 py-10 text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] flex items-center justify-center mb-6 text-gray-300 dark:text-gray-700">
            <Calendar size={32} />
          </div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">All caught up!</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-[220px] mx-auto leading-relaxed">
            No live classes scheduled for today. Check your recordings in the meantime!
          </p>
          <Link href="/lms" className="mt-6">
            <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs">
              Go to LMS Dash
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
