"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Play,
  MessageCircle,
  Menu,
  BookOpen,
  Monitor,
  Video
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";

interface MobileNavProps {
  onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
  const pathname = usePathname();
  const { userData } = useAuth();

  const getNavItems = () => {
    const base = [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    ];

    if (!userData) return base;

    const role = userData.role || 'student';

    if (role === 'student') {
      return [
        ...base,
        { href: "/learn", label: "Learn", icon: Play },
        { href: "/courses", label: "Courses", icon: BookOpen },
        { href: "/lms/live", label: "Live", icon: Video },
      ];
    }

    if (role === 'lecturer') {
      return [
        ...base,
        { href: "/management", label: "Manage", icon: Monitor },
        { href: "/live-classes", label: "Schedule", icon: Video },
        { href: "/management?tab=recordings", label: "Recorded", icon: Play },
      ];
    }

    if (['admin', 'superadmin', 'developer'].includes(role)) {
      return [
        ...base,
        { href: "/management", label: "Portal", icon: Monitor },
        { href: "/live-classes", label: "Classes", icon: Video },
        { href: "/management?tab=enrollments", label: "Payments", icon: BookOpen },
      ];
    }

    return base;
  };

  const navItems = getNavItems();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-50 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 min-w-[64px] transition-all duration-300",
                isActive
                  ? "text-brand-blue scale-110"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <div className={clsx(
                "p-1.5 rounded-xl transition-all",
                isActive && "bg-brand-blue/10"
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={clsx(
                "text-[10px] font-bold transition-all",
                isActive ? "opacity-100" : "opacity-70"
              )}>{item.label}</span>
            </Link>
          );
        })}

        {/* Menu Trigger */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center gap-1 min-w-[64px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <div className="p-1.5 rounded-xl">
            <Menu size={22} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold opacity-70">Menu</span>
        </button>
      </div>
    </div>
  );
}
