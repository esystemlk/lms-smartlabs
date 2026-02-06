
import { useEffect, useState } from "react";
import { Clock, BookOpen, Trophy, Flame } from "lucide-react";
import { UserData } from "@/lib/types";
import { enrollmentService } from "@/services/enrollmentService";

interface LearningStatsProps {
  userData: UserData | null;
}

export function LearningStats({ userData }: LearningStatsProps) {
  const [completedLessons, setCompletedLessons] = useState(0);

  useEffect(() => {
    if (userData?.uid) {
      enrollmentService.getUserEnrollments(userData.uid).then(enrollments => {
         const total = enrollments.reduce((acc, curr) => acc + (curr.completedLessonIds?.length || 0), 0);
         setCompletedLessons(total);
      });
    }
  }, [userData]);

  // Mock data for other stats, real for Lessons Done
  const stats = [
    { label: "Hours Learned", value: "24h", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Lessons Done", value: completedLessons.toString(), icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Current Streak", value: "3 Days", icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Points", value: (completedLessons * 10).toString(), icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  return (
    <div className="glass-card rounded-3xl p-6 shadow-sm border-0 h-full">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">My Progress</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2 p-3 rounded-xl border border-white/20 dark:border-white/10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={16} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
