 "use client";
 
 import { useEffect, useMemo, useRef, useState } from "react";
 import { useRouter } from "next/navigation";
import { LetterRing } from "@/components/ui/LetterRing";
 
 export default function PreloadGate() {
   const router = useRouter();
   const [active, setActive] = useState(false);
   const [progress, setProgress] = useState(0);
   const timerRef = useRef<number | null>(null);
 
   const routesToPrefetch = useMemo(
     () => [
       "/dashboard",
       "/courses",
       "/courses/manage",
       "/profile",
       "/settings/security",
       "/lms/live",
       "/lms/recordings",
     ],
     []
   );
 
   const assetsToWarm = useMemo(
     () => [
       "/logo.png",
       "/lg.png",
       "/globe.svg",
       "/window.svg",
       "/file.svg",
     ],
     []
   );
 
   useEffect(() => {
     try {
       const done = sessionStorage.getItem("preload_done");
       if (done === "1") {
         return;
       }
     } catch {}
 
     setActive(true);
 
     routesToPrefetch.forEach((route) => {
       try {
         router.prefetch(route);
         // Warm runtime cache via fetch to enable PWA caching
         fetch(route, { method: "GET", cache: "no-store" }).catch(() => {});
       } catch {}
     });
 
     assetsToWarm.forEach((src) => {
       try {
         const img = new Image();
         img.src = src;
       } catch {}
     });
 
     const start = performance.now();
     const durationMs = 10_000;
 
     const tick = () => {
       const now = performance.now();
       const elapsed = now - start;
       const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
       setProgress(pct);
 
       if (pct < 100) {
         timerRef.current = window.setTimeout(tick, 80);
       } else {
         try {
           sessionStorage.setItem("preload_done", "1");
         } catch {}
         setTimeout(() => setActive(false), 150);
       }
     };
 
     timerRef.current = window.setTimeout(tick, 80);
 
     return () => {
       if (timerRef.current) {
         clearTimeout(timerRef.current);
       }
     };
   }, [router, routesToPrefetch, assetsToWarm]);
 
   if (!active) return null;

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[1000] bg-background flex flex-col items-center justify-center gap-7 px-4 text-center">
      <LetterRing size={184} />
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <p className="font-display text-lg md:text-xl font-bold text-ink">Preparing SMART LABS</p>
        <div className="w-full h-2 rounded-full bg-[#E6E9F2] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#3B5BFD] to-[#FF7A1A] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[13px] text-ink-muted">First visit only · {progress}%</p>
      </div>
    </div>
  );
}
