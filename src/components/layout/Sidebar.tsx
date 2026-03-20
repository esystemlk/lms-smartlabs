"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  GraduationCap,
  Users,
  Settings,
  Activity,
  Globe,
  BookOpen,
  Video,
  Play,
  MessageSquare,
  MessageCircle,
  Calendar,
  FolderOpen,
  ShieldAlert,
  Upload,
  CreditCard,
  LayoutGrid
} from "lucide-react";
import { clsx } from "clsx";
import { Transition } from "@headlessui/react";
import { Fragment, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

const navConfig = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "General", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/lms", label: "LMS Dashboard", icon: LayoutGrid, section: "General", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },

  { href: "/learn", label: "My Learning", icon: Play, section: "Student", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/courses", label: "Browse Courses", icon: BookOpen, section: "Student", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/lms/live", label: "Join Live Classes", icon: Video, section: "Student", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },

  { href: "/live-classes", label: "Schedule Classes", icon: Calendar, section: "Management", roles: ["lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/management?tab=courses", label: "My Courses", icon: BookOpen, section: "Management", roles: ["lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/management?tab=recordings", label: "Recorded Classes", icon: Video, section: "Management", roles: ["lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/management", label: "Management Portal", icon: Monitor, section: "Management", roles: ["lecturer", "admin", "superadmin", "developer"] as const },

  { href: "/management?tab=users", label: "User Management", icon: Users, section: "Administration", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/management?tab=students", label: "Student Management", icon: GraduationCap, section: "Administration", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/management?tab=enrollments", label: "Enrollments & Payments", icon: CreditCard, section: "Administration", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/management?tab=attendance", label: "Attendance Records", icon: Activity, section: "Administration", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/management?tab=settings", label: "System Settings", icon: Settings, section: "Administration", roles: ["admin", "superadmin", "developer"] as const },

  { href: "/community", label: "Community", icon: MessageCircle, section: "Interaction", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/messages", label: "Messages", icon: MessageSquare, section: "Interaction", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },

  { href: "/websites", label: "Our Websites", icon: Globe, section: "Resources", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/lecturers", label: "Lecturers", icon: GraduationCap, section: "Resources", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/activities", label: "Activities", icon: Activity, section: "Resources", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },

  { href: "/developer", label: "Developer Tools", icon: ShieldAlert, section: "Developer", roles: ["admin", "superadmin", "developer"] as const },
] as const;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userData } = useAuth();

  const sections = useMemo(() => {
    if (!userData) return [];

    const isNewStudent = userData.role === 'student' && (!userData.enrolledBatches || userData.enrolledBatches.length === 0);

    if (isNewStudent) {
      const items = navConfig.filter(i => ["/lms", "/courses", "/activities", "/websites", "/community", "/learn"].includes(i.href));
      return [{ label: "Menu", items }];
    }

    const allowed = navConfig.filter(i => i.roles.includes(userData.role as any));
    const grouped: Record<string, typeof allowed> = {};
    for (const item of allowed) {
      if (!grouped[item.section]) grouped[item.section] = [];
      grouped[item.section].push(item);
    }
    const order = ["General", "Student", "Management", "Administration", "Interaction", "Resources", "Developer"];
    return Object.keys(grouped)
      .sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
      })
      .map(label => ({ label, items: grouped[label as keyof typeof grouped] }));
  }, [userData]);

  return (
    <>
      {/* Mobile Overlay */}
      <Transition
        as={Fragment}
        show={isOpen}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="fixed inset-0 bg-black/50 z-[90] md:hidden"
          onClick={onClose}
        />
      </Transition>

      {/* Sidebar Drawer */}
      <Transition
        as={Fragment}
        show={isOpen}
        enter="transition ease-in-out duration-300 transform"
        enterFrom="-translate-x-full"
        enterTo="translate-x-0"
        leave="transition ease-in-out duration-300 transform"
        leaveFrom="translate-x-0"
        leaveTo="-translate-x-full"
      >
        <aside className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-[100] shadow-2xl flex flex-col md:hidden transition-colors duration-300 pb-safe">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 relative">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">SMART LABS</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar">
            {sections.map((section) => (
              <div key={section.label} className="space-y-2">
                <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon as any;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-brand-blue text-white shadow-md shadow-blue-200 dark:shadow-blue-900/20"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-brand-blue dark:hover:text-brand-blue"
                      )}
                    >
                      <Icon size={20} className={clsx(isActive ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-brand-blue")} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="p-3 md:p-4 border-t border-border mt-auto">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="w-7 h-7 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-[10px]">
                SL
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">Smart Labs LMS</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">v1.1.0 (Mobile Optimized)</p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <p className="text-[9px] text-gray-400 dark:text-gray-600">
                Developed & Powered by <span className="font-bold text-brand-blue">ESystemLK</span>
              </p>
            </div>
          </div>
        </aside>
      </Transition>
    </>
  );
}
