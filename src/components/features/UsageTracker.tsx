"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usageService } from "@/services/usageService";

/**
 * Invisible component that measures how long a signed-in user is actively using
 * the LMS and periodically flushes it to `user_usage/{uid}`.
 *
 * "Active" = the tab is visible. (We intentionally do NOT require
 * document.hasFocus(), because focus moves into the video iframe while watching
 * and would otherwise stop the counter.) Flushes every 30s and again whenever
 * the tab is hidden or the page is unloaded, so time isn't lost on navigation.
 *
 * Tracked for every role so it can be verified with any account; the admin UI
 * only surfaces it for students.
 */
export function UsageTracker() {
  const { userData } = useAuth();
  const pendingRef = useRef(0);

  const uid = userData?.uid;

  useEffect(() => {
    if (!uid) return;

    const profile = { name: userData?.name, email: userData?.email };

    const isActive = () =>
      typeof document !== "undefined" &&
      document.visibilityState === "visible";

    // Count one second of activity each tick when the tab is in the foreground.
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
  }, [uid, userData?.name, userData?.email]);

  return null;
}
