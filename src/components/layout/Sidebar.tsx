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
  BookOpen
} from "lucide-react";
import { clsx } from "clsx";
import { Transition } from "@headlessui/react";
import { Fragment, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

// Updated items to match the Dashboard Main Menu
const allNavItems = [
  { href: "/dashboard", label: "Main Menu", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/websites", label: "Our Websites", icon: Globe },
  { href: "/lms", label: "LMS Admin", icon: Monitor },
  { href: "/lecturers", label: "Lecturers", icon: GraduationCap },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/system", label: "System Details", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userData } = useAuth();

  const navItems = useMemo(() => {
    if (!userData) return [];

    // Check if user is a student and has NO enrolled batches
    const isNewStudent = userData.role === 'student' && (!userData.enrolledBatches || userData.enrolledBatches.length === 0);

    if (isNewStudent) {
      // New users only see: Courses, Activities, Websites, System Details
      return allNavItems.filter(item => 
        ["/courses", "/activities", "/websites", "/system"].includes(item.href)
      );
    }

    // Existing users see everything (or role based filtering can be added here)
    return allNavItems;
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
        <aside className="fixed top-0 left-0 bottom-0 w-72 bg-card z-50 shadow-2xl flex flex-col md:hidden transition-colors duration-300">
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

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
            <p className="px-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
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
          </div>
        </aside>
      </Transition>
    </>
  );
}
