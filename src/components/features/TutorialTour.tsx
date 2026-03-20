"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTutorial } from "@/context/TutorialContext";
import { Button } from "@/components/ui/Button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

export const TutorialTour: React.FC = () => {
  const { isTutorialOpen, currentStepIndex, steps, nextStep, prevStep, closeTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isTutorialOpen || !steps[currentStepIndex]) return;

    const updatePosition = () => {
      const target = document.querySelector(steps[currentStepIndex].target);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
        // Scroll into view if needed
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isTutorialOpen, currentStepIndex, steps]);

  if (!mounted || !isTutorialOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];

  // Overlay hole path (SVG mask)
  const overlayPath = targetRect 
    ? `M 0 0 h ${window.innerWidth} v ${window.innerHeight} h -${window.innerWidth} z 
       M ${targetRect.left - 8} ${targetRect.top - 8} 
       h ${targetRect.width + 16} 
       v ${targetRect.height + 16} 
       h -${targetRect.width + 16} 
       z`
    : `M 0 0 h ${window.innerWidth} v ${window.innerHeight} h -${window.innerWidth} z`;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* Dark Overlay with Cutout */}
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
        <rect 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          fill="rgba(0,0,0,0.65)" 
          mask="url(#tutorial-mask)" 
          className="transition-all duration-300"
        />
      </svg>

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        {targetRect && (
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              left: targetRect.left + (targetRect.width / 2),
              top: targetRect.bottom + 20
            }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-50 pointer-events-auto w-72 md:w-80 -translate-x-1/2"
            style={{ 
                // Ensure tooltip doesn't go off screen
                transform: 'translateX(-50%)'
            }}
          >
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
            
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 relative">
              <button 
                onClick={closeTutorial}
                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                aria-label="Skip Tutorial"
              >
                <X size={16} />
              </button>

              <div className="mb-4">
                <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-1 block">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{currentStep.title}</h3>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                {currentStep.content}
              </p>

              <div className="flex items-center justify-between gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                  className="text-gray-500"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Back
                </Button>
                
                <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentStepIndex ? "bg-brand-blue w-4" : "bg-gray-200"}`} 
                        />
                    ))}
                </div>

                <Button 
                  size="sm" 
                  onClick={nextStep}
                  className="bg-brand-blue hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                >
                  {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};
