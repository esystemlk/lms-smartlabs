"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usageService } from "@/services/usageService";

/**
 * Invisible component that measures how long a student is actively using the
 * LMS and periodically flushes it to `user_usage/{uid}`.
 *
 * "Active" means the tab is visible AND focused, so background/idle tabs are
 * not counted. Flushes every 30s and again whenever the tab is hidden or the
 * page is being unloaded, so time is not lost on navigation/close.
 *
 * Admin-only metric — rendered for students only so staff activity does not
 * inflate the numbers.
 */
export function UsageTracker() {
  const { userData } = useAuth();
  const pendingRef = useRef(0);

  const isStudent = userData?.role === "student";

  useEffect(() => {
    if (!isStudent || !userData?.uid) return;

    const uid = userData.uid;
    const profile = { name: userData.name, email: userData.email };

    const isActive = () =>
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      document.hasFocus();

    // Count one second of activity each tick when the user is actually here.
    const tick = window.setInterval(() => {
      if (isActive()) pendingRef.current += 1;
    }, 1000);

    const flush = () => {
      const secs = pendingRef.current;
      if (secs <= 0) return;
      pendingRef.current = 0;
      usageService.addLmsTime(uid, secs, profile);
    };

    // Regular flush so long sessions are recorded incrementally.
    const flushInterval = window.setInterval(flush, 30000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(flushInterval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [isStudent, userData?.uid, userData?.name, userData?.email]);

  return null;
}
