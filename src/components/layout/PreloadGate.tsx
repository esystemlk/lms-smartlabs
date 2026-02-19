 "use client";
 
 import { useEffect, useMemo, useRef, useState } from "react";
 import { useRouter } from "next/navigation";
 
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
     <div className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center">
       <div className="w-[92%] max-w-xl rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
         <div className="mb-4 flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
             <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-500" />
           </div>
           <div>
             <div className="text-white font-semibold">Preparing SMART LABS</div>
             <div className="text-xs text-slate-300">Optimizing and caching resources</div>
           </div>
         </div>
 
         <div className="w-full h-3 rounded-full bg-slate-800/60 overflow-hidden">
           <div
             className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all"
             style={{ width: `${progress}%` }}
           />
         </div>
 
         <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
           <span>Preloading interface</span>
           <span>{progress}%</span>
         </div>
 
         <div className="mt-5 text-[11px] text-slate-400">
           This first-time setup takes about 10 seconds and makes navigation smoother.
         </div>
       </div>
     </div>
   );
 }
 
