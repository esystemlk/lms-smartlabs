"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GreetingWidget } from "@/components/features/GreetingWidget";
import { LearningStats } from "@/components/features/LearningStats";
import { UpcomingSchedule } from "@/components/features/UpcomingSchedule";
import { notificationService, Notification } from "@/services/notificationService";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { enrollmentService } from "@/services/enrollmentService";
import { Enrollment } from "@/lib/types";
import { 
  BookOpen, 
  Globe, 
  ShieldCheck, 
  Users, 
  Edit, 
  Activity, 
  BarChart2, 
  Video,
  GraduationCap,
  Bell,
  ChevronRight,
  ExternalLink,
  Zap,
  ArrowRight,
  Search,
  LayoutGrid,
  Layers,
  PlayCircle,
  Clock,
  FolderOpen
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export default function DashboardPage() {
  const { userData } = useAuth();
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [lastEnrolled, setLastEnrolled] = useState<Enrollment | null>(null);
  const [loadingEnrollment, setLoadingEnrollment] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await notificationService.getRecentNotifications(1);
        if (notifs.length > 0) {
          setLatestNotification(notifs[0]);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };
    fetchNotifs();
  }, []);

  useEffect(() => {
    const fetchLastEnrollment = async () => {
      if (!userData) return;
      try {
        const enrollments = await enrollmentService.getUserEnrollments(userData.uid);
        const active = enrollments.filter(e => e.status === 'active');
        if (active.length > 0) {
          // Sort by lastAccessed or enrolledAt
          active.sort((a, b) => {
             const timeA = a.lastAccessed?.seconds || a.enrolledAt?.seconds || 0;
             const timeB = b.lastAccessed?.seconds || b.enrolledAt?.seconds || 0;
             return timeB - timeA;
          });
          setLastEnrolled(active[0]);
        }
      } catch (error) {
        console.error("Failed to fetch enrollments", error);
      } finally {
        setLoadingEnrollment(false);
      }
    };
    fetchLastEnrollment();
  }, [userData]);

  const menuItems = [
    {
      title: "LMS Portal",
      description: "Access classes, assignments & recordings",
      icon: GraduationCap,
      href: "/lms",
      gradient: "from-blue-500 to-blue-600",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"],
      category: "Learning Hub"
    },
    {
      title: "Learn",
      description: "Recorded lessons & subscriptions",
      icon: PlayCircle,
      href: "/learn",
      gradient: "from-violet-600 to-indigo-600",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"],
      category: "Learning Hub"
    },
    {
      title: "Community",
      description: "Chat with students & instructors",
      icon: Users,
      href: "/community",
      gradient: "from-pink-500 to-rose-600",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"],
      category: "Learning Hub"
    },
    {
      title: "Live Classes",
      description: "Join or manage Zoom sessions",
      icon: Video,
      href: "/live-classes",
      gradient: "from-violet-500 to-purple-600",
      roles: ["lecturer", "admin", "superadmin", "developer"],
      category: "Learning Hub"
    },
    {
      title: "My Courses",
      description: "Your learning materials & progress",
      icon: BookOpen,
      href: "/courses",
      gradient: "from-emerald-500 to-teal-600",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"],
      category: "Learning Hub"
    },
    {
      title: "Activities",
      description: "Quizzes & interactive tasks",
      icon: Activity,
      href: "/activities",
      gradient: "from-pink-500 to-rose-500",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"],
      category: "Learning Hub"
    },
    {
      title: "Admin Console",
      description: "System management & user controls",
      icon: ShieldCheck,
      href: "/admin",
      gradient: "from-red-500 to-rose-600",
      roles: ["admin", "superadmin", "developer"],
      category: "Management"
    },
    {
      title: "Course Manager",
      description: "Create and edit course content",
      icon: Edit,
      href: "/courses/manage",
      gradient: "from-cyan-500 to-blue-600",
      roles: ["lecturer", "admin", "superadmin", "developer"],
      category: "Management"
    },
    {
      title: "Resource Manager",
      description: "Manage course study materials",
      icon: FolderOpen,
      href: "/admin/resources",
      gradient: "from-orange-500 to-amber-600",
      roles: ["lecturer", "admin", "superadmin", "developer"],
      category: "Management"
    },
    {
      title: "Our Websites",
      description: "Explore our educational network",
      icon: Globe,
      href: "/websites",
      gradient: "from-indigo-500 to-blue-600",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"],
      category: "Resources"
    },
    {
      title: "Lecturers",
      description: "View profiles and schedules",
      icon: Users,
      href: "/lecturers",
      gradient: "from-amber-500 to-orange-600",
      roles: ["student", "lecturer", "admin", "superadmin", "developer"],
      category: "Resources"
    },
    {
      title: "System Status",
      description: "Analytics & performance monitoring",
      icon: BarChart2,
      href: "/admin/analytics",
      gradient: "from-slate-700 to-slate-800",
      roles: ["admin", "superadmin", "developer"],
      category: "System"
    }
  ];

  const filteredItems = menuItems.filter(item => {
    // Role check
    if (userData?.role && !item.roles.includes(userData.role)) {
      return false;
    }
    return true;
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);
  
  // Sort categories order
  const categoryOrder = ["Learning Hub", "Management", "Resources", "System"];
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 pb-24">
      {/* Top Section: Greeting & Notification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GreetingWidget />
          
          {latestNotification && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card border-l-4 border-brand-blue rounded-r-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start gap-3 w-full sm:w-auto flex-1 min-w-0">
                <div className="p-2 md:p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-full text-brand-blue flex-shrink-0 mt-1 sm:mt-0">
                  <Bell size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                      New Update
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {latestNotification.createdAt?.seconds ? new Date(latestNotification.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base truncate">{latestNotification.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mt-0.5 break-words">{latestNotification.message}</p>
                </div>
              </div>
              
              <Link href="/lms" className="self-end sm:self-center w-full sm:w-auto">
                <Button variant="ghost" size="sm" className="text-brand-blue hover:bg-blue-50 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
                  View <ChevronRight size={16} className="ml-1" />
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Continue Learning Widget */}
          {lastEnrolled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden group"
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-700">
                <GraduationCap size={180} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-4">
                  <Clock size={16} />
                  <span>Continue Learning</span>
                </div>

                <h3 className="text-2xl font-bold mb-2 pr-10">{lastEnrolled.courseTitle}</h3>
                <p className="text-gray-400 mb-6">{lastEnrolled.batchName}</p>

                {/* Progress Bar (Mocked/Real) */}
                <div className="space-y-2 mb-6 max-w-md">
                  <div className="flex justify-between text-xs font-medium text-gray-400">
                    <span>Progress</span>
                    <span>{lastEnrolled.progress || 15}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-blue rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${lastEnrolled.progress || 15}%` }}
                    />
                  </div>
                </div>

                <Link href={`/courses/${lastEnrolled.courseId}`}>
                  <Button className="bg-white text-gray-900 hover:bg-gray-100 border-0 rounded-xl px-6 py-2 h-auto font-bold shadow-lg shadow-gray-900/20">
                    <PlayCircle size={18} className="mr-2 text-brand-blue" />
                    Resume Course
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Upcoming Schedule (New) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
             <UpcomingSchedule userData={userData} />
          </motion.div>
        </div>

        {/* Learning Stats Widget (Replaces Quick Stats) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="h-full"
        >
          <LearningStats userData={userData} />
        </motion.div>
      </div>

          {/* Main Content Area */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <LayoutGrid size={24} className="text-brand-blue" />
            Quick Access
          </h2>
        </div>

        {/* Content Grid */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-12"
            >
              {sortedCategories.map((category) => (
                <div key={category} className="space-y-5">
                  <div className="flex items-center gap-4">
                     <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-1 h-6 bg-brand-blue rounded-full"></span>
                      {category}
                    </h3>
                    <div className="h-px bg-gray-100 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                    {groupedItems[category].map((menu, idx) => (
                      <motion.div key={idx} variants={item}>
                        <Link href={menu.href} className="block h-full group">
                          <div className="h-full glass-card rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden border-0 group-hover:ring-1 group-hover:ring-white/20">
                            {/* Hover Gradient Overlay */}
                            <div className={clsx(
                              "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br",
                              menu.gradient
                            )} />
                            
                            {/* Top Pattern Circle */}
                            <div className={clsx(
                              "absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-5 group-hover:opacity-20 transition-all duration-500 bg-gradient-to-br transform group-hover:scale-150",
                              menu.gradient
                            )} />
                            
                            <div className="flex flex-col h-full justify-between relative z-10">
                              <div className="space-y-3 md:space-y-5">
                                <div className="flex justify-between items-start">
                                  <div className={clsx(
                                    "w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 bg-gradient-to-br",
                                    menu.gradient
                                  )}>
                                    <menu.icon className="w-5 h-5 md:w-7 md:h-7" strokeWidth={1.5} />
                                  </div>
                                  
                                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-gray-400 group-hover:bg-brand-blue group-hover:text-white transition-all duration-300 transform group-hover:rotate-[-45deg]">
                                    <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-xl mb-1 md:mb-2 group-hover:text-brand-blue dark:group-hover:text-blue-300 transition-colors">
                                    {menu.title}
                                  </h3>
                                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-300 font-medium leading-relaxed line-clamp-2 hidden sm:block">
                                    {menu.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
