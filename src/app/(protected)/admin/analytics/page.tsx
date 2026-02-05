"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { userService } from "@/services/userService";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { UserData, Course, Enrollment } from "@/lib/types";
import { Loader2, ChevronLeft, BarChart2 } from "lucide-react";

export default function AdminAnalyticsPage() {
    const { userData, loading: authLoading } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState<UserData[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && userData) {
            const allowedRoles = ["admin", "superadmin", "developer"];
            if (!userData.role || !allowedRoles.includes(userData.role)) {
                router.push("/dashboard");
            } else {
                fetchData();
            }
        }
    }, [userData, authLoading, router]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, coursesData, enrollmentsData] = await Promise.all([
                userService.getAllUsers(),
                courseService.getAllCourses(),
                enrollmentService.getAllEnrollments()
            ]);
            setUsers(usersData);
            setCourses(coursesData);
            setEnrollments(enrollmentsData);
        } catch (error) {
            console.error("Failed to fetch analytics data:", error);
        } finally {
            setLoading(false);
        }
    };

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
                        <BarChart2 className="w-6 h-6 text-brand-blue" />
                        Analytics & Reports
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">System performance and usage trends</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
                </div>
            ) : (
                <AnalyticsTab users={users} courses={courses} enrollments={enrollments} />
            )}
        </div>
    );
}
