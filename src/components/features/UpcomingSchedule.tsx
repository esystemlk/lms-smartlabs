
import { Calendar, Clock, Video } from "lucide-react";
import { UserData } from "@/lib/types";
import { format, addDays } from "date-fns";

interface UpcomingScheduleProps {
  userData: UserData | null;
}

export function UpcomingSchedule({ userData }: UpcomingScheduleProps) {
  // In a real app, we would fetch the schedule from the batches collection
  // For now, we simulate upcoming classes based on enrolled batches or defaults
  
  const hasBatches = userData?.enrolledBatches && userData.enrolledBatches.length > 0;
  
  const upcomingClasses = hasBatches ? [
    { id: 1, title: "English - Advanced Grammar", time: "Today, 4:00 PM", type: "Live Zoom" },
    { id: 2, title: "Physics - Mechanics", time: "Tomorrow, 2:30 PM", type: "Live Zoom" }
  ] : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Classes</h3>
        <button className="text-xs font-medium text-brand-blue hover:underline">View Schedule</button>
      </div>
      
      {upcomingClasses.length > 0 ? (
        <div className="space-y-3">
          {upcomingClasses.map((cls) => (
            <div key={cls.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group cursor-pointer border border-transparent hover:border-blue-100 dark:hover:border-blue-800">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white dark:bg-gray-600 flex items-center justify-center text-brand-blue shadow-sm group-hover:scale-105 transition-transform">
                <Calendar size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-blue transition-colors">
                  {cls.title}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock size={12} className="mr-1" />
                    {cls.time}
                  </span>
                  <span className="flex items-center text-xs text-brand-blue bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">
                    <Video size={10} className="mr-1" />
                    {cls.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 text-gray-400">
            <Calendar size={20} />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">No upcoming classes</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enroll in a course to see your schedule</p>
        </div>
      )}
    </div>
  );
}
