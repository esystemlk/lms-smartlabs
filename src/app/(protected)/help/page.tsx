"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useTutorial } from "@/context/TutorialContext";
import { homeTourSteps } from "@/lib/tourSteps";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Video,
  PlayCircle,
  Download,
  Calendar,
  FileText,
  BookOpen,
  ClipboardCheck,
  Users,
  MessageSquare,
  CreditCard,
  UserCog,
  Search,
  ArrowRight,
  HelpCircle,
  Compass,
  CheckCircle2,
  Sparkles,
  LifeBuoy,
} from "lucide-react";

type Guide = {
  id: string;
  title: string;
  tagline: string;
  icon: React.ElementType;
  gradient: string;
  href: string;
  category: string;
  steps: string[];
  tip?: string;
};

const GUIDES: Guide[] = [
  {
    id: "lms",
    title: "LMS Dashboard",
    tagline: "Your home base for everything learning.",
    icon: LayoutGrid,
    gradient: "from-blue-500 to-indigo-600",
    href: "/lms",
    category: "Getting Started",
    steps: [
      "Open the LMS Dashboard from the sidebar or the big “Enter LMS” button on your home page.",
      "The top card shows your next live class — tap Join Classroom when it is time.",
      "Use the coloured tiles to jump to Live Classes, Recordings, Assignments, Resources, Exams and your Timetable.",
      "Scroll down to see your weekly schedule and the Notice Board for announcements.",
    ],
    tip: "This is the fastest way to reach any classroom feature.",
  },
  {
    id: "live",
    title: "Live Classes",
    tagline: "Join real-time Zoom sessions with your teacher.",
    icon: Video,
    gradient: "from-sky-500 to-blue-600",
    href: "/lms/live",
    category: "Classes & Recordings",
    steps: [
      "Go to LMS Dashboard → Live Classes, or use “Join Live Classes” in the sidebar.",
      "You will only see classes for the batches and time slots you are enrolled in.",
      "When a class is live, a Join button appears. Tap it to open the classroom.",
      "Allow your browser to open Zoom, or join in the app if prompted.",
    ],
    tip: "Join a few minutes early so your audio and video are ready.",
  },
  {
    id: "recordings",
    title: "Recordings — How to Watch",
    tagline: "Re-watch any class you missed or want to review.",
    icon: PlayCircle,
    gradient: "from-pink-500 to-rose-600",
    href: "/lms/my-recordings",
    category: "Classes & Recordings",
    steps: [
      "Open LMS Dashboard → Recordings (“Watch Replays”).",
      "Recordings are grouped by course and date — pick the class you want.",
      "Tap the video to play it. You can pause, rewind and change quality.",
      "Some recordings expire after a set number of days, so watch important ones early.",
    ],
    tip: "Use recordings to revise before an exam or catch up on a missed class.",
  },
  {
    id: "resources",
    title: "Resources — How to Access Files",
    tagline: "Download notes, PDFs and study materials.",
    icon: Download,
    gradient: "from-violet-500 to-purple-600",
    href: "/lms/resources",
    category: "Study Materials",
    steps: [
      "Open LMS Dashboard → Resources.",
      "Files are organised by course and topic. Use the search box to find one quickly.",
      "Tap a file to preview it, or use the download icon to save it to your device.",
      "You can open PDFs and documents directly in your browser.",
    ],
    tip: "Downloaded files stay on your device so you can study offline.",
  },
  {
    id: "timetable",
    title: "Timetable & Class Schedule",
    tagline: "See exactly when your classes happen.",
    icon: Calendar,
    gradient: "from-emerald-500 to-teal-600",
    href: "/lms/timetable",
    category: "Study Materials",
    steps: [
      "Open LMS Dashboard → Timetable.",
      "Your weekly schedule shows every class for your enrolled batches.",
      "Each entry lists the subject, day and time slot.",
      "Check here at the start of each week so you never miss a session.",
    ],
    tip: "Your home page also shows the very next class at a glance.",
  },
  {
    id: "assignments",
    title: "Assignments",
    tagline: "Submit your work and track your progress.",
    icon: FileText,
    gradient: "from-orange-500 to-amber-600",
    href: "/lms/assignments",
    category: "Coursework",
    steps: [
      "Open LMS Dashboard → Assignments.",
      "Open an assignment to read the instructions and due date.",
      "Upload your file or type your answer, then submit before the deadline.",
      "Come back later to see feedback and marks once your teacher reviews it.",
    ],
    tip: "Submit early — late work may not be accepted.",
  },
  {
    id: "exams",
    title: "Exams & Quizzes",
    tagline: "Take tests online and see your results.",
    icon: ClipboardCheck,
    gradient: "from-red-500 to-rose-600",
    href: "/lms/exams",
    category: "Coursework",
    steps: [
      "Open LMS Dashboard → Exams.",
      "Available exams are listed with their time limits.",
      "Start when you are ready and answer each question — the timer is shown on screen.",
      "Submit before time runs out; your score appears once grading is complete.",
    ],
    tip: "Find a quiet place with a stable internet connection before you start.",
  },
  {
    id: "courses",
    title: "Browse & Enroll in Courses",
    tagline: "Discover new programs and join them.",
    icon: BookOpen,
    gradient: "from-cyan-500 to-blue-600",
    href: "/courses",
    category: "Getting Started",
    steps: [
      "Open Browse Courses from the sidebar or home menu.",
      "Explore the available courses and open one to see its details.",
      "Tap Enroll and choose your batch or time slot.",
      "Complete payment if required — then the course appears in My Learning.",
    ],
    tip: "After enrolling, your classes and resources unlock automatically.",
  },
  {
    id: "payments",
    title: "Payments & Enrollment",
    tagline: "Pay fees securely by card or bank transfer.",
    icon: CreditCard,
    gradient: "from-green-500 to-emerald-600",
    href: "/courses",
    category: "Getting Started",
    steps: [
      "During enrollment, choose to pay online (card) or by bank transfer.",
      "For card payments you are taken to the secure PayHere checkout.",
      "For bank transfer, follow the account details shown and upload your receipt.",
      "Your enrollment is confirmed once payment is approved.",
    ],
    tip: "Keep your payment receipt until your enrollment is marked active.",
  },
  {
    id: "community",
    title: "Community",
    tagline: "Chat and learn together with classmates.",
    icon: Users,
    gradient: "from-fuchsia-500 to-pink-600",
    href: "/community",
    category: "Connect",
    steps: [
      "Open Community from the sidebar.",
      "Read posts and messages from students and instructors.",
      "Ask questions and share what you are learning.",
      "Be respectful — the community is a shared learning space.",
    ],
  },
  {
    id: "messages",
    title: "Messages & Support",
    tagline: "Reach your teachers and the support team.",
    icon: MessageSquare,
    gradient: "from-rose-500 to-red-600",
    href: "/messages",
    category: "Connect",
    steps: [
      "Open Messages from the sidebar to see your inbox.",
      "Need help with the platform? Use the floating chat button (bottom-right) any time.",
      "Type your question and the support team will reply.",
      "Enable notifications so you know when you get a response.",
    ],
    tip: "The chat bubble is available on every page.",
  },
  {
    id: "profile",
    title: "Profile & Settings",
    tagline: "Keep your details and preferences up to date.",
    icon: UserCog,
    gradient: "from-slate-500 to-gray-700",
    href: "/profile",
    category: "Connect",
    steps: [
      "Open Profile from your avatar or the sidebar.",
      "Add a photo and check your name, email and Student ID.",
      "Visit Settings to change theme (light/dark), notifications and appearance.",
      "Save your changes — they apply across all your devices.",
    ],
  },
];

