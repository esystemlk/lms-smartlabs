"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ChevronLeft } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

export default function NotificationsSettingsPage() {
    const { userData, user } = useAuth();
    const router = useRouter();

    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false
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
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Notifications</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your alerts and emails</p>
                </div>
            </div>

            <div className="bg-card rounded-2xl p-4 md:p-6 shadow-soft space-y-6">
                <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                            <h3 className="font-medium text-base text-foreground">Email Notifications</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates and alerts via email.</p>
                        </div>
                        <button
                            onClick={() => handlePreferenceUpdate('emailNotifications', !preferences.emailNotifications)}
                            className={clsx(
                                "w-12 h-6 rounded-full transition-colors relative",
                                preferences.emailNotifications ? "bg-brand-blue" : "bg-gray-200 dark:bg-gray-700"
                            )}
                        >
                            <div className={clsx(
                                "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                                preferences.emailNotifications ? "left-7" : "left-1"
                            )} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                            <h3 className="font-medium text-base text-foreground">Push Notifications</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Receive push notifications on your device.</p>
                        </div>
                        <button
                            onClick={async () => {
                                const newValue = !preferences.pushNotifications;
                                if (newValue && "Notification" in window) {
                                    if (Notification.permission === "default") {
                                        await Notification.requestPermission();
                                    } else if (Notification.permission === "denied") {
                                        alert("Please enable notifications in your browser settings to receive alerts.");
                                        return;
                                    }
                                }
                                handlePreferenceUpdate('pushNotifications', newValue);
                            }}
                            className={clsx(
                                "w-12 h-6 rounded-full transition-colors relative",
                                preferences.pushNotifications ? "bg-brand-blue" : "bg-gray-200 dark:bg-gray-700"
                            )}
                        >
                            <div className={clsx(
                                "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                                preferences.pushNotifications ? "left-7" : "left-1"
                            )} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-base text-foreground">Marketing Emails</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Receive news about new features and updates.</p>
                        </div>
                        <button
                            onClick={() => handlePreferenceUpdate('marketingEmails', !preferences.marketingEmails)}
                            className={clsx(
                                "w-12 h-6 rounded-full transition-colors relative",
                                preferences.marketingEmails ? "bg-brand-blue" : "bg-gray-200 dark:bg-gray-700"
                            )}
                        >
                            <div className={clsx(
                                "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                                preferences.marketingEmails ? "left-7" : "left-1"
                            )} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
