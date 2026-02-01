"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Lock, Check, AlertCircle, ChevronLeft } from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

export default function SecuritySettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [securityData, setSecurityData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email) return;

        if (securityData.newPassword !== securityData.confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match." });
            return;
        }

        if (securityData.newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters." });
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            // Re-authenticate first
            const credential = EmailAuthProvider.credential(user.email, securityData.currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, securityData.newPassword);

            setMessage({ type: "success", text: "Password updated successfully!" });
            setSecurityData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                setMessage({ type: "error", text: "Incorrect current password." });
            } else {
                setMessage({ type: "error", text: "Failed to update password. Please try again." });
            }
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
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Security Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your password and security</p>
                </div>
            </div>

            <div className="bg-card rounded-2xl p-4 md:p-6 shadow-soft space-y-6">
                <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-lg">
                    <Input
                        label="Current Password"
                        type="password"
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                        required
                        placeholder="••••••••"
                    />
                    <Input
                        label="New Password"
                        type="password"
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                        required
                        placeholder="••••••••"
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                        required
                        placeholder="••••••••"
                    />

                    <div className="pt-4">
                        <Button type="submit" disabled={loading} variant="outline" className="w-full md:w-auto">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                            Update Password
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
