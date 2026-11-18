"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Transition } from "@headlessui/react";
import { Fragment } from "react";
import { clsx } from "clsx";
import { X, ArrowsLeftRight, DownloadSimple } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { usePteAccess } from "@/lib/pte/client";
import {
  navFor,
  isActiveHref,
  isConsolePath,
  isStaffRole,
  isAdminRole,
  CONSOLE_HOME,
  consoleLabel,
} from "./navConfig";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-2 pb-5">
      <div className="w-10 h-10 rounded-xl bg-white border border-line relative overflow-hidden shrink-0">
        <Image src="/logo.png" alt="" fill className="object-contain p-1" />
      </div>
      <div className="min-w-0">
        <p className="font-display font-bold text-[17px] text-ink dark:text-white leading-tight">SMART LABS</p>
        <p className="text-xs text-ink-muted truncate">{subtitle}</p>
      </div>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || "";
  const tab = useSearchParams()?.get("tab") ?? null;
  const { userData } = useAuth();
  const role = userData?.role;
  const inConsole = isConsolePath(pathname) && isStaffRole(role);
  const pteOk = usePteAccess(userData?.uid);
  const sections = navFor(role, inConsole)
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.pte || pteOk) }))
    .filter((s) => s.items.length > 0);

  return (
    <nav aria-label={inConsole ? "Staff menu" : "Main menu"} className="flex flex-col gap-1">
      {sections.map((section, si) => (
        <div key={section.label ?? si} className="flex flex-col gap-1">
          {section.label && (
            <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const active = isActiveHref(item.href, pathname, tab);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "h-11 px-3 rounded-xl flex items-center gap-3 text-[14.5px] transition-colors",
                  active
                    ? "bg-soft text-[#2338C9] font-semibold dark:bg-blue-500/15 dark:text-blue-200"
                    : "text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Icon size={20} weight={active ? "fill" : "regular"} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Bottom card: staff get a one-tap switch between the student view and their console. */
function SideCard({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() || "";
  const { userData } = useAuth();
  const { isInstallable, promptInstall } = usePWAInstall();
  const role = userData?.role;

  if (isStaffRole(role)) {
    const inConsole = isConsolePath(pathname);
    return (
      <div className="mt-auto rounded-2xl p-4 bg-gradient-to-br from-[#EEF1FF] to-[#FFF1E6] dark:from-slate-800 dark:to-slate-800 flex flex-col gap-2.5">
        <p className="font-display font-bold text-sm text-ink dark:text-white">
          {inConsole ? "Student view" : consoleLabel(role)}
        </p>
        <p className="text-[13px] text-slate-600 dark:text-slate-300">
          {inConsole ? "See the LMS exactly as your students do." : "Manage classes, students and content."}
        </p>
        <Link
          href={inConsole ? "/dashboard" : CONSOLE_HOME}
          onClick={onNavigate}
          className={clsx("sl-btn sl-btn-sm", inConsole ? "sl-btn-outline" : "sl-btn-primary")}
        >
          <ArrowsLeftRight size={16} weight="bold" />
          {inConsole ? "Switch to student view" : `Open ${consoleLabel(role).toLowerCase()}`}
        </Link>
      </div>
    );
  }

  if (!isInstallable) return null;
  return (
    <div className="mt-auto rounded-2xl p-4 bg-gradient-to-br from-[#EEF1FF] to-[#FFF1E6] dark:from-slate-800 dark:to-slate-800 flex flex-col gap-2.5">
      <p className="font-display font-bold text-sm text-ink dark:text-white">Get the app</p>
      <p className="text-[13px] text-slate-600 dark:text-slate-300">Install Smart Labs on your phone for class reminders.</p>
      <button type="button" onClick={() => promptInstall()} className="sl-btn sl-btn-sm sl-btn-primary">
        <DownloadSimple size={16} weight="bold" /> Install app
      </button>
    </div>
  );
}

function subtitleFor(role: string | undefined, pathname: string) {
  if (isConsolePath(pathname) && isStaffRole(role)) return isAdminRole(role) ? "Admin console" : "Lecturer console";
  return role === "student" || !role ? "Student" : "Student view";
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname() || "";
  const { userData } = useAuth();
  const subtitle = subtitleFor(userData?.role, pathname);

  return (
    <>
      {/* Desktop: always-visible sidebar */}
      <aside className="hidden lg:flex flex-col w-[264px] shrink-0 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-line dark:border-slate-800 px-4 py-5 overflow-y-auto no-scrollbar">
        <Brand subtitle={subtitle} />
        <NavList />
        <div className="pt-6 mt-auto flex flex-col">
          <SideCard />
        </div>
      </aside>

      {/* Phone / tablet: slide-in drawer (opened from the bottom bar "More" button or header menu) */}
      <Transition as={Fragment} show={isOpen}>
        <div className="lg:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50 z-[90]" onClick={onClose} aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition ease-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in duration-200 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <aside className="fixed top-0 left-0 bottom-0 w-[86vw] max-w-[320px] bg-white dark:bg-slate-900 z-[100] shadow-2xl flex flex-col px-4 pt-5 pb-safe overflow-y-auto">
              <div className="flex items-start justify-between">
                <Brand subtitle={subtitle} />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="w-11 h-11 -mr-1 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={22} />
                </button>
              </div>
              <NavList onNavigate={onClose} />
              <div className="py-6 mt-auto flex flex-col">
                <SideCard onNavigate={onClose} />
              </div>
            </aside>
          </Transition.Child>
        </div>
      </Transition>
    </>
  );
}
