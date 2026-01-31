"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { 
  LayoutDashboard, 
  Users, 
  BarChart2, 
  BookOpen,
  Settings, 
  Loader2,
  ShieldAlert,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { userService } from "@/services/userService";
import { courseService } from "@/services/courseService";
import { UserData, Course } from "@/lib/types";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { CoursesTab } from "@/components/admin/CoursesTab";
import { EnrollmentsTab } from "@/components/admin/EnrollmentsTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { SupportTab } from "@/components/admin/SupportTab";
import Link from "next/link";

export default function AdminPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<UserData[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && userData) {
      const allowedRoles = ["admin", "superadmin", "developer"];
      if (!allowedRoles.includes(userData.role)) {
        router.push("/dashboard");
      }
    }
  }, [userData, authLoading, router]);

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

  useEffect(() => {
    if (userData) {
      fetchData();
    }
  }, [userData]);

  if (authLoading || (loading && !users.length)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!userData) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "enrollments", label: "Enrollments", icon: CreditCard },
    { id: "users", label: "Users", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
    { id: "support", label: "Support Chat", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage your school, enrollments, and content.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/courses/manage/new">
            <Button>
              <BookOpen className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-1 px-1 min-w-full sm:min-w-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <OverviewTab users={users} courses={courses} loading={loading} />
        )}
        
        {activeTab === "enrollments" && (
          <EnrollmentsTab />
        )}

        {activeTab === "users" && (
          <UsersTab users={users} onUserUpdated={fetchData} />
        )}

        {activeTab === "courses" && (
          <CoursesTab courses={courses} onCourseUpdated={fetchData} />
        )}
        
        {activeTab === "analytics" && (
          <AnalyticsTab users={users} courses={courses} />
        )}

        {activeTab === "support" && (
          <SupportTab />
        )}

        {activeTab === "settings" && (
          <SettingsTab />
        )}
      </div>
    </div>
  );
}
