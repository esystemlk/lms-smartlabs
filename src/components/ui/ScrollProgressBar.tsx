"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgressBar() {
    const pathname = usePathname();
    // Only show on course/lesson pages or long content pages if desired
    const isContentPage = pathname.includes("/courses/") || pathname.includes("/learn/");

    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    if (!isContentPage) return null;

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue to-purple-600 origin-left z-50"
            style={{ scaleX }}
        />
    );
}
