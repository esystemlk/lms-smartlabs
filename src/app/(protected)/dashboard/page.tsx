"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { format, formatDistanceToNow } from "date-fns";
import {
  VideoCamera,
  CalendarBlank,
  PlayCircle,
  ClipboardText,
  Exam,
  FolderOpen,
  Storefront,
  CaretRight,
  ArrowRight,
  Play,
  BookOpenText,
  Megaphone,
  Lifebuoy,
  Compass,
  SquaresFour,
  Books,
  Clock,
  Lightning,
  ChartLineUp,
  CheckCircle,
  CircleNotch,
  FilmStrip,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useTutorial } from "@/context/TutorialContext";
import { homeTourSteps } from "@/lib/tourSteps";
import { userService } from "@/services/userService";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { notificationService, Notification } from "@/services/notificationService";
import { filterClassesForUser } from "@/lib/classAccess";
import type { Enrollment, Lesson } from "@/lib/types";

const QUICK_ACTIONS = [
  { id: "t-action-recordings", title: "Watch recordings", desc: "Replays of every class", icon: PlayCircle, href: "/lms/my-recordings", tint: "bg-soft text-primary" },
  { id: "t-action-assignments", title: "Assignments", desc: "Submit your work", icon: ClipboardText, href: "/lms/assignments", tint: "bg-[#FFF1E6] text-brand-orange" },
  { id: "t-action-exams", title: "Exams", desc: "Take tests & mocks", icon: Exam, href: "/lms/exams", tint: "bg-[#FFECEF] text-[#E0334A]" },
  { id: "t-action-resources", title: "Study materials", desc: "Notes & PDFs", icon: FolderOpen, href: "/lms/resources", tint: "bg-[#E6F8F1] text-brand-mint" },
  { id: "t-action-timetable", title: "Timetable", desc: "Your weekly schedule", icon: CalendarBlank, href: "/lms/timetable", tint: "bg-[#FFF5E0] text-[#C27C00]" },
  { id: "t-action-courses", title: "Browse courses", desc: "Enrol & pay", icon: Storefront, href: "/courses", tint: "bg-[#E8F4FE] text-[#0B66A8]" },
];

type TabId = "overview" | "courses" | "classes" | "news";
const DEFAULT_CLASS_MIN = 90; // when a class has no duration set

