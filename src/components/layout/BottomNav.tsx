"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, FileText, Award, User, Activity, Globe, Settings } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useMemo } from "react";

const allNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/exams", label: "Exams", icon: FileText },
  { href: "/badges", label: "Badges", icon: Award },
  { href: "/activities", label: "Activities", icon: Activity },
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/system", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { userData } = useAuth();

  const navItems = useMemo(() => {
    if (!userData) return [];

    const isNewStudent = userData.role === 'student' && (!userData.enrolledBatches || userData.enrolledBatches.length === 0);

    if (isNewStudent) {
      // New users: Courses, Activities, Websites, Settings, Profile
      // Limit to 5 items for BottomNav space
      return [
        { href: "/courses", label: "Courses", icon: BookOpen },
        { href: "/activities", label: "Activities", icon: Activity },
        { href: "/websites", label: "Web", icon: Globe },
        { href: "/system", label: "Settings", icon: Settings },
        { href: "/profile", label: "Profile", icon: User },
      ];
    }

    // Regular users: Home, Courses, Exams, Badges, Profile
    return [
      { href: "/dashboard", label: "Home", icon: LayoutDashboard },
      { href: "/courses", label: "Courses", icon: BookOpen },
      { href: "/exams", label: "Exams", icon: FileText },
      { href: "/badges", label: "Badges", icon: Award },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }, [userData]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300">
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-brand-blue" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <div className={clsx(
                "p-1.5 rounded-xl transition-all",
                isActive && "bg-blue-50 dark:bg-blue-900/20"
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
