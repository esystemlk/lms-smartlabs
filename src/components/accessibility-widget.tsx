"use client";

import { useState, useEffect, useRef } from 'react';
import {
    Accessibility, X, Eye, Type, MousePointer,
    ZoomIn, ZoomOut, MoveVertical,
    Sun, Moon, Contrast, Palette,
    WrapText, Image as ImageIcon, PauseCircle,
    RotateCcw, Ruler, Speaker, Droplet,
    Maximize, Search, Underline,
    LayoutTemplate, Mic, BoxSelect, ShieldAlert,
    PinOff, PlayCircle, MousePointerClick, Info, Lightbulb,
    BookOpen, ListFilter, EyeOff, Keyboard,
    Settings2, Activity, Sparkles, MessageSquare,
    Torus, MousePointer2, Languages, CaseSensitive,
    MoreHorizontal, Ghost, Zap, Hand
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '@/context/AccessibilityContext';
import { useToast } from '@/components/ui/Toast';

type AccessibilityState = {
    zoom: number;
    contrast: 'normal' | 'invert' | 'high-contrast' | 'dark' | 'light' | 'solarized' | 'matrix';
    saturation: number;
    fontFamily: 'default' | 'serif' | 'opendyslexic' | 'simple-sans' | 'monospace';
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    wordSpacing: number;
    textAlign: 'initial' | 'left' | 'center' | 'right' | 'justify';
    cursor: 'default' | 'big-black' | 'big-white' | 'neon-red' | 'neon-cyan';
    highlightLinks: boolean;
    highlightHeadings: boolean;
    readingGuide: boolean;
    readingMask: boolean;
    hideImages: boolean;
    stopAnimations: boolean;
    colorBlindness: 'none' | 'protanopia' | 'deuteranopia';
    blueLightFilter: boolean;
    textToSpeech: boolean;
    clickSound: boolean;
    magnifier: boolean;
    focusMode: boolean;
    monochrome: boolean;
    epilepsySafe: boolean;
    keyboardFocus: boolean;
    readableWidth: boolean;
    linkUnderlines: boolean;
    screenShader: 'none' | 'green' | 'rose' | 'yellow';
    bigClickTargets: boolean;
    pageStructureMap: boolean;
    smartTooltips: boolean;
    voiceControlReady: boolean;
    highlightInteractive: boolean;
    noSticky: boolean;
    textGlow: boolean;
    paragraphSpacing: boolean;
    bigTextFocus: boolean;
    highContrastText: boolean;
    autoScroll: boolean;
    cursorTracer: boolean;
    vibrateOnClick: boolean;
    sharpEdges: boolean;
    altTextShow: boolean;
    bionicReading: boolean;
    textCase: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    textShadow: boolean;
    bionicStrength: number;
    autoScrollSpeed: number;
    linkUnderlineStyle: 'solid' | 'dashed' | 'wavy';
    highAriaContrast: boolean;
    interactionHeatmap: boolean;
    hoverToRead: boolean;
};

const defaultState: AccessibilityState = {
    zoom: 1, contrast: 'normal', saturation: 1, fontFamily: 'default',
    fontSize: 1, lineHeight: 1.5, letterSpacing: 0, wordSpacing: 0,
    textAlign: 'initial', cursor: 'default', highlightLinks: false,
    highlightHeadings: false, readingGuide: false, readingMask: false,
    hideImages: false, stopAnimations: false, colorBlindness: 'none',
    blueLightFilter: false, textToSpeech: false, clickSound: false,
    magnifier: false, focusMode: false, monochrome: false,
    epilepsySafe: false, keyboardFocus: false, readableWidth: false,
    linkUnderlines: false, screenShader: 'none', bigClickTargets: false,
    pageStructureMap: false, smartTooltips: false, voiceControlReady: false,
    highlightInteractive: false, noSticky: false, textGlow: false,
    paragraphSpacing: false, bigTextFocus: false, highContrastText: false,
    autoScroll: false, cursorTracer: false, vibrateOnClick: false,
    sharpEdges: false, altTextShow: false, bionicReading: false,
    textCase: 'none', textShadow: false, bionicStrength: 3,
    autoScrollSpeed: 1, linkUnderlineStyle: 'solid', highAriaContrast: false,
    interactionHeatmap: false, hoverToRead: false,
};

export function AccessibilityWidget() {
    const { isMenuOpen: isOpen, setMenuOpen: setIsOpen } = useAccessibility();
    const [settings, setSettings] = useState<AccessibilityState>(defaultState);
    const [activeTab, setActiveTab] = useState<'all' | 'content' | 'display' | 'tools'>('all');
    const magnifierRef = useRef<HTMLDivElement>(null);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);
    const lastSpokenText = useRef<string>("");
    const { toast } = useToast();

    useEffect(() => {
        const saved = localStorage.getItem('accessibility-settings-v2');
        if (saved) try { setSettings(prev => ({ ...prev, ...JSON.parse(saved) })); } catch (e) { }
    }, []);

    useEffect(() => {
        localStorage.setItem('accessibility-settings-v2', JSON.stringify(settings));
        applySettingsToDom(settings);
    }, [settings]);

    useEffect(() => {
        if (settings.magnifier) {
            document.body.style.transition = 'transform 0.1s ease-out';
            toast("Magnifier Active! Press ESC to exit.", "info", 3000);
        } else {
            document.body.style.transform = '';
            document.body.style.transition = '';
        }
    }, [settings.magnifier]);

    useEffect(() => {
        if (settings.autoScroll) {
            scrollInterval.current = setInterval(() => window.scrollBy(0, settings.autoScrollSpeed), 30);
        } else {
            if (scrollInterval.current) clearInterval(scrollInterval.current);
        }
        return () => { if (scrollInterval.current) clearInterval(scrollInterval.current); };
    }, [settings.autoScroll, settings.autoScrollSpeed]);

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            let x = ('clientX' in e) ? e.clientX : e.touches[0].clientX;
            let y = ('clientY' in e) ? e.clientY : e.touches[0].clientY;

            const guide = document.getElementById('ultra-guide');
            if (guide) guide.style.top = `${y}px`;
            const mask = document.getElementById('ultra-mask');
            if (mask) mask.style.top = `${y - 100}px`;

            if (magnifierRef.current && settings.magnifier) {
                magnifierRef.current.style.left = `${x - 75}px`;
                magnifierRef.current.style.top = `${y - 75}px`;
                const zoom = 1.6;
                const originX = (x / window.innerWidth) * 100;
                const originY = (y / window.innerHeight) * 100;
                document.body.style.transformOrigin = `${originX}% ${originY}%`;
                document.body.style.transform = `scale(${zoom})`;
            }

            if (settings.hoverToRead) {
                const target = document.elementFromPoint(x, y) as HTMLElement;
                if (target) {
                    const textEl = target.closest('p, h1, h2, h3, h4, a, li, button, span');
                    if (textEl) {
                        const text = (textEl as HTMLElement).innerText.trim();
                        if (text && text !== lastSpokenText.current) {
                            window.speechSynthesis.cancel();
                            const u = new SpeechSynthesisUtterance(text);
                            u.rate = 1.1;
                            window.speechSynthesis.speak(u);
                            lastSpokenText.current = text;
                        }
                    }
                }
            }
        };

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && (settings.magnifier || settings.autoScroll)) reset();
        };

        const handleClick = () => { if (settings.vibrateOnClick && navigator.vibrate) navigator.vibrate(20); };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchstart', handleMove, { passive: true });
        window.addEventListener('keydown', handleKey);
        window.addEventListener('mousedown', handleClick);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchstart', handleMove);
            window.removeEventListener('keydown', handleKey);
            window.removeEventListener('mousedown', handleClick);
        };
    }, [settings.magnifier, settings.hoverToRead, settings.readingGuide, settings.readingMask, settings.autoScroll, settings.vibrateOnClick]);

    const update = (key: keyof AccessibilityState, value: any) => setSettings(p => ({ ...p, [key]: value }));
    const reset = () => {
        setSettings(defaultState);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        document.body.style.transform = '';
    };

    return (
        <>
            {/* STICKY TOGGLE BUTTON */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed z-[10001] transition-all active:scale-95 group overflow-hidden hidden md:flex items-center justify-center",
                    settings.magnifier ? "top-4 left-4 w-20 h-20 bg-red-600 rounded-2xl shadow-xl border-4 border-white" : "bottom-6 left-6 w-14 h-14 bg-brand-blue rounded-full shadow-lg border-2 border-white/40 hover:scale-110 hover:shadow-blue-500/50"
                )}
            >
                {isOpen ? <X className="w-6 h-6 mx-auto text-white" /> : 
                 settings.magnifier ? <Search className="w-10 h-10 mx-auto animate-pulse text-white" /> : 
                 <Accessibility className="w-8 h-8 mx-auto text-white" />
                }
                {settings.magnifier && <span className="absolute bottom-1 w-full text-[8px] font-black text-center uppercase text-white">EXIT</span>}
            </button>

            {/* OVERLAYS (Magnifier Lens, Reading Guide) */}
            <div className="fixed inset-0 pointer-events-none z-[9999]">
                {settings.readingGuide && <div id="ultra-guide" className="absolute left-0 w-full h-1 bg-red-600 shadow-md z-[100]" />}
                {settings.readingMask && <div id="ultra-mask" className="absolute left-0 w-full h-[200px] shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] z-[99]" />}
                {settings.magnifier && (
                    <div ref={magnifierRef} className="absolute w-[150px] h-[150px] rounded-full border-4 border-red-600 bg-red-500/10 pointer-events-auto cursor-pointer" onClick={reset}>
                        <div className="w-full h-full flex items-center justify-center animate-ping opacity-20 bg-red-500 rounded-full" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, x: -200, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -200, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 left-4 z-[10002] w-[95vw] sm:w-[500px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-[32px] shadow-2xl flex flex-col max-h-[82vh] overflow-hidden ring-1 ring-black/5"
                    >
                        {/* HEADER */}
                        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                            <div>
                                <h2 className="font-black text-xl md:text-2xl text-brand-blue tracking-tight flex items-center gap-2 flex-wrap">
                                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 fill-yellow-500" />
                                    Access Suite V6.5
                                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-brand-blue to-cyan-500 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-sm">
                                        PRO EDITION
                                    </span>
                                </h2>
                                <p className="text-[10px] md:text-xs font-bold uppercase text-gray-400 mt-1 tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-2 h-0.5 bg-gray-300 rounded-full"></span>
                                    BY ESYSTEMLK
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={reset} 
                                className="w-full md:w-auto rounded-full px-6 h-9 text-xs font-bold border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm hover:shadow-md active:scale-95"
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                RESET ALL
                            </Button>
                        </div>

                        {/* TABS */}
                        <div className="flex px-6 gap-3 border-b border-gray-100 dark:border-gray-800 py-4 bg-transparent overflow-x-auto no-scrollbar items-center">
                            {['all', 'content', 'display', 'tools'].map((tab) => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)} 
                                    className={cn(
                                        "px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 capitalize border", 
                                        activeTab === tab 
                                            ? "bg-brand-blue border-brand-blue text-white shadow-lg shadow-blue-500/25 translate-y-[-1px]" 
                                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-gray-50/30 dark:bg-black/20">
                           {(activeTab === 'all' || activeTab === 'content') && (
                               <Section title="Content Adjustments">
                                   <ToolToggle active={settings.fontFamily === 'opendyslexic'} onClick={() => update('fontFamily', settings.fontFamily === 'opendyslexic' ? 'default' : 'opendyslexic')} icon={Type} label="Dyslexia Font" desc="OpenDyslexic typeface" />
                                   <ToolToggle active={settings.readableWidth} onClick={() => update('readableWidth', !settings.readableWidth)} icon={WrapText} label="Readable Width" desc="Max 60 chars per line" />
                                   <ToolToggle active={settings.highlightLinks} onClick={() => update('highlightLinks', !settings.highlightLinks)} icon={Underline} label="Highlight Links" desc="Underline & bold links" />
                                   <ToolToggle active={settings.highlightHeadings} onClick={() => update('highlightHeadings', !settings.highlightHeadings)} icon={LayoutTemplate} label="Highlight Headings" desc="Emphasize titles" />
                                   <ToolToggle active={settings.textGlow} onClick={() => update('textGlow', !settings.textGlow)} icon={Lightbulb} label="Text Glow" desc="Improve contrast" />
                               </Section>
                           )}

                           {(activeTab === 'all' || activeTab === 'display') && (
                               <Section title="Display Settings">
                                   <ToolToggle active={settings.contrast === 'invert'} onClick={() => update('contrast', settings.contrast === 'invert' ? 'normal' : 'invert')} icon={Contrast} label="Invert Colors" desc="High contrast mode" />
                                   <ToolToggle active={settings.monochrome} onClick={() => update('monochrome', !settings.monochrome)} icon={Palette} label="Monochrome" desc="Grayscale mode" />
                                   <ToolToggle active={settings.epilepsySafe} onClick={() => update('epilepsySafe', !settings.epilepsySafe)} icon={ShieldAlert} label="Epilepsy Safe" desc="Stop all animations" />
                                   <ToolToggle active={settings.hideImages} onClick={() => update('hideImages', !settings.hideImages)} icon={ImageIcon} label="Hide Images" desc="Text-only mode" />
                                   <ToolToggle active={settings.cursor === 'big-black'} onClick={() => update('cursor', settings.cursor === 'big-black' ? 'default' : 'big-black')} icon={MousePointer} label="Big Cursor" desc="Larger mouse pointer" />
                                   <ToolToggle active={settings.bigClickTargets} onClick={() => update('bigClickTargets', !settings.bigClickTargets)} icon={MousePointerClick} label="Big Click Targets" desc="Easier interaction" />
                               </Section>
                           )}
                           
                           {(activeTab === 'all' || activeTab === 'display') && (
                               <Section title="Color Overlays (Irlen)">
                                   <div className="grid grid-cols-3 gap-3">
                                        <OverlayButton color="green" active={settings.screenShader === 'green'} onClick={() => update('screenShader', settings.screenShader === 'green' ? 'none' : 'green')} />
                                        <OverlayButton color="rose" active={settings.screenShader === 'rose'} onClick={() => update('screenShader', settings.screenShader === 'rose' ? 'none' : 'rose')} />
                                        <OverlayButton color="yellow" active={settings.screenShader === 'yellow'} onClick={() => update('screenShader', settings.screenShader === 'yellow' ? 'none' : 'yellow')} />
                                   </div>
                               </Section>
                           )}

                           {(activeTab === 'all' || activeTab === 'tools') && (
                               <Section title="Tools">
                                   <ToolToggle active={settings.magnifier} onClick={() => update('magnifier', !settings.magnifier)} icon={Search} label="Magnifier" desc="Real-time screen magnification" />
                                   <ToolToggle active={settings.autoScroll} onClick={() => update('autoScroll', !settings.autoScroll)} icon={PlayCircle} label="Auto-Scroll" desc="Smooth hands-free reading" />
                                   <ToolToggle active={settings.readingGuide} onClick={() => update('readingGuide', !settings.readingGuide)} icon={Ruler} label="Reading Guide" desc="Focus line for reading" />
                                   <ToolToggle active={settings.readingMask} onClick={() => update('readingMask', !settings.readingMask)} icon={BoxSelect} label="Reading Mask" desc="Dim distractions" />
                                   <ToolToggle active={settings.hoverToRead} onClick={() => update('hoverToRead', !settings.hoverToRead)} icon={Speaker} label="Text-to-Speech" desc="Hover to read text" />
                               </Section>
                           )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// HELPER COMPONENTS
function Section({ title, children }: any) {
    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <span className="w-1 h-1 bg-brand-blue rounded-full"></span>
                {title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
        </div>
    )
}

function ToolToggle({ active, onClick, icon: Icon, label, desc }: any) {
    return (
        <button onClick={onClick} className={cn("w-full p-4 rounded-2xl border flex items-center gap-4 transition-all text-left group relative overflow-hidden", 
        active ? "bg-brand-blue border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]" : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-100 dark:border-gray-700 shadow-sm")}>
            <div className={cn("p-2.5 rounded-xl shrink-0 transition-colors", active ? "bg-white/20 text-white" : "bg-blue-50 dark:bg-blue-900/20 text-brand-blue dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40")}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <span className="font-bold text-xs sm:text-sm block leading-tight">{label}</span>
                <span className={cn("text-[10px] font-medium mt-0.5 block", active ? "text-blue-100" : "text-gray-400")}>{desc}</span>
            </div>
            {active && <motion.div layoutId="active-glow" className="absolute inset-0 bg-white/10" />}
        </button>
    )
}

function OverlayButton({ color, active, onClick }: any) {
    const colors: any = {
        green: "bg-green-500/20 border-green-500 text-green-700",
        rose: "bg-pink-500/20 border-pink-500 text-pink-700",
        yellow: "bg-yellow-500/20 border-yellow-500 text-yellow-700"
    };
    
    return (
        <button onClick={onClick} className={cn("h-12 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider", 
            active ? colors[color] + " shadow-inner ring-2 ring-offset-2 ring-" + color + "-400" : "bg-gray-50 dark:bg-gray-800 border-transparent hover:border-gray-200")}>
            {active && <Zap className="w-3 h-3" />}
            {color}
        </button>
    )
}

function applySettingsToDom(s: AccessibilityState) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    root.style.fontSize = `${s.fontSize * 100}%`;

    // Apply Filter Engine
    let filters = [`saturate(${s.saturation})`];
    if (s.contrast === 'invert') filters.push('invert(1)');
    if (s.monochrome) filters.push('grayscale(100%)');
    root.style.filter = filters.join(' ');

    // Match Theme Classes to CSS
    root.classList.remove('dark', 'theme-solarized', 'theme-matrix');
    if (s.contrast === 'solarized') root.classList.add('theme-solarized');
    if (s.contrast === 'matrix') root.classList.add('theme-matrix');

    // Toggle Functional Classes
    const t = (c: string, b: boolean) => b ? body.classList.add(c) : body.classList.remove(c);
    t('access-highlight-links', s.highlightLinks);
    t('access-highlight-headings', s.highlightHeadings);
    t('access-cursor-big-black', s.cursor === 'big-black');
    t('access-cursor-neon-red', s.cursor === 'neon-red');
    t('access-epilepsy-safe', s.epilepsySafe);
    t('access-readable-width', s.readableWidth);
    t('access-focus-mode', s.focusMode);
    t('access-text-glow', s.textGlow);
    t('access-big-click-targets', s.bigClickTargets);
    t('access-hide-images', s.hideImages);
    
    // Screen Shader
    body.classList.remove('access-screen-shader-green', 'access-screen-shader-rose', 'access-screen-shader-yellow');
    if (s.screenShader !== 'none') body.classList.add(`access-screen-shader-${s.screenShader}`);
    
    // Font Family
    if (s.fontFamily === 'opendyslexic') {
         body.style.fontFamily = 'OpenDyslexic, sans-serif';
    } else {
         body.style.fontFamily = '';
    }
}
