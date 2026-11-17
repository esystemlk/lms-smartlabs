"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ArrowLeft, ShieldCheck, ChalkboardTeacher } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { isAdminRole, isConsolePath, isStaffRole, CONSOLE_HOME, consoleLabel } from "./navConfig";

/**
 * Staff (lecturers + admins) land on the student dashboard after login.
 * This bar sits at the very top of every page and gives them a one-tap
 * switch to their own dashboard, and back again.
 */
export function StaffBar() {
  const pathname = usePathname() || "";
  const { userData } = useAuth();
  const role = userData?.role;
  if (!isStaffRole(role)) return null;

  const inConsole = isConsolePath(pathname);
  const RoleIcon = isAdminRole(role) ? ShieldCheck : ChalkboardTeacher;
  const label = consoleLabel(role);

  return (
    <div className="bg-gradient-to-r from-[#2D47E8] to-[#3B5BFD] text-white">
      <div className="max-w-7xl mx-auto px-3 md:px-8 h-12 flex items-center gap-3">
        <RoleIcon size={20} weight="fill" className="shrink-0 opacity-90" />
        <p className="text-[13px] md:text-sm font-medium truncate flex-1 min-w-0">
          {inConsole ? (
            <>You&apos;re in the <b>{label}</b></>
          ) : (
            <>
              <span className="hidden sm:inline">You&apos;re viewing the student dashboard as </span>
              <b className="capitalize">{role}</b>
            </>
          )}
        </p>
        <Link
          href={inConsole ? "/dashboard" : CONSOLE_HOME}
          className="sl-btn sl-btn-sm sl-btn-white shrink-0 !h-9"
        >
          {inConsole ? (
            <>
              <ArrowLeft size={16} weight="bold" /> Student view
            </>
          ) : (
            <>
              Open {label} <ArrowRight size={16} weight="bold" />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}
