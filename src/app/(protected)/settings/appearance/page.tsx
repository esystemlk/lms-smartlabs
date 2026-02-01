"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ChevronLeft, Sun, Moon, Check, RotateCcw, Save } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

// Predefined color palettes
const PALETTES = [
    { name: "Default Blue", primary: "#0056D2" },
    { name: "Emerald", primary: "#10b981" },
    { name: "Purple", primary: "#8b5cf6" },
    { name: "Rose", primary: "#f43f5e" },
    { name: "Orange", primary: "#f97316" },
    { name: "Black", primary: "#000000" },
];

export default function AppearanceSettingsPage() {
    const { userData, user } = useAuth();
    const { customTheme, updateTheme, resetTheme, isDark } = useTheme();
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const [preferences, setPreferences] = useState({
        darkMode: false,
        compactMode: false
    });

    // Local state for color pickers to allow immediate feedback before saving
    const [localTheme, setLocalTheme] = useState(customTheme);

    useEffect(() => {
        if (userData?.preferences) {
            setPreferences(prev => ({ ...prev, ...userData.preferences }));
        }
    }, [userData]);

    useEffect(() => {
        setLocalTheme(customTheme);
    }, [customTheme]);

    const handlePreferenceUpdate = async (key: string, value: boolean) => {
        if (!user?.uid) return;

        const newPreferences = { ...preferences, [key]: value };
        setPreferences(newPreferences);

        try {
            await updateDoc(doc(db, "users", user.uid), {
                preferences: newPreferences
            });
        } catch (error) {
            console.error("Failed to save preference:", error);
            setPreferences(preferences);
        }
    };

    const handleColorChange = (key: keyof typeof customTheme, value: string) => {
        const newTheme = { ...localTheme, [key]: value };
        setLocalTheme(newTheme);
        updateTheme(newTheme); // Apply immediately to context for live preview
    };

    const saveTheme = async () => {
        if (!user?.uid) return;
        setSaving(true);
        try {
            // Merge existing preferences with new custom theme
            const updatedPreferences = {
                ...preferences,
                customTheme: localTheme
            };

            await updateDoc(doc(db, "users", user.uid), {
                preferences: updatedPreferences
            });
            alert("Theme saved successfully!");
        } catch (error) {
            console.error("Failed to save theme:", error);
            alert("Failed to save theme.");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (confirm("Are you sure you want to reset to default colors?")) {
            resetTheme();
            if (user?.uid) {
                // Remove customTheme from firebase to revert to defaults
                await updateDoc(doc(db, "users", user.uid), {
                    "preferences.customTheme": null
                });
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-4 px-4 md:px-0">
            <div className="flex items-center gap-4 border-b border-border pb-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Appearance & Theme</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customize colors, mode, and layout</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Settings Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dark/Light Mode */}
                    <section className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                        <h3 className="font-semibold text-lg mb-4 text-foreground">Color Mode</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => handlePreferenceUpdate('darkMode', false)}
                                className={clsx(
                                    "p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                                    !preferences.darkMode
                                        ? "border-brand-blue bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-brand-blue"
                                        : "border-border hover:border-gray-300 dark:hover:border-gray-600"
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-orange-500">
                                    <Sun size={20} />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-medium text-foreground">Light Mode</h4>
                                    <p className="text-xs text-gray-500">Bright and clear</p>
                                </div>
                                {!preferences.darkMode && <Check className="ml-auto text-brand-blue" size={20} />}
                            </button>

                            <button
                                onClick={() => handlePreferenceUpdate('darkMode', true)}
                                className={clsx(
                                    "p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                                    preferences.darkMode
                                        ? "border-brand-blue bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-brand-blue"
                                        : "border-border hover:border-gray-300 dark:hover:border-gray-600"
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-900 shadow-sm flex items-center justify-center text-blue-400">
                                    <Moon size={20} />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-medium text-foreground">Dark Mode</h4>
                                    <p className="text-xs text-gray-500">Easy on eyes</p>
                                </div>
                                {preferences.darkMode && <Check className="ml-auto text-brand-blue" size={20} />}
                            </button>
                        </div>
                    </section>

                    {/* Custom Theme Builder */}
                    <section className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-lg text-foreground">Theme Builder</h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={handleReset} title="Reset to Defaults">
                                    <RotateCcw size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Preset Palettes */}
                        <div className="mb-6">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Quick Presets</label>
                            <div className="flex flex-wrap gap-3">
                                {PALETTES.map((palette) => (
                                    <button
                                        key={palette.name}
                                        onClick={() => handleColorChange('primary', palette.primary)}
                                        className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                                        style={{ backgroundColor: palette.primary }}
                                        title={palette.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Advanced Color Pickers */}
                        <div className="space-y-4">
                            <ColorInput
                                label="Primary Color"
                                value={localTheme.primary}
                                onChange={(val) => handleColorChange('primary', val)}
                            />
                            <ColorInput
                                label="Background Color"
                                value={localTheme.background}
                                onChange={(val) => handleColorChange('background', val)}
                            />
                            <ColorInput
                                label="Card Background"
                                value={localTheme.card}
                                onChange={(val) => handleColorChange('card', val)}
                            />
                            <ColorInput
                                label="Text Color"
                                value={localTheme.foreground}
                                onChange={(val) => handleColorChange('foreground', val)}
                            />
                        </div>

                        <div className="mt-8 pt-6 border-t border-border flex justify-end">
                            <Button onClick={saveTheme} disabled={saving}>
                                <Save size={18} className="mr-2" />
                                {saving ? "Saving..." : "Save Theme"}
                            </Button>
                        </div>
                    </section>
                </div>

                {/* Sidebar/Extra Column */}
                <div className="space-y-6">
                    <section className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                        <h3 className="font-semibold text-lg mb-4 text-foreground">Layout</h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-foreground">Compact Mode</h4>
                                <p className="text-xs text-gray-500">Reduce whitespace density</p>
                            </div>
                            <button
                                onClick={() => handlePreferenceUpdate('compactMode', !preferences.compactMode)}
                                className={clsx(
                                    "w-12 h-6 rounded-full transition-colors relative",
                                    preferences.compactMode ? "bg-brand-blue" : "bg-gray-200 dark:bg-gray-700"
                                )}
                            >
                                <div className={clsx(
                                    "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                                    preferences.compactMode ? "left-7" : "left-1"
                                )} />
                            </button>
                        </div>
                    </section>

                    {/* Preview Card */}
                    <section className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                        <h3 className="font-semibold text-lg mb-4 text-foreground">Preview</h3>
                        <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-brand-blue text-white shadow-md">
                                <p className="font-bold">Primary Button</p>
                            </div>
                            <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                                <p className="font-medium text-foreground">Card Component</p>
                                <p className="text-sm text-gray-500">This updates in real-time.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function ColorInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
    return (
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-mono uppercase">{value}</span>
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border shadow-sm">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 border-0"
                    />
                </div>
            </div>
        </div>
    );
}
