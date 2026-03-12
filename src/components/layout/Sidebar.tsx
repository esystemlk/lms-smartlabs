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
  Upload
} from "lucide-react";
import { clsx } from "clsx";
import { Transition } from "@headlessui/react";
import { Fragment, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

const navConfig = [
  { href: "/dashboard", label: "Main Menu", icon: LayoutDashboard, section: "General", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/learn", label: "Learn", icon: Play, section: "Learning", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/community", label: "Community", icon: MessageCircle, section: "Learning", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/courses", label: "Courses", icon: BookOpen, section: "Learning", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/websites", label: "Our Websites", icon: Globe, section: "Resources", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/messages", label: "Messages", icon: MessageSquare, section: "Resources", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/lecturers", label: "Lecturers", icon: GraduationCap, section: "Resources", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/activities", label: "Activities", icon: Activity, section: "Learning", roles: ["student", "lecturer", "admin", "superadmin", "developer"] as const },

  { href: "/lms", label: "LMS Portal", icon: Monitor, section: "Management", roles: ["lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/live-classes", label: "Live Manager", icon: Video, section: "Management", roles: ["lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/lms/live", label: "Live Schedule", icon: Calendar, section: "Management", roles: ["lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/lms/recordings", label: "Recordings", icon: Play, section: "Management", roles: ["lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/admin/recordings/upload", label: "Class Rec. Upload", icon: Upload, section: "Management", roles: ["lecturer", "admin", "superadmin", "developer"] as const },
  { href: "/courses/manage", label: "Course Manager", icon: BookOpen, section: "Management", roles: ["lecturer", "admin", "superadmin", "developer"] as const },

  { href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard, section: "Admin", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/admin/users", label: "Users", icon: Users, section: "Admin", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/admin/students", label: "Students", icon: GraduationCap, section: "Admin", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/admin/courses", label: "Manage Courses", icon: BookOpen, section: "Admin", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/admin/resources", label: "Resources", icon: FolderOpen, section: "Admin", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/admin/enrollments", label: "Enrollments", icon: GraduationCap, section: "Admin", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/admin/recorded", label: "Recorded Classes", icon: Play, section: "Admin", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/admin/recorded-packages", label: "Recorded Packages", icon: FolderOpen, section: "Admin", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/admin/analytics", label: "Analytics", icon: Activity, section: "Admin", roles: ["admin", "superadmin", "developer"] as const },
  { href: "/admin/settings", label: "System Settings", icon: Settings, section: "Admin", roles: ["admin", "superadmin", "developer"] as const },

  { href: "/developer", label: "Developer Console", icon: ShieldAlert, section: "Developer", roles: ["developer"] as const },
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
      const items = navConfig.filter(i => ["/courses", "/activities", "/websites", "/community", "/learn"].includes(i.href));
      return [{ label: "Menu", items }];
    }

    const allowed = navConfig.filter(i => i.roles.includes(userData.role as any));
    const grouped: Record<string, typeof allowed> = {};
    for (const item of allowed) {
      if (!grouped[item.section]) grouped[item.section] = [];
      grouped[item.section].push(item);
    }
    const order = ["General", "Learning", "Management", "Admin", "Developer", "Resources"];
    return Object.keys(grouped)
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .map(label => ({ label, items: grouped[label] }));
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
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
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
        <aside className="fixed top-0 left-0 bottom-0 w-72 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl z-50 shadow-2xl flex flex-col md:hidden transition-colors duration-300">
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

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">
                SL
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Smart Labs LMS</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">v1.0.0 (Mobile)</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-600">
                Developed & Powered by <span className="font-bold text-brand-blue">ESystemLK</span>
              </p>
            </div>
          </div>
        </aside>
      </Transition>
    </>
  );
}
