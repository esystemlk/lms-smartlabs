"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UpcomingSchedule } from "@/components/features/UpcomingSchedule";
import { notificationService, Notification } from "@/services/notificationService";
import { userService } from "@/services/userService";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { useTutorial } from "@/context/TutorialContext";
import { homeTourSteps } from "@/lib/tourSteps";
import { enrollmentService } from "@/services/enrollmentService";
import { Enrollment } from "@/lib/types";
import {
  BookOpen,
  Users,
  Video,
  GraduationCap,
  Bell,
  ChevronRight,
  ArrowRight,
  LayoutGrid,
  PlayCircle,
  Clock,
  FolderOpen,
  Calendar,
  Sparkles,
  LifeBuoy,
  Compass,
  Rocket,
  FileText,
  ClipboardCheck,
  TrendingUp,
  Flame,
  Sun,
  Moon,
  Cloud,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { courseService } from "@/services/courseService";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { LecturerDashboard } from "@/components/lecturer/LecturerDashboard";

// Primary destinations for students — one clean, uniform grid.
const QUICK_ACTIONS = [
  { id: "t-action-live", title: "Live Classes", desc: "Join your sessions", icon: Video, href: "/lms/live", tint: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
  { id: "t-action-recordings", title: "Recordings", desc: "Watch replays", icon: PlayCircle, href: "/lms/my-recordings", tint: "text-pink-600 bg-pink-50 dark:bg-pink-500/10" },
  { id: "t-action-resources", title: "Resources", desc: "Notes & files", icon: FolderOpen, href: "/lms/resources", tint: "text-violet-600 bg-violet-50 dark:bg-violet-500/10" },
  { id: "t-action-timetable", title: "Timetable", desc: "Your schedule", icon: Calendar, href: "/lms/timetable", tint: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
  { id: "t-action-assignments", title: "Assignments", desc: "Submit work", icon: FileText, href: "/lms/assignments", tint: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
  { id: "t-action-exams", title: "Exams", desc: "Take tests", icon: ClipboardCheck, href: "/lms/exams", tint: "text-red-600 bg-red-50 dark:bg-red-500/10" },
  { id: "t-action-courses", title: "Courses", desc: "Browse & enroll", icon: BookOpen, href: "/courses", tint: "text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10" },
  { id: "t-action-community", title: "Community", desc: "Connect", icon: Users, href: "/community", tint: "text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-500/10" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", Icon: Sun };
  if (h < 18) return { text: "Good afternoon", Icon: Cloud };
  return { text: "Good evening", Icon: Moon };
}

export default function DashboardPage() {
  const { userData } = useAuth();
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [lastEnrolled, setLastEnrolled] = useState<Enrollment | null>(null);
  const [recentEnrollments, setRecentEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState({ hours: 0, lessons: 0, avgProgress: 0, courses: 0 });
  const { startTutorial } = useTutorial();

  const handleStartTour = () => startTutorial(homeTourSteps);

  const isNewStudent =
    userData?.role === "student" &&
    (!userData?.enrolledBatches || userData.enrolledBatches.length === 0);

  // Auto-launch the guided tour once for brand-new students.
  useEffect(() => {
    if (!userData || userData.role !== "student") return;
    if (userData.onboardingCompleted) return;
    let seen = false;
    try {
      seen = localStorage.getItem("sl_onboarded") === "1";
    } catch {
      seen = false;
    }
    if (seen) return;

    const timer = setTimeout(() => {
      startTutorial(homeTourSteps);
      try {
        localStorage.setItem("sl_onboarded", "1");
      } catch {
        /* ignore */
      }
      userService.updateProfile(userData.uid, { onboardingCompleted: true }).catch(() => {});
    }, 900);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.uid, userData?.onboardingCompleted, userData?.role]);

  useEffect(() => {
    notificationService
      .getRecentNotifications(1)
      .then((notifs) => notifs.length > 0 && setLatestNotification(notifs[0]))
      .catch((e) => console.error("Failed to fetch notifications", e));
  }, []);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!userData) return;
      try {
        const enrollments = await enrollmentService.getUserEnrollments(userData.uid);
        const active = enrollments.filter((e) => e.status === "active" || e.status === "completed");

        // Derive lightweight stats from the same fetch (no extra round-trips).
        let totalLessons = 0;
        let totalProgress = 0;
        active.forEach((en) => {
          totalLessons += en.completedLessonIds?.length || 0;
          totalProgress += en.progress || 0;
        });
        setStats({
          hours: Math.round(totalLessons * 1.5),
          lessons: totalLessons,
          avgProgress: active.length ? Math.round(totalProgress / active.length) : 0,
          courses: active.length,
        });

        const activeOnly = enrollments.filter((e) => e.status === "active");
        if (activeOnly.length > 0) {
          activeOnly.sort((a, b) => {
            const timeA = a.lastAccessed?.seconds || a.enrolledAt?.seconds || 0;
            const timeB = b.lastAccessed?.seconds || b.enrolledAt?.seconds || 0;
            return timeB - timeA;
          });
          setLastEnrolled(activeOnly[0]);
          setRecentEnrollments(activeOnly.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch enrollments", error);
      }
    };
    fetchEnrollments();
  }, [userData]);

  if (userData?.role && ["admin", "superadmin", "developer"].includes(userData.role)) {
    return <AdminDashboard />;
  }
  if (userData?.role === "lecturer") {
    return <LecturerDashboard />;
  }

  const greeting = getGreeting();
  const firstName = userData?.name?.split(" ")[0] || "Student";
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const statPills = [
    { label: "Hours", value: `${stats.hours}h`, icon: Clock },
    { label: "Lessons", value: `${stats.lessons}`, icon: BookOpen },
    { label: "Avg progress", value: `${stats.avgProgress}%`, icon: TrendingUp },
    { label: "Courses", value: `${stats.courses}`, icon: GraduationCap },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24">
      {/* ===================== HERO ===================== */}
      <motion.section
        id="t-welcome"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-2xl"
      >
        {/* glow accents */}
        <div className="absolute -top-24 -right-16 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "26px 26px" }}
        />

        <div className="relative z-10 p-5 sm:p-6 md:p-9">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 md:gap-6">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-blue-200/80">
                <greeting.Icon size={15} /> {dateStr}
              </div>
              <h1 className="text-[1.7rem] sm:text-3xl md:text-[2.6rem] font-black leading-tight mt-2 break-words">
                {greeting.text}, <span className="text-blue-300">{firstName}</span>
              </h1>
              <p className="text-blue-100/70 mt-1.5 font-medium text-sm sm:text-base">Ready to continue your learning journey?</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link id="t-enter-lms" href="/lms">
                <Button className="bg-white text-blue-800 hover:bg-blue-50 rounded-2xl px-6 h-12 font-bold shadow-lg flex items-center gap-2 group">
                  <LayoutGrid size={20} className="group-hover:rotate-12 transition-transform" />
                  Enter LMS
                </Button>
              </Link>
              <Link
                id="t-help-link"
                href="/help"
                className="h-12 px-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur text-white font-bold flex items-center gap-2 hover:bg-white/20 transition-all"
                title="Help & Guide"
              >
                <LifeBuoy size={20} />
                <span className="hidden md:inline">Help</span>
              </Link>
              <button
                onClick={handleStartTour}
                className="h-12 w-12 rounded-2xl border border-white/20 bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20 transition-all"
                title="Take a tour"
              >
                <Compass size={22} />
              </button>
            </div>
          </div>

          {/* inline stats */}
          <div id="t-stats-student" className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
            {statPills.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 border border-white/10 backdrop-blur px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <s.icon size={18} className="text-blue-200" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-black leading-none">{s.value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-100/60 mt-1 truncate">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* New-student onboarding */}
      {isNewStudent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30 p-6 md:p-7"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                <Rocket size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">New here? Let&apos;s get you started</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-xl">
                  Take a 30-second tour of your home page, then open the Help Center to learn how classes, recordings and resources work.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <button
                onClick={handleStartTour}
                className="inline-flex items-center gap-2 bg-brand-blue text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-600 active:scale-95 transition-all"
              >
                <Compass size={18} /> Start tour
              </button>
              <Link
                href="/help"
                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold px-5 py-2.5 rounded-xl hover:border-brand-blue transition-all"
              >
                <LifeBuoy size={18} /> Help Center
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Announcement highlight */}
      {latestNotification && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
        >
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-brand-blue flex-shrink-0">
            <Bell size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Latest
              </span>
              <span className="text-xs text-gray-400">
                {latestNotification.createdAt?.seconds
                  ? new Date(latestNotification.createdAt.seconds * 1000).toLocaleDateString()
                  : "Just now"}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base truncate mt-1">{latestNotification.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{latestNotification.message}</p>
          </div>
          <Link href={latestNotification.link || "/lms"} className="flex-shrink-0">
            <Button variant="ghost" size="sm" className="text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl">
              View <ChevronRight size={16} className="ml-1" />
            </Button>
          </Link>
        </motion.div>
      )}

      {/* ===================== QUICK ACTIONS ===================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-brand-blue rounded-full" />
              Quick Actions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-4">Jump straight to what you need.</p>
          </div>
          <Link href="/help" className="text-sm font-bold text-brand-blue hidden sm:flex items-center gap-1 hover:gap-2 transition-all">
            How does this work? <ArrowRight size={16} />
          </Link>
        </div>

        <div id="t-menu" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {QUICK_ACTIONS.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link id={a.id} href={a.href} className="group block h-full">
                <div className="h-full rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 md:p-5 shadow-sm hover:shadow-lg hover:border-brand-blue/30 hover:-translate-y-1 transition-all">
                  <div className="flex items-start justify-between">
                    <div className={clsx("w-11 h-11 rounded-2xl flex items-center justify-center", a.tint)}>
                      <a.icon size={22} strokeWidth={1.9} />
                    </div>
                    <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-brand-blue group-hover:-rotate-45 transition-all mt-1" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mt-3 text-sm md:text-base group-hover:text-brand-blue transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{a.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
          {/* Help & Guide tile */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: QUICK_ACTIONS.length * 0.03 }}>
            <Link href="/help" className="group block h-full">
              <div className="h-full rounded-2xl border border-teal-100 dark:border-teal-900/40 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 p-4 md:p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-teal-600 bg-white/70 dark:bg-teal-500/10">
                    <LifeBuoy size={22} strokeWidth={1.9} />
                  </div>
                  <ArrowRight size={16} className="text-teal-300 group-hover:text-teal-600 group-hover:-rotate-45 transition-all mt-1" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mt-3 text-sm md:text-base">Help &amp; Guide</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Learn every page</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===================== FOCUS + SCHEDULE ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue learning (focus) */}
        <div className="lg:col-span-2 space-y-6">
          {lastEnrolled ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-slate-800 p-6 md:p-8 text-white shadow-xl group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.08] translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-700">
                <GraduationCap size={170} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
                  <Clock size={15} /> Continue learning
                </div>
                <h3 className="text-2xl md:text-3xl font-black mb-1 pr-10">{lastEnrolled.courseTitle}</h3>
                {lastEnrolled.batchName && <p className="text-gray-400 mb-6">{lastEnrolled.batchName}</p>}
                <div className="space-y-2 mb-6 max-w-md">
                  <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>Progress</span>
                    <span>{lastEnrolled.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-blue rounded-full transition-all duration-1000" style={{ width: `${lastEnrolled.progress || 5}%` }} />
                  </div>
                </div>
                <Link href={`/courses/${lastEnrolled.courseId}`}>
                  <Button className="bg-white text-gray-900 hover:bg-gray-100 rounded-xl px-6 h-11 font-bold shadow-lg">
                    <PlayCircle size={18} className="mr-2 text-brand-blue" />
                    Resume course
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-brand-blue flex items-center justify-center mx-auto mb-4">
                <BookOpen size={26} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Start your first course</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-5 max-w-sm mx-auto">
                Browse the catalogue, enroll in a program, and your classes and resources unlock instantly.
              </p>
              <Link href="/courses">
                <Button className="bg-brand-blue hover:bg-blue-600 text-white rounded-xl px-6 h-11 font-bold">Browse courses</Button>
              </Link>
            </motion.div>
          )}

          {/* Recent courses */}
          {recentEnrollments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your courses</h2>
                <Link href="/learn" className="text-sm font-bold text-brand-blue flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentEnrollments.map((en) => (
                  <Link key={en.id} href={`/courses/${en.courseId}`} className="group">
                    <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold line-clamp-1 group-hover:text-brand-blue transition-colors text-gray-900 dark:text-white">
                          {en.courseTitle}
                        </h3>
                        {en.batchName && <p className="text-xs text-gray-500 truncate">{en.batchName}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Recommendations />
        </div>

        {/* Right column: schedule */}
        <motion.div id="t-upcoming-student" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="lg:sticky lg:top-20 h-fit">
          <UpcomingSchedule userData={userData} />
        </motion.div>
      </div>
    </div>
  );
}

function Recommendations() {
  const { userData } = useAuth();
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);
  useEffect(() => {
    const load = async () => {
      const all = await courseService.getPublishedCourses();
      const enrolled = new Set(userData?.enrolledCourses || []);
      const recs = all
        .filter((c) => !enrolled.has(c.id))
        .slice(0, 4)
        .map((c) => ({ id: c.id, title: c.title }));
      setItems(recs);
    };
    load().catch(() => {});
  }, [userData?.enrolledCourses]);

  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-pink-600 text-white flex items-center justify-center">
            <Sparkles className="w-3 h-3" />
          </span>
          Recommended for you
        </h2>
        <Link href="/courses" className="text-sm font-bold text-brand-blue flex items-center gap-1">
          Explore <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((c) => (
          <Link key={c.id} href={`/courses/${c.id}`} className="group">
            <div className="rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-pink-600 text-white flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold line-clamp-2 group-hover:text-brand-blue transition-colors mt-3 text-gray-900 dark:text-white">
                {c.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Suggested for you</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
