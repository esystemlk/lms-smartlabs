"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AccessibilityState {
  textSize: number; // 0 = default, 1 = large, 2 = extra large
  lineHeight: number; // 0 = default, 1 = large, 2 = extra large
  letterSpacing: number; // 0 = default, 1 = wide, 2 = extra wide
  wordSpacing: number; // 0 = default, 1 = wide, 2 = extra wide
  contrast: 'normal' | 'high-dark' | 'high-light' | 'invert' | 'grayscale' | 'yellow-on-black' | 'sepia';
  saturation: number; // 1 = normal, 0 = grayscale, 2 = high
  cursor: 'default' | 'big-black' | 'big-white' | 'big-yellow';
  readingGuide: boolean;
  readingMask: boolean;
  dyslexiaFont: boolean;
  readableFont: boolean; // Arial/Verdana
  textAlign: 'initial' | 'left' | 'center' | 'right' | 'justify';
  highlightLinks: boolean;
  highlightTitles: boolean;
  highlightHover: boolean;
  highlightFocus: boolean;
  showBorders: boolean;
  hideImages: boolean;
  stopAnimations: boolean;
}

interface AccessibilityContextType {
  state: AccessibilityState;
  updateState: (key: keyof AccessibilityState, value: any) => void;
  reset: () => void;
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

const defaultState: AccessibilityState = {
  textSize: 0,
  lineHeight: 0,
  letterSpacing: 0,
  wordSpacing: 0,
  contrast: 'normal',
  saturation: 1,
  cursor: 'default',
  readingGuide: false,
  readingMask: false,
  dyslexiaFont: false,
  readableFont: false,
  textAlign: 'initial',
  highlightLinks: false,
  highlightTitles: false,
  highlightHover: false,
  highlightFocus: false,
  showBorders: false,
  hideImages: false,
  stopAnimations: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccessibilityState>(defaultState);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("accessibility-settings");
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse accessibility settings", e);
      }
    }
  }, []);

  // Save to localStorage on change and apply styles
  useEffect(() => {
    localStorage.setItem("accessibility-settings", JSON.stringify(state));
    applyAccessibilityStyles(state);
  }, [state]);

  const updateState = (key: keyof AccessibilityState, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setState(defaultState);
  };

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  return (
    <AccessibilityContext.Provider value={{ state, updateState, reset, isMenuOpen, toggleMenu }}>
      {children}
      {state.readingGuide && <ReadingGuide />}
      {state.readingMask && <ReadingMask />}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}

// Helper to apply styles to <html> or <body>
function applyAccessibilityStyles(state: AccessibilityState) {
  const html = document.documentElement;
  
  // Reset
  html.classList.remove('a11y-font-large', 'a11y-font-xl');
  html.classList.remove('a11y-lh-large', 'a11y-lh-xl');
  html.classList.remove('a11y-spacing-wide', 'a11y-spacing-xl');
  html.classList.remove('a11y-word-spacing-wide', 'a11y-word-spacing-xl');
  html.classList.remove(
    'a11y-contrast-high-dark', 
    'a11y-contrast-high-light', 
    'a11y-invert', 
    'a11y-grayscale',
    'a11y-yellow-on-black',
    'a11y-sepia'
  );
  html.classList.remove('a11y-cursor-big-black', 'a11y-cursor-big-white', 'a11y-cursor-big-yellow');
  html.classList.remove('a11y-dyslexia', 'a11y-readable');
  html.classList.remove('a11y-align-left', 'a11y-align-center', 'a11y-align-right', 'a11y-align-justify');
  html.classList.remove('a11y-highlight-links', 'a11y-highlight-titles', 'a11y-highlight-hover', 'a11y-highlight-focus');
  html.classList.remove('a11y-show-borders');
  html.classList.remove('a11y-hide-images', 'a11y-stop-animations');
  html.style.filter = '';

  // Apply classes based on state
  if (state.textSize === 1) html.classList.add('a11y-font-large');
  if (state.textSize === 2) html.classList.add('a11y-font-xl');

  if (state.lineHeight === 1) html.classList.add('a11y-lh-large');
  if (state.lineHeight === 2) html.classList.add('a11y-lh-xl');

  if (state.letterSpacing === 1) html.classList.add('a11y-spacing-wide');
  if (state.letterSpacing === 2) html.classList.add('a11y-spacing-xl');

  if (state.wordSpacing === 1) html.classList.add('a11y-word-spacing-wide');
  if (state.wordSpacing === 2) html.classList.add('a11y-word-spacing-xl');

  if (state.contrast !== 'normal') html.classList.add(`a11y-${state.contrast}`);
  
  if (state.cursor !== 'default') html.classList.add(`a11y-cursor-${state.cursor}`);
  
  if (state.dyslexiaFont) html.classList.add('a11y-dyslexia');
  if (state.readableFont) html.classList.add('a11y-readable');
  
  if (state.textAlign !== 'initial') html.classList.add(`a11y-align-${state.textAlign}`);
  if (state.highlightLinks) html.classList.add('a11y-highlight-links');
  if (state.highlightTitles) html.classList.add('a11y-highlight-titles');
  if (state.highlightHover) html.classList.add('a11y-highlight-hover');
  if (state.highlightFocus) html.classList.add('a11y-highlight-focus');
  if (state.showBorders) html.classList.add('a11y-show-borders');
  if (state.hideImages) html.classList.add('a11y-hide-images');
  if (state.stopAnimations) html.classList.add('a11y-stop-animations');

  // Saturation filter
  if (state.saturation !== 1) {
    html.style.filter = `saturate(${state.saturation})`;
  }
}

// Components for Reading Guide and Mask
function ReadingGuide() {
  const [top, setTop] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTop(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      className="fixed left-0 right-0 h-8 bg-yellow-400/30 border-t-2 border-b-2 border-yellow-500 pointer-events-none z-[9999]"
      style={{ top: top - 16 }}
    />
  );
}

function ReadingMask() {
  const [top, setTop] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTop(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div 
        className="fixed top-0 left-0 right-0 bg-black/70 pointer-events-none z-[9999]"
        style={{ height: Math.max(0, top - 50) }}
      />
      <div 
        className="fixed bottom-0 left-0 right-0 bg-black/70 pointer-events-none z-[9999]"
        style={{ top: top + 50 }}
      />
    </>
  );
}
