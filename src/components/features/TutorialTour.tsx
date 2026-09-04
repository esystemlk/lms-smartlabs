"use client";

import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useTutorial } from "@/context/TutorialContext";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const MARGIN = 12; // viewport padding

export const TutorialTour: React.FC = () => {
  const { isTutorialOpen, currentStepIndex, steps, nextStep, prevStep, closeTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [cardH, setCardH] = useState(220);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setVp({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  useEffect(() => {
    if (!isTutorialOpen || !steps[currentStepIndex]) return;

    const updatePosition = () => {
      setVp({ w: window.innerWidth, h: window.innerHeight });
      const target = document.querySelector(steps[currentStepIndex].target);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        // Read the rect after the scroll request; a rAF keeps it in sync.
        requestAnimationFrame(() => setTargetRect(target.getBoundingClientRect()));
        setTargetRect(target.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isTutorialOpen, currentStepIndex, steps]);

  // Measure the actual card height so we can flip it above/below correctly.
  useLayoutEffect(() => {
    if (cardRef.current) {
      setCardH(cardRef.current.offsetHeight);
    }
  }, [currentStepIndex, targetRect, isTutorialOpen]);

  if (!mounted || !isTutorialOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isMobile = vp.w > 0 && vp.w < 640;

  // ---- Compute tooltip geometry ----
  const tipW = isMobile ? Math.max(0, vp.w - MARGIN * 2) : 350;
  const maxCardH = Math.max(160, vp.h - MARGIN * 2);

  let cardStyle: React.CSSProperties = {};
  let arrow: { left: number; onTop: boolean } | null = null;

  if (targetRect) {
    if (isMobile) {
      // Dock as a sheet on the opposite half of the screen from the target,
      // so the highlighted element stays visible.
      const targetInBottomHalf = targetRect.top + targetRect.height / 2 > vp.h / 2;
      cardStyle = targetInBottomHalf
        ? { left: MARGIN, top: MARGIN, width: tipW }
        : { left: MARGIN, bottom: MARGIN, width: tipW };
    } else {
      const targetCenterX = targetRect.left + targetRect.width / 2;
      let left = targetCenterX - tipW / 2;
      left = Math.max(MARGIN, Math.min(left, vp.w - MARGIN - tipW));

      const spaceBelow = vp.h - targetRect.bottom;
      const placeBelow = spaceBelow >= cardH + 24 || spaceBelow >= targetRect.top;

      let top = placeBelow ? targetRect.bottom + 16 : targetRect.top - cardH - 16;
      top = Math.max(MARGIN, Math.min(top, vp.h - MARGIN - cardH));

      cardStyle = { left, top, width: tipW };
      arrow = { left: Math.max(20, Math.min(targetCenterX - left, tipW - 20)), onTop: placeBelow };
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tutorial-mask)" />
      </svg>

      {/* Tooltip card */}
      {targetRect && (
        <motion.div
          key={currentStepIndex}
          ref={cardRef}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="absolute z-50 pointer-events-auto"
          style={{ ...cardStyle, maxHeight: maxCardH }}
        >
          {/* Arrow (desktop only) */}
          {arrow && (
            <div
              className={`absolute w-3.5 h-3.5 bg-white border-gray-100 rotate-45 ${
                arrow.onTop ? "-top-1.5 border-l border-t" : "-bottom-1.5 border-r border-b"
              }`}
              style={{ left: arrow.left - 7 }}
            />
          )}

          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 relative flex flex-col overflow-hidden"
            style={{ maxHeight: maxCardH }}
          >
            <button
              onClick={closeTutorial}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors z-10"
              aria-label="Skip tutorial"
            >
              <X size={16} />
            </button>

            {/* Scrollable content */}
            <div className="p-5 md:p-6 overflow-y-auto">
              <div className="mb-3 pr-6">
                <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-1 block">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
                <h3 className="text-base md:text-lg font-bold text-gray-900">{currentStep.title}</h3>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">{currentStep.content}</p>

              {currentStep.list && currentStep.list.length > 0 && (
                <ol className="space-y-2 mt-3">
                  {currentStep.list.map((li, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-brand-blue text-[11px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{li}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Footer (fixed within card) */}
            <div className="flex items-center justify-between gap-2 px-5 md:px-6 py-3 border-t border-gray-100 bg-white">
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-1 text-sm font-semibold text-gray-500 disabled:opacity-40 hover:text-gray-700 transition-colors px-2 py-1.5 rounded-lg"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <div className="hidden sm:flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStepIndex ? "bg-brand-blue w-4" : "bg-gray-200 w-1.5"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextStep}
                className="flex items-center gap-1 text-sm font-bold text-white bg-brand-blue hover:bg-blue-600 shadow-lg shadow-blue-500/20 px-4 py-2 rounded-xl transition-colors"
              >
                {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>,
    document.body
  );
};
