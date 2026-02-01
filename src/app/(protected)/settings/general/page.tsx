"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { countries } from "@/data/countries";
import { Loader2, Check, AlertCircle, ChevronLeft } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

export default function GeneralSettingsPage() {
    const { userData, user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [profileData, setProfileData] = useState({
        name: "",
        contact: "",
        country: "",
        gender: "male",
        bio: ""
    });

    useEffect(() => {
        if (userData) {
            setProfileData({
                name: userData.name || "",
                contact: userData.contact || "",
                country: userData.country || "",
                gender: userData.gender || "male",
                bio: userData.bio || ""
            });
        }
    }, [userData]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return;
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            await updateDoc(doc(db, "users", user.uid), {
                name: profileData.name,
                contact: profileData.contact,
                country: profileData.country,
                gender: profileData.gender,
                bio: profileData.bio,
                updatedAt: new Date()
            });
            setMessage({ type: "success", text: "Profile updated successfully!" });
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "Failed to update profile." });
        } finally {
            setLoading(false);
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
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">General Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal information</p>
                </div>
            </div>

            <div className="bg-card rounded-2xl p-4 md:p-6 shadow-soft space-y-6">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        />
                        <Input
                            label="Contact Number"
                            value={profileData.contact}
                            onChange={(e) => setProfileData({ ...profileData, contact: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                        <textarea
                            className="w-full px-4 py-2 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all resize-none h-24 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            placeholder="Tell us a little about yourself..."
                            value={profileData.bio}
                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                            <select
                                value={profileData.country}
                                onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all h-[46px]"
                            >
                                <option value="">Select a country</option>
                                {countries.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                            <div className="flex items-center gap-4 h-[46px]">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="male"
                                        checked={profileData.gender === "male"}
                                        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                        className="w-4 h-4 text-brand-blue focus:ring-brand-blue"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">Male</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="female"
                                        checked={profileData.gender === "female"}
                                        onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                        className="w-4 h-4 text-brand-blue focus:ring-brand-blue"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300">Female</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>

            {message.text && (
                <div className={clsx(
                    "p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-2",
                    message.type === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                )}>
                    {message.type === "success" ? <Check size={20} /> : <AlertCircle size={20} />}
                    <p className="font-medium">{message.text}</p>
                </div>
            )}
        </div>
    );
}
