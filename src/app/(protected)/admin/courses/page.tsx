"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CoursesTab } from "@/components/admin/CoursesTab";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { Course, Enrollment } from "@/lib/types";
import { Loader2, ChevronLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AdminCoursesPage() {
    const { userData, loading: authLoading } = useAuth();
    const router = useRouter();

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
            const [coursesData, enrollmentsData] = await Promise.all([
                courseService.getAllCourses(),
                enrollmentService.getAllEnrollments()
            ]);
            setCourses(coursesData);
            setEnrollments(enrollmentsData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-brand-blue" />
                            Course Management
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Create, edit, and organize courses</p>
                    </div>
                </div>
                <Link href="/courses/manage/new">
                    <Button>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Create New Course
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
                </div>
            ) : (
                <CoursesTab courses={courses} enrollments={enrollments} onCourseUpdated={fetchData} />
            )}
        </div>
    );
}
