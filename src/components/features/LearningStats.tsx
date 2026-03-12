
import { useEffect, useState } from "react";
import { Clock, BookOpen, Trophy, Flame, Activity } from "lucide-react";
import { UserData } from "@/lib/types";
import { enrollmentService } from "@/services/enrollmentService";

interface LearningStatsProps {
  userData: UserData | null;
}

export function LearningStats({ userData }: LearningStatsProps) {
  const [stats, setStats] = useState([
    { label: "Hours Learned", value: "0h", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Lessons Done", value: "0", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Avg. Progress", value: "0%", icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Certificates", value: "0", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
  ]);

  useEffect(() => {
    if (userData?.uid) {
      const fetchStats = async () => {
        try {
          const enrollments = await enrollmentService.getUserEnrollments(userData.uid);
          const active = enrollments.filter(e => e.status === 'active' || e.status === 'completed');

          let totalLessons = 0;
          let totalProgress = 0;
          let completedCourses = 0;

          for (const en of active) {
            totalLessons += (en.completedLessonIds?.length || 0);
            totalProgress += (en.progress || 0);
            if (en.status === 'completed' || en.progress === 100) {
              completedCourses += 1;
            }
          }

          const avgProgress = active.length > 0 ? Math.round(totalProgress / active.length) : 0;

          // Estimate hours (1.5 hours per completed lesson avg if exact duration not found)
          // For a real app, you'd fetch lesson durations, but 1.5h is a safe estimate for a dashboard metric.
          const estimatedHours = Math.round(totalLessons * 1.5);

          setStats([
            { label: "Hours Learned", value: `${estimatedHours}h`, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Lessons Done", value: totalLessons.toString(), icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Avg. Progress", value: `${avgProgress}%`, icon: Flame, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Certificates", value: completedCourses.toString(), icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-50" },
          ]);
        } catch (error) {
          console.error("Failed to fetch stats", error);
        }
      };

      fetchStats();
    }
  }, [userData]);

  return (
    <div className="glass-card rounded-3xl p-6 shadow-sm border-0 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity size={20} className="text-brand-blue" />
          My Learning Journey
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2 p-4 rounded-3xl bg-white/40 dark:bg-gray-800/40 border border-white/40 dark:border-gray-700/50 hover:bg-white transition-all group">
            <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
