"use client";

import { useEffect, useRef } from "react";
import { usageService } from "@/services/usageService";

interface WatchTrackerArgs {
  /** The iframe element playing the Bunny video. */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  /** Stable id for the recording being watched (used as the breakdown key). */
  recordingId: string | null | undefined;
  /** Human-readable title stored alongside the id for admin display. */
  title?: string;
  /** The viewer. Tracking is a no-op without a uid. */
  user?: { uid?: string; name?: string; email?: string } | null;
}

/**
 * Measures real watch time for a Bunny video embed and flushes it to
 * `user_usage/{uid}` (total + per-recording), keyed by `recordingId`.
 *
 * Uses Bunny's player.js adapter to detect play/pause so only genuine viewing
 * is counted; if the player never reports state it falls back to counting while
 * the tab is visible and the video is open. Flushes every 30s and on
 * pause/close/tab-hide/unload so nothing is lost.
 */
export function useWatchTracker({ iframeRef, recordingId, title, user }: WatchTrackerArgs) {
  const isPlayingRef = useRef(false);
  const eventsWorkingRef = useRef(false);
  const pendingRef = useRef(0);
  const recordingIdRef = useRef<string | null | undefined>(recordingId);
  const titleRef = useRef<string | undefined>(title);
  const playerRef = useRef<any>(null);
  const userRef = useRef(user);

  recordingIdRef.current = recordingId;
  titleRef.current = title;
  userRef.current = user;

  // Load Bunny's player.js adapter once.
  useEffect(() => {
    if (typeof window === "undefined" || (window as any).playerjs) return;
    const script = document.createElement("script");
    script.src = "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const flush = () => {
    const secs = pendingRef.current;
    const id = recordingIdRef.current;
    const uid = userRef.current?.uid;
    if (secs <= 0 || !uid) {
      pendingRef.current = 0;
      return;
    }
    pendingRef.current = 0;
    usageService.addWatchTime(
      uid,
      secs,
      id || undefined,
      { name: userRef.current?.name, email: userRef.current?.email },
      titleRef.current
    );
  };

  // Attach play/pause listeners each time the active recording changes.
  useEffect(() => {
    isPlayingRef.current = false;
    if (!recordingId) return;

    let cancelled = false;
    const attach = () => {
      const playerjs = (window as any).playerjs;
      if (!playerjs || !iframeRef.current) return;
      try {
        const player = new playerjs.Player(iframeRef.current);
        player.on("ready", () => {
          if (cancelled) return;
          player.on("play", () => { eventsWorkingRef.current = true; isPlayingRef.current = true; });
          player.on("pause", () => { eventsWorkingRef.current = true; isPlayingRef.current = false; flush(); });
          player.on("ended", () => { eventsWorkingRef.current = true; isPlayingRef.current = false; flush(); });
        });
        playerRef.current = player;
      } catch {
        /* fall back to visibility-based counting */
      }
    };

    const t = setTimeout(attach, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
      flush(); // attribute pending seconds to the recording we're leaving
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingId]);

  // 1s ticker + periodic flush + lifecycle flushes.
  useEffect(() => {
    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible" || !recordingIdRef.current) return;
      const counting = eventsWorkingRef.current ? isPlayingRef.current : true;
      if (counting) pendingRef.current += 1;
    }, 1000);

    const flushInterval = window.setInterval(flush, 30000);
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
