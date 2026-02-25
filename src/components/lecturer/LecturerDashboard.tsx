"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, PlayCircle, BookOpen, Users, FolderOpen, Video, Settings, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { courseService } from "@/services/courseService";
import { assignmentService } from "@/services/assignmentService";
import { Course, Lesson } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function LecturerDashboard() {
  const { userData } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [upcoming, setUpcoming] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<Array<{ assignment: any; courseTitle: string; submissions: any[] }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await courseService.getAllCourses();
        const mine = all.filter(c => c.lecturerId === userData?.uid || c.instructorId === userData?.uid);
        setCourses(mine);
        const live = await courseService.getUpcomingLiveClasses();
        const mineLive = live.filter(l => mine.some(c => c.id === l.courseId));
        setUpcoming(mineLive.slice(0, 6));
        if (userData?.uid) {
          const q = await assignmentService.getLecturerPendingSubmissions(userData.uid);
          setQueue(q);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userData?.uid]);

  const stats = useMemo(() => {
    const activeCourses = courses.filter(c => c.published).length;
    const totalStudents = 0;
    return { activeCourses, totalStudents, upcomingCount: upcoming.length };
  }, [courses, upcoming]);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Lecturer Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your courses, live sessions and resources</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/courses">
            <Button variant="outline" className="rounded-full px-5">Create Course</Button>
          </Link>
          <Link href="/live-classes">
            <Button className="rounded-full px-5">Manage Live Classes</Button>
          </Link>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      >
        <StatCard title="Active Courses" value={stats.activeCourses} icon={BookOpen} color="bg-emerald-500" />
        <StatCard title="Upcoming Sessions" value={stats.upcomingCount} icon={Calendar} color="bg-indigo-500" />
        <StatCard title="Students (est.)" value={stats.totalStudents} icon={Users} color="bg-blue-500" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Upcoming Live Classes</h2>
              <Link href="/live-classes" className="text-sm font-medium text-brand-blue flex items-center gap-1">
                View <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)
              ) : upcoming.length === 0 ? (
                <div className="text-sm text-gray-500">No upcoming sessions</div>
              ) : (
                upcoming.map(l => (
                  <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{l.title || "Live Class"}</div>
                      <div className="text-xs text-gray-500">{l.startTime ? new Date(l.startTime).toLocaleString() : "-"}</div>
                    </div>
                    {l.courseId && (
                      <Link href={`/courses/manage/${l.courseId}`} className="text-xs text-brand-blue">Manage</Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickAction href="/admin/courses" icon={BookOpen} label="New Course" color="bg-emerald-500" />
              <QuickAction href="/live-classes" icon={Calendar} label="Schedule Live" color="bg-indigo-500" />
              <QuickAction href="/admin/resources" icon={FolderOpen} label="Resources" color="bg-orange-500" />
              <QuickAction href="/lms/recordings" icon={PlayCircle} label="Recordings" color="bg-violet-600" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Grading Queue</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {queue.reduce((s, q) => s + q.submissions.length, 0)} pending
              </span>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)
              ) : queue.length === 0 ? (
                <div className="text-sm text-gray-500">No pending submissions</div>
              ) : (
                queue.slice(0, 5).map(item => (
                  <div key={item.assignment.id} className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold line-clamp-1">{item.assignment.title || "Assignment"}</div>
                        <div className="text-xs text-gray-500">{item.courseTitle}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {item.submissions.length} to grade
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                      {item.submissions.slice(0, 4).map(sub => (
                        <span key={sub.id} className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {sub.studentName || sub.id}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Your Courses</h2>
              <Link href="/admin/courses" className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings className="w-4 h-4 text-gray-500" />
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1,2].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)
              ) : courses.length === 0 ? (
                <div className="text-sm text-gray-500">No courses yet</div>
              ) : (
                courses.slice(0, 5).map(c => (
                  <Link key={c.id} href={`/courses/manage/${c.id}`} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold line-clamp-1">{c.title}</div>
                      <div className="text-xs text-gray-500">{c.published ? "Published" : "Draft"}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

type StatCardProps = { title: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: string };
function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-xs text-gray-400">{title}</div>
      </div>
      <div className="text-2xl font-black">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

type QuickActionProps = { href: string; icon: React.ComponentType<{ className?: string }>; label: string; color: string };
function QuickAction({ href, icon: Icon, label, color }: QuickActionProps) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold">{label}</span>
    </Link>
  );
}
