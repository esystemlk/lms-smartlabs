"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, AlertTriangle, CheckCircle2, Info, X, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";
import { notificationService, Notification, NotificationPriority } from "@/services/notificationService";

const STORAGE_KEY = "sl_dismissed_announcements";

const PRIORITY_STYLES: Record<NotificationPriority, {
  wrap: string;
  icon: React.ElementType;
  iconWrap: string;
}> = {
  info: {
    wrap: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-100",
    icon: Info,
    iconWrap: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
  },
  success: {
    wrap: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-100",
    icon: CheckCircle2,
    iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  warning: {
    wrap: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-100",
    icon: Megaphone,
    iconWrap: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
  },
  critical: {
    wrap: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-100",
    icon: AlertTriangle,
    iconWrap: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300",
  },
};

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Shows multiple active, role-targeted announcements as dismissible banners.
 * Dismissals are remembered per-device via localStorage so a student is not
 * nagged by the same notice on every page load.
 */
export function AnnouncementBanners() {
  const { userData } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await notificationService.getActiveAnnouncements(userData?.role);
        if (!cancelled) setItems(data);
      } catch {
        // Fail silently — banners are non-critical.
      }
    };
    if (userData) load();
    return () => {
      cancelled = true;
    };
  }, [userData]);

  const dismiss = (id: string) => {
    const next = Array.from(new Set([...dismissed, id]));
    setDismissed(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  };

  const visible = items.filter((n) => !dismissed.includes(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-2 space-y-2">
      <AnimatePresence initial={false}>
        {visible.map((note) => {
          const priority: NotificationPriority = note.priority || "info";
          const style = PRIORITY_STYLES[priority];
          const Icon = style.icon;
          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className={clsx(
                "flex items-start gap-3 rounded-2xl border p-3 md:p-4 shadow-sm",
                style.wrap
              )}
            >
              <div className={clsx("p-2 rounded-xl flex-shrink-0", style.iconWrap)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm md:text-base leading-tight">{note.title}</p>
                <p className="text-sm opacity-90 mt-0.5 break-words">{note.message}</p>
                {note.link && (
                  <Link
                    href={note.link}
                    className="inline-flex items-center gap-1 text-xs font-bold mt-2 hover:gap-2 transition-all underline underline-offset-2"
                  >
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              <button
                onClick={() => dismiss(note.id)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                aria-label="Dismiss announcement"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
