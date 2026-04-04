"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  Download, 
  PlayCircle, 
  Video, 
  Clock, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { courseService } from "@/services/courseService";
import { notificationService, Notification } from "@/services/notificationService";
import { enrollmentService } from "@/services/enrollmentService";
import { Lesson, Enrollment } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

export default function LMSPage() {
  const { userData } = useAuth();
  const [upcomingClasses, setUpcomingClasses] = useState<Lesson[]>([]);
  const [nextClass, setNextClass] = useState<Lesson | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userData) return;

        const [upcoming, notifs, enrollments] = await Promise.all([
          courseService.getUpcomingLiveClasses(),
          notificationService.getRecentNotifications(3),
          userData.role === 'student' ? enrollmentService.getUserEnrollments(userData.uid) : Promise.resolve([] as Enrollment[])
        ]);

        let filtered = upcoming;
        
        // Filter for student's enrolled batches and time slots
        if (userData && userData.role === 'student') {
          const activeEnrollments = enrollments.filter(e => e.status === 'active' || e.status === 'completed');
          const enrollmentBatchIds = activeEnrollments.map(e => e.batchId).filter(Boolean);
          const userDataBatchIds = userData.enrolledBatches || [];
          const userBatches = Array.from(new Set([...enrollmentBatchIds, ...userDataBatchIds])) as string[];
          
          if (userBatches.length === 0) {
            filtered = [];
          } else {
            // Map batchId -> timeSlotId
            const batchTimeSlots = new Map<string, string>();
            activeEnrollments.forEach(e => {
              if (e.batchId && e.timeSlotId) {
                batchTimeSlots.set(e.batchId, e.timeSlotId);
              }
            });

            filtered = upcoming.filter(cls => {
                // Must have batchIds
                if (!cls.batchIds || cls.batchIds.length === 0) return false;

                // Check if student is in any of the batches assigned to this class
                const matchingBatchIds = cls.batchIds.filter(id => userBatches.includes(id));
                if (matchingBatchIds.length === 0) return false;

                // If class has a time slot restriction
                if (cls.timeSlotId) {
                  return matchingBatchIds.some(bid => batchTimeSlots.get(bid) === cls.timeSlotId);
                }

                return true;
            });
          }
        }

        setUpcomingClasses(filtered.slice(0, 3));
        setNextClass(filtered[0] || null);
        setNotifications(notifs);
      } catch (error) {
        console.error("Error fetching LMS data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userData) {
      fetchData();
    }
  }, [userData]);

  const handleJoinClass = (lesson: Lesson) => {
    if (!lesson.zoomJoinUrl) return;
    setJoiningId(lesson.id);
    
    // Open in new tab
    window.open(lesson.zoomJoinUrl, '_blank');
    
    // Reset after delay
    setTimeout(() => setJoiningId(null), 2000);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center animate-pulse">
          <BookOpen className="text-brand-blue" size={32} />
        </div>
        <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
        <div className="h-3 w-64 bg-gray-50 dark:bg-gray-900 rounded-full animate-pulse" />
      </div>
    );
  }

  const Greeting = () => {
    const hour = new Date().getHours();
    let greeting = "Good Morning";
    if (hour >= 12) greeting = "Good Afternoon";
    if (hour >= 17) greeting = "Good Evening";

    return (
      <div className="relative">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
          {greeting}, <br className="md:hidden" />
          <span className="text-brand-blue">{userData?.name?.split(' ')[0] || 'Student'}</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-2">
          <span className="w-8 h-px bg-brand-blue/30" />
          Ready to continue your journey?
        </p>
      </div>
    );
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20 md:pb-12 max-w-7xl mx-auto px-4 md:px-0"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 pt-4">
        <Greeting />
        <div className="flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-5 py-3 rounded-2xl shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-gray-700 w-fit">
          <Calendar size={18} className="text-brand-blue" />
          <span>{format(new Date(), "EEEE, MMM do")}</span>
        </div>
      </motion.div>

      {/* Hero Grid */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Class Hero */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-600 rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl px-4 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                Next Live Session
              </div>

              {nextClass ? (
                <div className="space-y-4">
                  <h3 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">{nextClass.title}</h3>
                  <div className="flex flex-wrap items-center gap-5 text-blue-50/80">
                    <div className="flex items-center gap-2 font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                      <Clock size={16} />
                      <span>{format(new Date(nextClass.startTime!), "h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                      <Calendar size={16} />
                      <span>{format(new Date(nextClass.startTime!), "MMM d")}</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={() => handleJoinClass(nextClass)}
                      disabled={joiningId === nextClass.id}
                      className="bg-white text-blue-700 hover:bg-blue-50 border-none font-black px-8 py-6 h-auto rounded-2xl shadow-2xl shadow-blue-950/20 active:scale-95 transition-all text-lg flex items-center gap-3 disabled:opacity-80"
                    >
                      {joiningId === nextClass.id ? 'Connecting...' : 'Join Classroom'} 
                      {!joiningId && <Video size={20} className="ml-1" />}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-3xl font-black">All Caught Up!</h3>
                  <p className="text-blue-100/80 font-medium max-w-sm">No live sessions scheduled for your batches right now. Time to review your recordings?</p>
                  <div className="pt-4">
                    <Link href="/lms/live">
                      <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl px-6 py-4 rounded-xl font-bold">
                        Full Schedule
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            <div className="hidden md:flex flex-shrink-0 w-48 h-48 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 items-center justify-center rotate-6 group-hover:rotate-12 transition-transform duration-700">
              <PlayCircle className="text-white/40 group-hover:text-white/100 transition-colors" size={80} strokeWidth={1} />
            </div>
          </div>
        </div>

        {/* Quick Access Side */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <Link href="/lms/assignments" className="group h-full">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl shadow-orange-500/5 border border-gray-100 dark:border-gray-700 hover:shadow-orange-500/10 hover:-translate-y-1 transition-all flex flex-col h-full justify-between">
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1">Assignments</p>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">Track Progress</h4>
              </div>
            </div>
          </Link>
          
          <Link href="/lms/my-recordings" className="group h-full">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-xl shadow-pink-500/5 border border-gray-100 dark:border-gray-700 hover:shadow-pink-500/10 hover:-translate-y-1 transition-all flex flex-col h-full justify-between">
              <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                <Video size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest mb-1">Recordings</p>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">Watch Replays</h4>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Main Navigation Grid */}
      <motion.div variants={item} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-brand-blue rounded-full" />
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Learning Hub</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
          {[
            { href: "/lms/live", icon: PlayCircle, label: "Live Classes", sub: "Join sessions", color: "blue" },
            { href: "/lms/my-recordings", icon: Video, label: "Recordings", sub: "View past", color: "pink" },
            { href: "/lms/assignments", icon: FileText, label: "Assignments", sub: "Submit work", color: "orange" },
            { href: "/lms/resources", icon: Download, label: "Resources", sub: "Study materials", color: "purple" },
            { href: "/lms/exams", icon: BookOpen, label: "Exams", sub: "Take tests", color: "red" },
            { href: "/lms/timetable", icon: Calendar, label: "Timetable", sub: "Your schedule", color: "green" },
          ].map((nav, i) => (
            <Link key={i} href={nav.href} className="group">
              <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-[2rem] shadow-xl shadow-blue-500/5 border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:shadow-brand-blue/10 hover:-translate-y-2 transition-all h-full text-center sm:text-left">
                <div className={clsx(
                  "w-12 h-12 mx-auto sm:mx-0 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
                  `bg-${nav.color}-50 dark:bg-${nav.color}-500/10 text-${nav.color}-500`
                )}>
                  <nav.icon size={24} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 text-sm md:text-base">{nav.label}</h3>
                <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 font-medium">{nav.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
      
      {/* Dynamic Content Grid */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Schedule List */}
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-blue-500/5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-gray-900 dark:text-white text-xl">Weekly Schedule</h3>
            <Link href="/lms/live">
              <Button variant="ghost" className="text-brand-blue font-bold rounded-xl text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20">
                Full Calendar
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((cls) => (
                <div key={cls.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-3xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700 group">
                  <div className="flex-shrink-0 w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-brand-blue rounded-2xl flex flex-col items-center justify-center text-center border border-blue-100/50 dark:border-blue-800/50">
                    <span className="text-[10px] font-black uppercase tracking-tighter">{format(new Date(cls.startTime!), "MMM")}</span>
                    <span className="text-xl font-black leading-none">{format(new Date(cls.startTime!), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-blue transition-colors">{cls.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{format(new Date(cls.startTime!), "h:mm a")} • Live Class</p>
                  </div>
                  <Link href="/lms/live">
                    <Button size="icon" variant="ghost" className="rounded-xl w-10 h-10 hover:bg-brand-blue hover:text-white transition-all">
                      <ArrowRight size={18} />
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
               <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Calendar size={32} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No sessions scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Notice Board */}
        <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
           {/* Pattern Overlay */}
           <div className="absolute inset-0 opacity-[0.03]" 
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
           
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/10">
                  <AlertCircle size={24} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight">Notice Board</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Platform Updates</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map((note) => (
                    <div key={note.id} className="bg-white/5 backdrop-blur-md p-5 rounded-[1.75rem] border border-white/10 hover:bg-white/10 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-base text-white group-hover:text-blue-300 transition-colors">{note.title}</h4>
                        <span className="text-[10px] font-black text-gray-500 uppercase">
                          {note.createdAt?.seconds ? formatDistanceToNow(new Date(note.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{note.message}</p>
                      {note.link && (
                        <Link href={note.link} className="flex items-center gap-1.5 text-xs text-brand-blue font-bold mt-4 hover:gap-2 transition-all">
                          Read Full Notice <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="font-medium">All notifications cleared</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
