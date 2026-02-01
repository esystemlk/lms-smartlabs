"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ChevronLeft, Sun, Moon, Check } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

export default function AppearanceSettingsPage() {
    const { userData, user } = useAuth();
    const router = useRouter();

    const [preferences, setPreferences] = useState({
        darkMode: false,
        compactMode: false
    });

    useEffect(() => {
        if (userData?.preferences) {
            setPreferences(prev => ({ ...prev, ...userData.preferences }));
        }
    }, [userData]);

    const handlePreferenceUpdate = async (key: string, value: boolean) => {
        if (!user?.uid) return;

        const newPreferences = { ...preferences, [key]: value };
        setPreferences(newPreferences); // Optimistic update

        try {
            await updateDoc(doc(db, "users", user.uid), {
                preferences: newPreferences
            });
        } catch (error) {
            console.error("Failed to save preference:", error);
            // Revert on failure
            setPreferences(preferences);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-4 px-4 md:px-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Appearance</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customize the look and feel</p>
                </div>
            </div>

            <div className="bg-card rounded-2xl p-4 md:p-6 shadow-soft space-y-6">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-medium text-base text-foreground mb-3">Theme</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handlePreferenceUpdate('darkMode', false)}
                                className={clsx(
                                    "p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                                    !preferences.darkMode
                                        ? "border-brand-blue bg-blue-50/50 dark:bg-blue-900/20"
                                        : "border-border hover:border-gray-300 dark:hover:border-gray-600"
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-orange-500">
                                    <Sun size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-medium text-base text-foreground">Light Mode</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Default bright appearance</p>
                                </div>
                                {!preferences.darkMode && <Check className="ml-auto text-brand-blue" size={20} />}
                            </button>

                            <button
                                onClick={() => handlePreferenceUpdate('darkMode', true)}
                                className={clsx(
                                    "p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                                    preferences.darkMode
                                        ? "border-brand-blue bg-blue-50/50 dark:bg-blue-900/20"
                                        : "border-border hover:border-gray-300 dark:hover:border-gray-600"
                                )}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-900 shadow-sm flex items-center justify-center text-blue-400">
                                    <Moon size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-medium text-base text-foreground">Dark Mode</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</p>
                                </div>
                                {preferences.darkMode && <Check className="ml-auto text-brand-blue" size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-base text-foreground">Compact Mode</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Reduce whitespace for higher information density.</p>
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
                    </div>
                </div>
            </div>
        </div>
    );
}
