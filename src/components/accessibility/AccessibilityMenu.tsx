"use client";

import { useState } from "react";
import { useAccessibility } from "@/context/AccessibilityContext";
import { 
  Accessibility, 
  X, 
  Type, 
  MoveVertical, 
  MoveHorizontal, 
  AlignLeft, 
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon, 
  Heading, 
  MousePointer2, 
  MousePointerClick,
  Minus, 
  ScanLine, 
  Target,
  BoxSelect,
  Contrast, 
  Sun, 
  EyeOff, 
  RefreshCcw, 
  ImageOff, 
  PauseCircle, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Palette,
  Coffee
} from "lucide-react";
import { clsx } from "clsx";

export function AccessibilityMenu() {
  const { state, updateState, reset, isMenuOpen, toggleMenu } = useAccessibility();

  const options = [
    // Text Adjustments
    {
      label: "Text Larger",
      icon: ZoomIn,
      active: state.textSize > 0,
      onClick: () => updateState("textSize", (state.textSize + 1) % 3),
      desc: "Increase text size"
    },
    {
      label: "Readable Font",
      icon: Type,
      active: state.readableFont,
      onClick: () => updateState("readableFont", !state.readableFont),
      desc: "Use simple sans-serif font"
    },
    {
      label: "Dyslexia Font",
      icon: Type,
      active: state.dyslexiaFont,
      onClick: () => updateState("dyslexiaFont", !state.dyslexiaFont),
      desc: "OpenDyslexic font"
    },
    {
      label: "Line Height",
      icon: MoveVertical,
      active: state.lineHeight > 0,
      onClick: () => updateState("lineHeight", (state.lineHeight + 1) % 3),
      desc: "Increase line spacing"
    },
    {
      label: "Letter Spacing",
      icon: MoveHorizontal,
      active: state.letterSpacing > 0,
      onClick: () => updateState("letterSpacing", (state.letterSpacing + 1) % 3),
      desc: "Increase character spacing"
    },
    {
      label: "Word Spacing",
      icon: MoveHorizontal,
      active: state.wordSpacing > 0,
      onClick: () => updateState("wordSpacing", (state.wordSpacing + 1) % 3),
      desc: "Increase word spacing"
    },

    // Alignment
    {
      label: "Align Left",
      icon: AlignLeft,
      active: state.textAlign === 'left',
      onClick: () => updateState("textAlign", state.textAlign === 'left' ? 'initial' : 'left'),
      desc: "Force left alignment"
    },
    {
      label: "Align Center",
      icon: AlignCenter,
      active: state.textAlign === 'center',
      onClick: () => updateState("textAlign", state.textAlign === 'center' ? 'initial' : 'center'),
      desc: "Force center alignment"
    },
    {
      label: "Align Right",
      icon: AlignRight,
      active: state.textAlign === 'right',
      onClick: () => updateState("textAlign", state.textAlign === 'right' ? 'initial' : 'right'),
      desc: "Force right alignment"
    },
    {
      label: "Justify",
      icon: AlignJustify,
      active: state.textAlign === 'justify',
      onClick: () => updateState("textAlign", state.textAlign === 'justify' ? 'initial' : 'justify'),
      desc: "Justify text"
    },

    // Contrast & Color
    {
      label: "High Contrast (Dark)",
      icon: Contrast,
      active: state.contrast === "high-dark",
      onClick: () => updateState("contrast", state.contrast === "high-dark" ? "normal" : "high-dark"),
      desc: "Dark high contrast mode"
    },
    {
      label: "High Contrast (Light)",
      icon: Sun,
      active: state.contrast === "high-light",
      onClick: () => updateState("contrast", state.contrast === "high-light" ? "normal" : "high-light"),
      desc: "Light high contrast mode"
    },
    {
      label: "Yellow on Black",
      icon: Contrast,
      active: state.contrast === "yellow-on-black",
      onClick: () => updateState("contrast", state.contrast === "yellow-on-black" ? "normal" : "yellow-on-black"),
      desc: "Yellow text on black background"
    },
    {
      label: "Invert Colors",
      icon: RefreshCcw,
      active: state.contrast === "invert",
      onClick: () => updateState("contrast", state.contrast === "invert" ? "normal" : "invert"),
      desc: "Invert all colors"
    },
    {
      label: "Grayscale",
      icon: EyeOff,
      active: state.contrast === "grayscale",
      onClick: () => updateState("contrast", state.contrast === "grayscale" ? "normal" : "grayscale"),
      desc: "Remove all color"
    },
    {
      label: "Sepia Mode",
      icon: Coffee,
      active: state.contrast === "sepia",
      onClick: () => updateState("contrast", state.contrast === "sepia" ? "normal" : "sepia"),
      desc: "Warm sepia tones"
    },
    {
      label: "Low Saturation",
      icon: Palette,
      active: state.saturation === 0.5,
      onClick: () => updateState("saturation", state.saturation === 0.5 ? 1 : 0.5),
      desc: "Reduce color intensity"
    },
    {
      label: "High Saturation",
      icon: Palette,
      active: state.saturation === 2,
      onClick: () => updateState("saturation", state.saturation === 2 ? 1 : 2),
      desc: "Increase color intensity"
    },

    // Focus & Guides
    {
      label: "Highlight Links",
      icon: LinkIcon,
      active: state.highlightLinks,
      onClick: () => updateState("highlightLinks", !state.highlightLinks),
      desc: "Underline and highlight links"
    },
    {
      label: "Highlight Titles",
      icon: Heading,
      active: state.highlightTitles,
      onClick: () => updateState("highlightTitles", !state.highlightTitles),
      desc: "Highlight all headings"
    },
    {
      label: "Highlight Hover",
      icon: MousePointerClick,
      active: state.highlightHover,
      onClick: () => updateState("highlightHover", !state.highlightHover),
      desc: "Highlight element on hover"
    },
    {
      label: "Highlight Focus",
      icon: Target,
      active: state.highlightFocus,
      onClick: () => updateState("highlightFocus", !state.highlightFocus),
      desc: "Highlight focused element"
    },
    {
      label: "Show Borders",
      icon: BoxSelect,
      active: state.showBorders,
      onClick: () => updateState("showBorders", !state.showBorders),
      desc: "Show element borders"
    },
    {
      label: "Reading Guide",
      icon: Minus,
      active: state.readingGuide,
      onClick: () => updateState("readingGuide", !state.readingGuide),
      desc: "Horizontal reading line"
    },
    {
      label: "Reading Mask",
      icon: ScanLine,
      active: state.readingMask,
      onClick: () => updateState("readingMask", !state.readingMask),
      desc: "Focus on hover area"
    },

    // Cursor & Media
    {
      label: "Big Cursor (Black)",
      icon: MousePointer2,
      active: state.cursor === "big-black",
      onClick: () => updateState("cursor", state.cursor === "big-black" ? "default" : "big-black"),
      desc: "Large black cursor"
    },
    {
      label: "Big Cursor (White)",
      icon: MousePointer2,
      active: state.cursor === "big-white",
      onClick: () => updateState("cursor", state.cursor === "big-white" ? "default" : "big-white"),
      desc: "Large white cursor"
    },
    {
      label: "Big Cursor (Yellow)",
      icon: MousePointer2,
      active: state.cursor === "big-yellow",
      onClick: () => updateState("cursor", state.cursor === "big-yellow" ? "default" : "big-yellow"),
      desc: "Large yellow cursor"
    },
    {
      label: "Hide Images",
      icon: ImageOff,
      active: state.hideImages,
      onClick: () => updateState("hideImages", !state.hideImages),
      desc: "Hide all images"
    },
    {
      label: "Stop Animations",
      icon: PauseCircle,
      active: state.stopAnimations,
      onClick: () => updateState("stopAnimations", !state.stopAnimations),
      desc: "Pause animations"
    },
  ];

  return (
    <>
      {/* Popup Panel */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[95] flex items-end md:items-center justify-center md:justify-start md:pl-24 pb-24 md:pb-0 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => e.target === e.currentTarget && toggleMenu()}
        >
          <div 
            className="bg-card dark:bg-slate-900 w-full md:w-[400px] max-h-[80vh] overflow-y-auto rounded-t-3xl md:rounded-2xl shadow-2xl border border-border flex flex-col animate-in slide-in-from-bottom-10"
            role="dialog"
            aria-modal="true"
            aria-label="Accessibility Menu"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-blue/10 rounded-lg">
                  <Accessibility className="text-brand-blue" size={24} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground">Accessibility</h2>
                  <p className="text-xs text-muted-foreground">Adjust display settings</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={reset}
                  className="p-2 text-sm text-gray-500 hover:text-brand-red flex items-center gap-1 hover:bg-red-50 rounded-lg transition-colors"
                  title="Reset all"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
                <button 
                  onClick={toggleMenu}
                  className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Grid Options */}
            <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto">
              {options.map((option, index) => {
                const Icon = option.icon;
                return (
                  <button
                    key={index}
                    onClick={option.onClick}
                    className={clsx(
                      "flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2 text-center h-28 relative group",
                      option.active 
                        ? "bg-brand-blue/10 border-brand-blue text-brand-blue" 
                        : "bg-gray-50 dark:bg-slate-800 border-transparent hover:border-gray-200 dark:hover:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                    )}
                    title={option.desc}
                  >
                    <Icon size={24} strokeWidth={option.active ? 2.5 : 2} />
                    <span className="text-xs font-medium leading-tight">{option.label}</span>
                    {option.active && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-blue" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Click outside to close */}
          <div className="absolute inset-0 -z-10" onClick={() => toggleMenu()} />
        </div>
      )}
    </>
  );
}
