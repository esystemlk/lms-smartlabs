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
import { Lesson } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";

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
        const [upcoming, notifs] = await Promise.all([
          courseService.getUpcomingLiveClasses(),
          notificationService.getRecentNotifications(3)
        ]);

        let filtered = upcoming;
        
        // Filter for student's enrolled batches
        if (userData && userData.role === 'student') {
          const userBatches = userData.enrolledBatches || [];
          if (userBatches.length > 0) {
            filtered = filtered.filter(cls => {
                return !cls.batchIds || cls.batchIds.length === 0 || cls.batchIds.some(id => userBatches.includes(id));
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

  const Greeting = () => {
    const hour = new Date().getHours();
    let greeting = "Good Morning";
    if (hour >= 12) greeting = "Good Afternoon";
    if (hour >= 17) greeting = "Good Evening";

    return (
      <div className="mb-2">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          {greeting}, <span className="text-brand-blue">{userData?.name?.split(' ')[0] || 'Student'}</span>
        </h1>
        <p className="text-gray-500 mt-1">Ready to continue your learning journey?</p>
      </div>
    );
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <Greeting />
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          <Calendar size={16} className="text-brand-blue" />
          <span>{format(new Date(), "EEEE, MMMM do, yyyy")}</span>
        </div>
      </motion.div>

      {/* Stats / Hero Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next Class Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                UPCOMING
              </div>
              <PlayCircle className="opacity-50 group-hover:opacity-100 transition-opacity" size={32} />
            </div>

            {upcomingClasses.length > 0 ? (
              <div>
                <h3 className="text-2xl font-bold mb-2">{upcomingClasses[0].title}</h3>
                <div className="flex items-center gap-4 text-blue-100 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{format(new Date(upcomingClasses[0].startTime!), "h:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{format(new Date(upcomingClasses[0].startTime!), "MMM d")}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => handleJoinClass(upcomingClasses[0])}
                  disabled={joiningId === upcomingClasses[0].id}
                  className="bg-white text-blue-600 hover:bg-blue-50 border-none font-semibold disabled:opacity-75"
                >
                  {joiningId === upcomingClasses[0].id ? 'Joining...' : 'Join Class Now'} 
                  {!joiningId && <ArrowRight size={16} className="ml-2" />}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col justify-center h-full pb-4">
                <h3 className="text-2xl font-bold mb-2">No Upcoming Classes</h3>
                <p className="text-blue-100 mb-6">You're all caught up! Check back later for new sessions.</p>
                <Link href="/lms/live">
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                    View Schedule
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                <FileText size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Assignments</p>
                <Link href="/lms/assignments" className="text-2xl font-bold text-gray-900 hover:text-brand-blue transition-colors">
                  Check Status
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
             <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
                <Video size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Recordings</p>
                <Link href="/lms/my-recordings" className="text-sm text-pink-600 font-medium hover:underline">
                  View Library
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Navigation Grid */}
      <motion.div variants={item}>
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <BookOpen className="text-brand-blue" size={24} />
          Learning Hub
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Link href="/lms/live" className="group">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                <PlayCircle size={28} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Live Classes</h3>
              <p className="text-xs text-gray-500">Join sessions</p>
            </div>
          </Link>

          <Link href="/lms/my-recordings" className="group">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition-transform">
                <Video size={28} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Recordings</h3>
              <p className="text-xs text-gray-500">Watch past classes</p>
            </div>
          </Link>

          <Link href="/lms/assignments" className="group">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                <FileText size={28} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Assignments</h3>
              <p className="text-xs text-gray-500">Submit work</p>
            </div>
          </Link>

          <Link href="/lms/resources" className="group">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                <Download size={28} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Resources</h3>
              <p className="text-xs text-gray-500">Study materials</p>
            </div>
          </Link>
           
           <Link href="/lms/exams" className="group">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-4 group-hover:scale-110 transition-transform">
                <BookOpen size={28} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Exams</h3>
              <p className="text-xs text-gray-500">Take tests</p>
            </div>
          </Link>

          <Link href="/lms/timetable" className="group">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all h-full">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                <Calendar size={28} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Timetable</h3>
              <p className="text-xs text-gray-500">View schedule</p>
            </div>
          </Link>
        </div>
      </motion.div>
      
      {/* Upcoming Schedule List */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Upcoming Schedule</h3>
            <Link href="/lms/live" className="text-sm text-brand-blue font-medium hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((cls, idx) => (
                <div key={cls.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex-shrink-0 w-14 h-14 bg-blue-100 text-brand-blue rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold uppercase">{format(new Date(cls.startTime!), "MMM")}</span>
                    <span className="text-lg font-bold leading-none">{format(new Date(cls.startTime!), "d")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{cls.title}</h4>
                    <p className="text-sm text-gray-500">{format(new Date(cls.startTime!), "h:mm a")} • Live Class</p>
                  </div>
                  <Link href={`/lms/live/room/${cls.courseId}/${cls.id}`}>
                    <Button size="sm" variant="ghost" className="rounded-full w-8 h-8 p-0">
                      <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
               <div className="text-center py-8 text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>No upcoming classes scheduled</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
               <AlertCircle size={20} className="text-yellow-400" />
             </div>
             <div>
               <h3 className="font-bold text-lg">Notice Board</h3>
               <p className="text-gray-400 text-sm">Important updates</p>
             </div>
           </div>
           
           <div className="space-y-4">
             {notifications.length > 0 ? (
               notifications.map((note) => (
                 <div key={note.id} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                   <h4 className="font-medium mb-1 text-white">{note.title}</h4>
                   <p className="text-sm text-gray-400">{note.message}</p>
                   {note.link && (
                     <Link href={note.link} className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block">
                       View Details →
                     </Link>
                   )}
                   <span className="text-xs text-gray-500 mt-2 block">
                     {note.createdAt?.seconds ? formatDistanceToNow(new Date(note.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                   </span>
                 </div>
               ))
             ) : (
               <div className="text-center py-8 text-gray-500">
                 <p>No new announcements</p>
               </div>
             )}
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
