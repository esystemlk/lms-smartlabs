"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { courseService } from "@/services/courseService";
import { Lesson } from "@/lib/types";
import { Loader2, Calendar, Clock, Video, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { format, isSameDay } from "date-fns";

export default function TimetablePage() {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (userData) {
        try {
          // Get all upcoming live classes
          const upcoming = await courseService.getUpcomingLiveClasses();
          
          // Filter for user's batches
          let filtered = upcoming;
          if (userData.role === 'student') {
            const userBatches = userData.enrolledBatches || [];
            if (userBatches.length > 0) {
              filtered = filtered.filter(cls => {
                  return !cls.batchIds || cls.batchIds.length === 0 || cls.batchIds.some(id => userBatches.includes(id));
              });
            }
          }
          setClasses(filtered);
        } catch (error) {
          console.error("Failed to load timetable", error);
        }
      }
      setLoading(false);
    };

    fetchSchedule();
  }, [userData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-brand-blue" size={32} />
      </div>
    );
  }

  // Group by date
  const groupedClasses: { [key: string]: Lesson[] } = {};
  classes.forEach(cls => {
    if (cls.startTime) {
      const dateKey = format(new Date(cls.startTime), "yyyy-MM-dd");
      if (!groupedClasses[dateKey]) groupedClasses[dateKey] = [];
      groupedClasses[dateKey].push(cls);
    }
  });

  const sortedDates = Object.keys(groupedClasses).sort();

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Timetable</h1>
        <p className="text-gray-500">Your upcoming live sessions schedule.</p>
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <Calendar className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Classes Scheduled</h3>
          <p className="text-gray-500">Enjoy your free time!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              <h3 className="text-lg font-bold text-gray-900 mb-4 sticky top-20 bg-gray-50/90 backdrop-blur-sm py-2 z-10">
                {format(new Date(date), "EEEE, MMMM do")}
              </h3>
              <div className="space-y-3">
                {groupedClasses[date].map((cls) => (
                  <div key={cls.id} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold uppercase">{format(new Date(cls.startTime!), "MMM")}</span>
                        <span className="text-lg font-bold leading-none">{format(new Date(cls.startTime!), "d")}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{cls.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {format(new Date(cls.startTime!), "h:mm a")} - {cls.duration} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Video size={14} />
                            Live Class
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link href={`/lms/live/room/${cls.courseId}/${cls.id}`}>
                      <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 w-full md:w-auto">
                        Join Class <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
