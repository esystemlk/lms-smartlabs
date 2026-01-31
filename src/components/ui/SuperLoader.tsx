"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Rocket, Brain, Sparkles, Zap, BookOpen } from "lucide-react";

interface SuperLoaderProps {
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

const TIPS = [
  "Did you know? Regular practice is the key to mastering any language.",
  "Tip: Try using the voice navigation feature to practice your pronunciation.",
  "Fact: Smart Labs uses AI to personalize your learning experience.",
  "Reminder: Take short breaks to keep your mind fresh and focused.",
  "Quote: 'The roots of education are bitter, but the fruit is sweet.' - Aristotle",
  "Tip: Check your dashboard daily for new assignments and progress updates.",
  "Did you know? You can earn badges for completing courses and streaks.",
];

const ICONS = [Rocket, Brain, Sparkles, Zap, BookOpen];

export function SuperLoader({ fullScreen = true, text = "Loading...", className }: SuperLoaderProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [Icon, setIcon] = useState(() => ICONS[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
      setIcon(() => ICONS[Math.floor(Math.random() * ICONS.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const containerClasses = clsx(
    "flex flex-col items-center justify-center bg-background text-foreground z-50 overflow-hidden",
    fullScreen ? "fixed inset-0" : "w-full h-full min-h-[300px]",
    className
  );

  return (
    <div className={containerClasses}>
      {/* Background Animated Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-brand-blue rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, -60, 0],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md px-4 text-center">
        
        {/* Animated Icon */}
        <div className="relative">
          <motion.div
            className="absolute inset-0 bg-brand-blue/30 blur-xl rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            key={Icon.name} // Remount to trigger animation on icon change
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="relative bg-card p-6 rounded-2xl shadow-xl border border-border"
          >
            <Icon size={48} className="text-brand-blue" />
          </motion.div>
        </div>

        {/* Loading Bar & Text */}
        <div className="w-full space-y-4">
          <motion.h2
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl font-bold bg-gradient-to-r from-brand-blue to-purple-600 bg-clip-text text-transparent"
          >
            {text}
          </motion.h2>

          <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-blue rounded-full"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Cycling Tips */}
        <div className="h-16 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-sm text-gray-500 dark:text-gray-400 font-medium"
            >
              {TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
