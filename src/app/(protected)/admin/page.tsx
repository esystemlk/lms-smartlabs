"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  BookOpen,
  Settings,
  Loader2,
  CreditCard,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { clsx } from "clsx";

export default function AdminPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && userData) {
      const allowedRoles = ["admin", "superadmin", "developer"];
      if (!allowedRoles.includes(userData.role)) {
        router.push("/dashboard");
      }
    }
  }, [userData, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!userData) return null;

  const menuItems = [
    {
      id: "overview",
      label: "Overview",
      description: "System overview and quick stats",
      icon: LayoutDashboard,
      href: "/admin/overview",
      color: "bg-blue-500 text-white"
    },
    {
      id: "enrollments",
      label: "Enrollments",
      description: "Manage student enrollments and payments",
      icon: CreditCard,
      href: "/admin/enrollments",
      color: "bg-emerald-500 text-white"
    },
    {
      id: "users",
      label: "User Management",
      description: "Manage students, lecturers, and admins",
      icon: Users,
      href: "/admin/users",
      color: "bg-purple-500 text-white"
    },
    {
      id: "courses",
      label: "Courses",
      description: "Create and edit courses and lessons",
      icon: BookOpen,
      href: "/admin/courses",
      color: "bg-orange-500 text-white"
    },
    {
      id: "analytics",
      label: "Analytics",
      description: "Detailed system reports and trends",
      icon: BarChart2,
      href: "/admin/analytics",
      color: "bg-pink-500 text-white"
    },
    {
      id: "support",
      label: "Support Chat",
      description: "Live chat and support tickets",
      icon: MessageSquare,
      href: "/admin/support",
      color: "bg-teal-500 text-white"
    },
    {
      id: "settings",
      label: "System Settings",
      description: "Global configurations and preferences",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-600 text-white"
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-4 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">LMS Administrator</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage all aspects of the learning management system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-4 p-4 md:p-6 bg-card rounded-2xl shadow-sm border border-border hover:border-brand-blue/30 hover:shadow-md transition-all group text-left"
            >
              <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", item.color)}>
                <Icon size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base md:text-lg text-foreground mb-1 group-hover:text-brand-blue transition-colors">
                  {item.label}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {item.description}
                </p>
              </div>

              <ChevronRight size={20} className="text-gray-400 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
