"use client";

import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Bell,
  Palette,
  ChevronRight
} from "lucide-react";
import { clsx } from "clsx";

export default function SettingsMenuPage() {
  const router = useRouter();

  const menuItems = [
    {
      id: "general",
      label: "General Settings",
      description: "Personal details, contact info, bio",
      icon: User,
      href: "/settings/general",
      color: "bg-blue-500 text-white"
    },
    {
      id: "security",
      label: "Security",
      description: "Password, account protection",
      icon: Shield,
      href: "/settings/security",
      color: "bg-emerald-500 text-white"
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Email alerts, push notifications",
      icon: Bell,
      href: "/settings/notifications",
      color: "bg-orange-500 text-white"
    },
    {
      id: "appearance",
      label: "Appearance",
      description: "Theme, dark mode, layout",
      icon: Palette,
      href: "/settings/appearance",
      color: "bg-purple-500 text-white"
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-4 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account preferences</p>
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