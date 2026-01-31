"use client";

import { X, Share, PlusSquare } from "lucide-react";
import { useEffect, useState } from "react";

interface InstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'ios' | 'android' | 'desktop' | null;
}

export function InstallPrompt({ isOpen, onClose, platform }: InstallPromptProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  // If it's Android/Desktop, the browser handles the UI via promptInstall()
  // But we might want to show instructions if prompt fails or is not supported
  // For now, this component primarily targets iOS or fallback instructions
  
  if (platform !== 'ios') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-6 relative animate-in slide-in-from-bottom-10">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col gap-4">
          <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg overflow-hidden border border-gray-100">
            <img src="/logo.png" alt="SMART LABS Logo" className="h-full w-full object-contain" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Install App</h3>
            <p className="text-sm text-gray-500 mt-1">
              Install this application on your home screen for a better experience.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 mt-2">
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="flex items-center justify-center h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0">
                <Share size={16} />
              </span>
              <span>Tap the <span className="font-bold">Share</span> button in the navigation bar.</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="flex items-center justify-center h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0">
                <PlusSquare size={16} />
              </span>
              <span>Scroll down and select <span className="font-bold">Add to Home Screen</span>.</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-brand-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
        
        {/* Pointer arrow for iOS bottom bar */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-900 rotate-45 sm:hidden"></div>
      </div>
    </div>
  );
}
