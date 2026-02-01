"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, BookOpen, DollarSign, Activity, 
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Plus, Search, Bell, Calendar, GraduationCap,
  Settings, MessageSquare, Shield, Clock,
  ChevronRight, PlayCircle
} from "lucide-react";
import { userService } from "@/services/userService";
import { courseService } from "@/services/courseService";
import { UserData, Course } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

export function AdminDashboard() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, coursesData] = await Promise.all([
        userService.getAllUsers(),
        courseService.getAllCourses()
      ]);
      setUsers(usersData);
      setCourses(coursesData);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Derived Stats
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalLecturers = users.filter(u => u.role === 'lecturer').length;
  const activeCourses = courses.filter(c => c.published).length;
  const recentUsers = users.slice(0, 5);
  const recentCourses = courses.slice(0, 4);

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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, {userData?.name?.split(' ')[0] || 'Admin'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-4 h-4 text-brand-blue" />
            {format(new Date(), "MMMM d, yyyy")}
          </div>
          <Link href="/admin/settings">
            <Button variant="outline" className="rounded-full w-10 h-10 p-0">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        <StatCard 
          title="Total Students" 
          value={totalStudents} 
          icon={GraduationCap} 
          trend="+12%" 
          trendUp={true}
          color="blue"
          loading={loading}
        />
        <StatCard 
          title="Active Courses" 
          value={activeCourses} 
          icon={BookOpen} 
          trend="+4" 
          trendUp={true}
          color="emerald"
          loading={loading}
        />
        <StatCard 
          title="Total Staff" 
          value={totalLecturers} 
          icon={Users} 
          trend="Stable" 
          trendUp={true}
          color="purple"
          loading={loading}
        />
        <StatCard 
          title="System Status" 
          value="98%" 
          label="Uptime"
          icon={Activity} 
          trend="Good" 
          trendUp={true}
          color="orange"
          loading={loading}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Content (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Activity / Users */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Registrations</h2>
              <Link href="/admin/users" className="text-sm font-medium text-brand-blue hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map((i) => <SkeletonRow key={i} />)
              ) : (
                recentUsers.map((user) => (
                  <div key={user.uid} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden font-bold text-gray-500 dark:text-gray-400 text-sm">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 
                          user.role === 'lecturer' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                        {user.role}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {user.createdAt ? format(user.createdAt.toDate(), 'MMM d') : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-1">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickAction href="/admin/users" icon={Users} label="Add User" color="bg-blue-500" />
              <QuickAction href="/admin/courses" icon={BookOpen} label="New Course" color="bg-emerald-500" />
              <QuickAction href="/admin/support" icon={MessageSquare} label="Support" color="bg-purple-500" />
              <QuickAction href="/admin/settings" icon={Settings} label="Settings" color="bg-gray-600" />
            </div>
          </motion.div>

        </div>

        {/* Sidebar (Right Col) */}
        <div className="space-y-6">
          
          {/* Latest Courses */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Latest Courses</h2>
              <Link href="/admin/courses" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <ArrowUpRight className="w-4 h-4 text-gray-500" />
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                 <div className="space-y-4">
                   {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
                 </div>
              ) : (
                recentCourses.map((course) => (
                  <div key={course.id} className="group flex gap-3 items-start p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                      {course.image ? (
                        <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-brand-blue transition-colors">
                        {course.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${course.published ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        {course.published ? 'Published' : 'Draft'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* System Health / Developer */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-xl">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold">System Status</h3>
                <p className="text-xs text-gray-400">All systems operational</p>
              </div>
            </div>
            
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Server Load</span>
                <span className="font-mono text-emerald-400">12%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[12%]" />
              </div>
              
              <div className="flex items-center justify-between text-sm mt-4">
                <span className="text-gray-400">Memory Usage</span>
                <span className="font-mono text-blue-400">45%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[45%]" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
               <Link href="/developer" className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                 Open Developer Console
               </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, label, icon: Icon, trend, trendUp, color, loading }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={item} className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1
            ${trendUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        {loading ? (
          <div className="h-8 w-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse mt-1" />
        ) : (
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {label && <span className="text-sm font-medium text-gray-400 ml-1">{label}</span>}
          </h3>
        )}
      </div>
    </motion.div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: any) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-brand-blue transition-colors">{label}</span>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-3">
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 w-1/4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
}
