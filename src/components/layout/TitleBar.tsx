"use client";

import { useState, useEffect } from "react";
import { Minus, Square, X } from "lucide-react";

export function TitleBar() {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron by looking for the exposed API
    if (typeof window !== "undefined" && (window as any).electron) {
      setIsElectron(true);
    }
  }, []);

  if (!isElectron) return null;

  const handleMinimize = () => {
    (window as any).electron.window.minimize();
  };

  const handleMaximize = () => {
    (window as any).electron.window.maximize();
  };

  const handleClose = () => {
    (window as any).electron.window.close();
  };

  return (
    <>
      <div className="h-8 bg-card border-b border-border flex items-center justify-between select-none fixed top-0 left-0 right-0 z-[100] transition-colors duration-300">
        {/* Draggable Area */}
        <div 
          className="flex-1 h-full flex items-center px-4"
          style={{ WebkitAppRegion: "drag" } as any}
        >
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium tracking-wide">SMART LABS LMS</span>
        </div>

        {/* Window Controls (Non-draggable) */}
        <div 
          className="flex h-full"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          <button 
            onClick={handleMinimize}
            className="w-12 h-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none"
          >
            <Minus size={14} />
          </button>
          <button 
            onClick={handleMaximize}
            className="w-12 h-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors focus:outline-none"
          >
            <Square size={12} />
          </button>
          <button 
            onClick={handleClose}
            className="w-12 h-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-red-600 hover:text-white transition-colors focus:outline-none"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      {/* Spacer to prevent content overlap */}
      <div className="h-8" />
    </>
  );
}