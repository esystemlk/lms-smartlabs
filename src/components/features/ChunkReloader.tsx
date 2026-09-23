"use client";

import { useEffect } from "react";

/**
 * After a new deploy, a client still running the previous build (or served a
 * stale HTML shell by the service worker) references old hashed chunk files
 * that no longer exist → 404 / "failed to load chunk" / bad MIME type. This
 * listener catches those errors and reloads once (guarded against loops) so the
 * user transparently picks up the fresh build instead of a broken page.
 */
export function ChunkReloader() {
  useEffect(() => {
    const KEY = "sl_chunk_reload_at";

    const reloadOnce = () => {
      try {
        const last = Number(sessionStorage.getItem(KEY) || 0);
        if (Date.now() - last < 15000) return; // don't loop
        sessionStorage.setItem(KEY, String(Date.now()));
      } catch {
        /* private mode — still attempt a single reload */
      }
      window.location.reload();
    };

    const isChunkError = (msg?: string) =>
      !!msg &&
      /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module|import\(\) failed|because its MIME type/i.test(
        msg
      );

    const onError = (e: Event) => {
      // Resource load failures (a 404'd <script>/<link> chunk from an old build)
      // fire a plain Event on the element with no message — detect via target.
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "SCRIPT" || target.tagName === "LINK")) {
        const url = (target as any).src || (target as any).href || "";
        if (/_next\/static\//.test(url)) {
          reloadOnce();
          return;
        }
      }
      const err = e as ErrorEvent;
      const msg = err?.message || (err?.error && (err.error as any).message) || "";
      if (isChunkError(msg)) reloadOnce();
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason: any = e?.reason;
      const msg = (reason && (reason.message || reason.name)) || String(reason || "");
      if (isChunkError(msg)) reloadOnce();
    };

    // When a new service worker takes control, the app shell may be stale.
    let swReloaded = false;
    const onControllerChange = () => {
      if (swReloaded) return;
      swReloaded = true;
      reloadOnce();
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    try {
      navigator.serviceWorker?.addEventListener?.("controllerchange", onControllerChange);
    } catch {
      /* SW not available */
    }

    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
      try {
        navigator.serviceWorker?.removeEventListener?.("controllerchange", onControllerChange);
      } catch {
        /* ignore */
      }
    };
  }, []);

  return null;
}
