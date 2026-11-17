"use client";

import { clsx } from "clsx";
import { LetterRing } from "./LetterRing";

interface SuperLoaderProps {
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

export function SuperLoader({ fullScreen = true, text = "Loading...", className }: SuperLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        "flex flex-col items-center justify-center gap-7 bg-background text-foreground z-50 overflow-hidden px-4 text-center",
        fullScreen ? "fixed inset-0" : "w-full h-full min-h-[300px]",
        className
      )}
    >
      <LetterRing size={fullScreen ? 184 : 140} />
      <p className="font-display text-lg md:text-xl font-bold text-ink dark:text-white">{text}</p>
    </div>
  );
}
