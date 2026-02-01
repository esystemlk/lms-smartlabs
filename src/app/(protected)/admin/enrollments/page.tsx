"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { EnrollmentsTab } from "@/components/admin/EnrollmentsTab";
import { Loader2, ChevronLeft, CreditCard } from "lucide-react";

export default function AdminEnrollmentsPage() {
    const { userData, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && userData) {
            const allowedRoles = ["admin", "superadmin", "developer"];
            if (!userData.role || !allowedRoles.includes(userData.role)) {
                router.push("/dashboard");
            }
        }
    }, [userData, authLoading, router]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
            </div>
        );
    }

    if (!userData) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20 pt-4 px-4 md:px-0">
            <div className="flex items-center gap-4 border-b border-border pb-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-brand-blue" />
                        Enrollment Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Process enrollments and verify payments</p>
                </div>
            </div>

            <EnrollmentsTab />
        </div>
    );
}