/** When a class ends: its start plus its own duration (fallback 90 min). */
function classEndMs(c: Pick<Lesson, "startTime" | "duration">): number {
  const start = c.startTime ? new Date(c.startTime).getTime() : 0;
  return start + (c.duration || DEFAULT_CLASS_MIN) * 60_000;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function useCountdown(target?: string, endMs?: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return { live: !!endMs && now < endMs, h: 0, m: 0, s: 0 };
  return {
    live: false,
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

export default function DashboardPage() {
  const { userData } = useAuth();
  const { startTutorial } = useTutorial();
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Lesson[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [news, setNews] = useState<Notification[]>([]);

  // Load everything the home page needs in one go.
  useEffect(() => {
    if (!userData) return;
    let cancelled = false;
    (async () => {
      try {
        const [upcoming, mine, notifs] = await Promise.all([
          courseService.getUpcomingLiveClasses(),
          enrollmentService.getUserEnrollments(userData.uid),
          notificationService.getRecentNotifications(5),
        ]);
        if (cancelled) return;
        // The service keeps classes for 2h after start; drop the ones that have already ended.
        const nowMs = Date.now();
        setClasses(filterClassesForUser(upcoming, mine, userData).filter((c) => classEndMs(c) > nowMs));
        setEnrollments(
          mine
            .filter((e) => e.status === "active" || e.status === "completed")
            .sort((a, b) => (b.lastAccessed?.seconds || b.enrolledAt?.seconds || 0) - (a.lastAccessed?.seconds || a.enrolledAt?.seconds || 0))
        );
        setNews(notifs);
      } catch (e) {
        console.error("Failed to load home page", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userData]);

  // Auto-launch the guided tour once for brand-new students.
  useEffect(() => {
    if (!userData || userData.role !== "student" || userData.onboardingCompleted) return;
    let seen = false;
    try {
      seen = localStorage.getItem("sl_onboarded") === "1";
    } catch {
      /* storage unavailable */
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

  const nextClass = classes[0];
  const countdown = useCountdown(nextClass?.startTime, nextClass ? classEndMs(nextClass) : undefined);

  const stats = useMemo(() => {
    const lessons = enrollments.reduce((n, e) => n + (e.completedLessonIds?.length || 0), 0);
    const avg = enrollments.length ? Math.round(enrollments.reduce((n, e) => n + (e.progress || 0), 0) / enrollments.length) : 0;
    return { courses: enrollments.length, lessons, avg, upcoming: classes.length };
  }, [enrollments, classes]);

  if (!userData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <CircleNotch size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const firstName = userData.name?.split(" ")[0] || "there";
  const joinUrl = nextClass?.zoomJoinUrl;

  const tabs: { id: TabId; label: string; icon: typeof SquaresFour; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: SquaresFour },
    { id: "courses", label: "My courses", icon: Books, badge: enrollments.length || undefined },
    { id: "classes", label: "Upcoming classes", icon: VideoCamera, badge: classes.length || undefined },
    { id: "news", label: "Announcements", icon: Megaphone },
  ];

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {/* Greeting */}
      <div id="t-welcome" className="sl-rise flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-muted">{format(new Date(), "EEEE, d MMMM")}</p>
          <h1 className="text-[26px] md:text-[30px] font-extrabold text-ink dark:text-white leading-tight">
            {greeting()}, {firstName}
          </h1>
          <p className="text-[15px] text-ink-muted mt-1">
            {loading
              ? "Getting your day ready…"
              : classes.length
                ? <>You have <b className="text-ink dark:text-white">{classes.length} upcoming class{classes.length > 1 ? "es" : ""}</b>.</>
                : "No live classes scheduled right now."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link id="t-help-link" href="/help" className="sl-btn sl-btn-outline">
            <Lifebuoy size={18} /> Help
          </Link>
          <button type="button" onClick={() => startTutorial(homeTourSteps)} className="sl-btn sl-btn-outline" aria-label="Take a tour">
            <Compass size={18} /> <span className="hidden sm:inline">Tour</span>
          </button>
        </div>
      </div>

      {/* Next class hero */}
      <section className="sl-hero sl-rise relative overflow-hidden rounded-[26px] p-5 md:p-7 text-white" style={{ animationDelay: ".05s" }}>
        <span aria-hidden className="sl-float absolute -right-10 -top-20 w-56 h-56 rounded-full bg-[radial-gradient(circle,#9EB0FF,transparent_70%)] opacity-60" />
        <span aria-hidden className="sl-float absolute right-56 -bottom-24 w-40 h-40 rounded-full bg-[radial-gradient(circle,#FFB070,transparent_70%)] opacity-50" style={{ animationDelay: "-3s" }} />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0 flex-1 basis-[280px]">
            <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-white/20 text-xs font-semibold">
              {countdown?.live ? <><span className="sl-live-dot" /> Live now</> : <><Lightning size={14} weight="fill" /> Next live class</>}
            </span>
            {nextClass ? (
              <>
                <h2 className="text-[21px] md:text-[26px] font-extrabold mt-3 leading-snug break-words">{nextClass.title}</h2>
                {nextClass.startTime && (
                  <p className="text-[#DCE2FF] mt-1 flex items-center gap-1.5 text-sm md:text-[15px]">
                    <Clock size={16} /> {format(new Date(nextClass.startTime), "EEE d MMM · h:mm a")}
                  </p>
                )}
                {countdown && !countdown.live && (
                  <div className="flex gap-2 mt-4" aria-label="Time until class starts">
                    {[
                      [countdown.h, "hrs"],
                      [countdown.m, "min"],
                      [countdown.s, "sec"],
                    ].map(([v, l]) => (
                      <div key={l} className="min-w-[58px] text-center rounded-xl bg-white/15 border border-white/25 px-3 py-1.5">
                        <b className="block font-display text-xl tabular-nums">{String(v).padStart(2, "0")}</b>
                        <small className="text-[11px] text-[#DCE2FF]">{l}</small>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-[21px] md:text-[26px] font-extrabold mt-3">{loading ? "Checking your schedule…" : "No class scheduled yet"}</h2>
                <p className="text-[#DCE2FF] mt-1 text-sm md:text-[15px]">
                  {stats.courses ? "We'll show your next live class here as soon as it's scheduled." : "Enrol in a course to start joining live classes."}
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {nextClass ? (
              <a
                id="t-enter-lms"
                href={joinUrl || "/lms/live"}
                target={joinUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="sl-btn sl-btn-white flex-1 sm:flex-none"
              >
                <VideoCamera size={18} weight="fill" /> Join class
              </a>
            ) : (
              <Link id="t-enter-lms" href={stats.courses ? "/lms/live" : "/courses"} className="sl-btn sl-btn-white flex-1 sm:flex-none">
                {stats.courses ? <><VideoCamera size={18} weight="fill" /> Live classes</> : <><Storefront size={18} weight="fill" /> Browse courses</>}
              </Link>
            )}
            <Link href="/lms/timetable" className="sl-btn sl-btn-ghost-white flex-1 sm:flex-none">
              <CalendarBlank size={18} /> Timetable
            </Link>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section id="t-menu" aria-label="Quick actions" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {QUICK_ACTIONS.map((a, i) => (
          <Link
            key={a.id}
            id={a.id}
            href={a.href}
            className="sl-card sl-card-hover sl-rise group flex flex-col gap-3 p-4 !rounded-[18px]"
            style={{ animationDelay: `${0.08 + i * 0.04}s` }}
          >
            <span className={clsx("w-11 h-11 rounded-[14px] flex items-center justify-center", a.tint)}>
              <a.icon size={22} weight="duotone" />
            </span>
            <span className="min-w-0">
              <span className="flex items-center justify-between font-semibold text-[14.5px] text-ink dark:text-white">
                {a.title}
                <CaretRight size={16} className="text-ink-muted group-hover:translate-x-0.5 transition-transform" />
              </span>
              <span className="block text-[12.5px] text-ink-muted">{a.desc}</span>
            </span>
          </Link>
        ))}
      </section>

      {/* Tabs */}
      <div role="tablist" aria-label="Home sections" className="flex gap-1 p-1.5 bg-white dark:bg-slate-900 border border-line dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={clsx(
                "h-10 px-4 rounded-xl inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors",
                on ? "bg-ink text-white shadow-[0_4px_12px_rgba(15,23,42,.18)] dark:bg-white dark:text-ink" : "text-slate-600 dark:text-slate-300 hover:text-ink"
              )}
            >
              <t.icon size={18} weight={on ? "fill" : "regular"} />
              {t.label}
              {t.badge ? (
                <span className={clsx("text-[11.5px] px-1.5 rounded-full", on ? "bg-white/20" : "bg-soft text-primary")}>{t.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
          <div className="flex flex-col gap-5 min-w-0">
            <ContinueLearning enrollments={enrollments.slice(0, 3)} loading={loading} />
            <UpcomingList id="t-upcoming-student" classes={classes.slice(0, 4)} loading={loading} />
          </div>
          <div className="flex flex-col gap-5 min-w-0">
            <StatsCard stats={stats} />
            <NewsCard news={news.slice(0, 2)} onViewAll={() => setTab("news")} />
          </div>
        </div>
      )}
      {tab === "courses" && <ContinueLearning enrollments={enrollments} loading={loading} full />}
      {tab === "classes" && <UpcomingList classes={classes} loading={loading} full />}
      {tab === "news" && <NewsCard news={news} />}
    </div>
  );
}

/* ---------------- Sections ---------------- */

function CardHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-[17px] font-bold text-ink dark:text-white">{title}</h3>
      {action}
    </div>
  );
}

function Empty({ icon: Icon, text, cta }: { icon: typeof Books; text: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-6">
      <span className="w-12 h-12 rounded-2xl bg-soft text-primary flex items-center justify-center">
        <Icon size={24} weight="duotone" />
      </span>
      <p className="text-sm text-ink-muted max-w-xs">{text}</p>
      {cta}
    </div>
  );
}

function ContinueLearning({ enrollments, loading, full }: { enrollments: Enrollment[]; loading: boolean; full?: boolean }) {
  return (
    <section className="sl-card sl-rise p-4 md:p-5 flex flex-col gap-3.5">
      <CardHead
        title={full ? "My courses" : "Continue learning"}
        action={
          <Link href="/courses" className="sl-btn sl-btn-sm sl-btn-soft">
            All courses <ArrowRight size={16} />
          </Link>
        }
      />
      {loading ? (
        <SkeletonRows />
      ) : enrollments.length === 0 ? (
        <Empty
          icon={Books}
          text="You're not enrolled in a course yet. Enrolling unlocks live classes, recordings and materials."
          cta={
            <span className="flex flex-wrap justify-center gap-2">
              <Link href="/courses" className="sl-btn sl-btn-primary sl-btn-sm">
                <Storefront size={16} /> Browse courses
              </Link>
              <Link href="/recorded-courses" className="sl-btn sl-btn-soft sl-btn-sm">
                <FilmStrip size={16} /> Recorded courses
              </Link>
            </span>
          }
        />
      ) : (
        <div className={clsx("grid gap-3", full && "md:grid-cols-2")}>
          {enrollments.map((en) => (
            <div key={en.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-[#EEF1F7] dark:border-slate-800">
              <span className="w-11 h-11 rounded-[14px] bg-soft text-primary flex items-center justify-center shrink-0">
                <BookOpenText size={22} weight="fill" />
              </span>
              <div className="flex-1 min-w-0 basis-[160px]">
                <p className="font-semibold text-[14.5px] text-ink dark:text-white truncate">{en.courseTitle}</p>
                {en.batchName && <p className="text-[13px] text-ink-muted truncate">{en.batchName}</p>}
                <div className="h-2 mt-2 rounded-full bg-[#EDF0F7] dark:bg-slate-700 overflow-hidden">
                  <span
                    className="sl-bar-fill block h-full rounded-full bg-gradient-to-r from-primary to-brand-orange"
                    style={{ width: `${Math.max(en.progress || 0, 3)}%` }}
                  />
                </div>
                <p className="text-[12px] text-ink-muted mt-1">{en.progress || 0}% complete</p>
              </div>
              <Link href={`/courses/${en.courseId}`} className="sl-btn sl-btn-sm sl-btn-primary w-full sm:w-auto">
                <Play size={14} weight="fill" /> Resume
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function UpcomingList({ classes, loading, full, id }: { classes: Lesson[]; loading: boolean; full?: boolean; id?: string }) {
  return (
    <section id={id} className="sl-card sl-rise p-4 md:p-5 flex flex-col gap-3.5">
      <CardHead
        title={full ? "Upcoming classes" : "Coming up"}
        action={
          <Link href="/lms/live" className="sl-btn sl-btn-sm sl-btn-soft">
            Live classes <ArrowRight size={16} />
          </Link>
        }
      />
      {loading ? (
        <SkeletonRows />
      ) : classes.length === 0 ? (
        <Empty icon={CalendarBlank} text="No upcoming classes right now. Check your timetable for the full week." />
      ) : (
        <div className="grid gap-2.5">
          {classes.map((c) => {
            const start = c.startTime ? new Date(c.startTime) : null;
            return (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-[#EEF1F7] dark:border-slate-800">
                <div className="w-12 h-12 rounded-[14px] bg-white dark:bg-slate-900 border border-line dark:border-slate-700 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold uppercase text-primary leading-none">{start ? format(start, "MMM") : "—"}</span>
                  <span className="font-display font-extrabold text-lg leading-none text-ink dark:text-white">{start ? format(start, "d") : ""}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14.5px] text-ink dark:text-white truncate">{c.title}</p>
                  <p className="text-[13px] text-ink-muted">
                    {start ? `${format(start, "h:mm a")} · ${formatDistanceToNow(start, { addSuffix: true })}` : "Time to be announced"}
                  </p>
                </div>
                {c.zoomJoinUrl ? (
                  <a href={c.zoomJoinUrl} target="_blank" rel="noopener noreferrer" className="sl-btn sl-btn-sm sl-btn-outline shrink-0">
                    <VideoCamera size={16} /> <span className="hidden sm:inline">Join</span>
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function StatsCard({ stats }: { stats: { courses: number; lessons: number; avg: number; upcoming: number } }) {
  const circumference = 2 * Math.PI * 40;
  return (
    <section id="t-stats-student" className="sl-card sl-rise p-4 md:p-5 flex flex-col gap-4">
      <CardHead title="My progress" />
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90" aria-hidden>
          <defs>
            <linearGradient id="sl-ring" x1="0" x2="1">
              <stop offset="0" stopColor="#3B5BFD" />
              <stop offset="1" stopColor="#FF7A1A" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#EDF0F7" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#sl-ring)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - stats.avg / 100)}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)" }}
          />
        </svg>
        <div>
          <p className="font-display text-[28px] font-extrabold text-ink dark:text-white leading-none">{stats.avg}%</p>
          <p className="text-[13.5px] text-ink-muted mt-1">Average course progress</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Courses", value: stats.courses, icon: Books },
          { label: "Lessons done", value: stats.lessons, icon: CheckCircle },
          { label: "Upcoming", value: stats.upcoming, icon: ChartLineUp },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-3 bg-slate-50 dark:bg-slate-800/60 border border-[#EEF1F7] dark:border-slate-800">
            <s.icon size={18} className="text-primary" />
            <p className="font-display font-extrabold text-xl text-ink dark:text-white mt-1">{s.value}</p>
            <p className="text-[12px] text-ink-muted leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function NewsCard({ news, onViewAll }: { news: Notification[]; onViewAll?: () => void }) {
  return (
    <section className="sl-card sl-rise p-4 md:p-5 flex flex-col gap-3.5">
      <CardHead
        title="Announcements"
        action={
          onViewAll ? (
            <button type="button" onClick={onViewAll} className="sl-btn sl-btn-sm sl-btn-soft">
              View all
            </button>
          ) : undefined
        }
      />
      {news.length === 0 ? (
        <Empty icon={Megaphone} text="No announcements yet." />
      ) : (
        <div className="grid gap-2.5">
          {news.map((n) => (
            <Link
              key={n.id}
              href={n.link || "#"}
              className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-[#EEF1F7] dark:border-slate-800 hover:border-[#C9D3FF] transition-colors"
            >
              <span className="w-10 h-10 rounded-xl bg-soft text-primary flex items-center justify-center shrink-0">
                <Megaphone size={20} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-[14.5px] text-ink dark:text-white">{n.title}</span>
                <span className="block text-[13px] text-ink-muted line-clamp-2">{n.message}</span>
                {n.createdAt?.seconds ? (
                  <span className="block text-[12px] text-ink-muted mt-0.5">
                    {formatDistanceToNow(new Date(n.createdAt.seconds * 1000), { addSuffix: true })}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function SkeletonRows() {
  return (
    <div className="grid gap-2.5" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="h-[72px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      ))}
    </div>
  );
}
