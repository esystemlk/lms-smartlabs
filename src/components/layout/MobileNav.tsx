"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/context/AuthContext";
import { bottomNavFor, isActiveHref, isConsolePath, isStaffRole, MORE_ICON as More } from "./navConfig";

interface MobileNavProps {
  onMenuClick: () => void;
}

/** Floating bottom bar for phones and tablets. The middle item is a raised button. */
export function MobileNav({ onMenuClick }: MobileNavProps) {
  const pathname = usePathname() || "";
  const tab = useSearchParams()?.get("tab") ?? null;
  const { userData } = useAuth();
  const inConsole = isConsolePath(pathname) && isStaffRole(userData?.role);
  const items = bottomNavFor(userData?.role, inConsole);

  const renderItem = (item: (typeof items)[number], center = false) => {
    const active = isActiveHref(item.href, pathname, tab);
    const Icon = item.icon;
    if (center) {
      return (
        <Link key={item.href} href={item.href} aria-label={item.label} className="flex flex-col items-center justify-center gap-1">
          <span
            className={clsx(
              "w-[52px] h-[52px] -mt-7 rounded-[18px] flex items-center justify-center text-white shadow-[0_10px_22px_rgba(59,91,253,.4)] bg-gradient-to-br from-[#3B5BFD] to-[#FF7A1A] transition-transform active:scale-95",
              active && "ring-4 ring-soft"
            )}
          >
            <Icon size={24} weight="fill" />
          </span>
          <span className={clsx("text-[11px] font-semibold", active ? "text-primary" : "text-ink-muted")}>{item.label}</span>
        </Link>
      );
    }
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "flex flex-col items-center justify-center gap-1 min-w-0 text-[11px] font-semibold",
          active ? "text-primary" : "text-ink-muted"
        )}
      >
        <span className={clsx("px-3.5 py-1 rounded-full transition-colors", active && "bg-soft dark:bg-blue-500/15")}>
          <Icon size={22} weight={active ? "fill" : "regular"} />
        </span>
        <span className="truncate max-w-full px-0.5">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Quick menu"
      className="lg:hidden fixed left-3 right-3 bottom-3 z-50 h-[68px] grid grid-cols-5 rounded-[22px] border border-line dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-[0_12px_30px_rgba(15,23,42,.14)] mb-[env(safe-area-inset-bottom)]"
    >
      {renderItem(items[0])}
      {renderItem(items[1])}
      {renderItem(items[2], true)}
      {renderItem(items[3])}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-ink-muted"
      >
        <span className="px-3.5 py-1 rounded-full">
          <More size={22} />
        </span>
        More
      </button>
    </nav>
  );
}