const CATEGORY_ORDER = ["Getting Started", "Classes & Recordings", "Study Materials", "Coursework", "Connect"];

export default function HelpPage() {
  const { userData } = useAuth();
  const { startTutorial } = useTutorial();
  const router = useRouter();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return GUIDES;
    return GUIDES.filter(
      (g) =>
        g.title.toLowerCase().includes(term) ||
        g.tagline.toLowerCase().includes(term) ||
        g.steps.some((s) => s.toLowerCase().includes(term))
    );
  }, [q]);

  const grouped = useMemo(() => {
    const acc: Record<string, Guide[]> = {};
    filtered.forEach((g) => {
      (acc[g.category] ||= []).push(g);
    });
    return acc;
  }, [filtered]);

  const categories = Object.keys(grouped).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );

  const startHomeTour = () => {
    // The interactive tour highlights elements on the home page, so send the
    // student there first, then launch it.
    startTutorial(homeTourSteps);
    router.push("/dashboard");
  };

  const firstName = userData?.name?.split(" ")[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-600 p-8 md:p-10 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -mr-24 -mt-24 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20">
            <LifeBuoy size={14} /> Help Center
          </div>
          <h1 className="text-3xl md:text-4xl font-black mt-4 leading-tight">
            {firstName ? `Welcome, ${firstName}!` : "Welcome!"} Here&apos;s how everything works.
          </h1>
          <p className="text-blue-50/90 mt-3 text-base md:text-lg">
            New to SMART LABS? These short guides walk you through every page — how to join classes,
            watch recordings, open resources, check your timetable and more.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={startHomeTour}
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-3 rounded-2xl shadow-lg hover:bg-blue-50 active:scale-95 transition-all"
            >
              <Compass size={18} /> Take the interactive tour
            </button>
            <Link
              href="/lms"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur text-white font-bold px-5 py-3 rounded-2xl hover:bg-white/20 transition-all"
            >
              Go to LMS <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search guides… (e.g. recordings, timetable, submit)"
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
        />
      </div>

      {/* Guides */}
      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          No guides match &ldquo;{q}&rdquo;. Try another word.
        </div>
      ) : (
        <div className="space-y-10">
          {categories.map((cat) => (
            <section key={cat} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-brand-blue rounded-full" />
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{cat}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {grouped[cat].map((g) => (
                  <GuideCard key={g.id} guide={g} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Footer help */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-brand-blue flex items-center justify-center">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Still stuck?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Message the support team — the chat bubble is on every page.</p>
          </div>
        </div>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 bg-brand-blue text-white font-bold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-all"
        >
          Contact Support <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const Icon = guide.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-4">
        <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0", guide.gradient)}>
          <Icon size={24} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{guide.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{guide.tagline}</p>
        </div>
      </div>

      <ol className="mt-5 space-y-2.5">
        {guide.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-brand-blue text-[11px] font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      {guide.tip && (
        <div className="mt-4 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
          <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
          <span>{guide.tip}</span>
        </div>
      )}

      <Link
        href={guide.href}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue hover:gap-2.5 transition-all"
      >
        Open {guide.title} <ArrowRight size={16} />
      </Link>
    </motion.div>
  );
}
