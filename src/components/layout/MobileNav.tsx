"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Play, MessageCircle, Menu, BookOpen } from "lucide-react";
import { clsx } from "clsx";

interface MobileNavProps {
  onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/learn", label: "Learn", icon: Play },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/community", label: "Community", icon: MessageCircle },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 min-w-[64px] transition-colors",
                isActive 
                  ? "text-brand-blue" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <div className={clsx(
                "p-1 rounded-xl transition-all",
                isActive && "bg-brand-blue/10"
              )}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Menu Trigger */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center gap-1 min-w-[64px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <div className="p-1 rounded-xl">
            <Menu size={24} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
}
