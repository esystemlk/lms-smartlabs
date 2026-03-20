"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    Loader2,
    LayoutDashboard,
    GraduationCap,
    BookOpen,
    PlayCircle,
    FolderOpen,
    Users,
    Settings,
    ShieldAlert,
    Video,
    BarChart2,
    CreditCard,
    CalendarCheck,
    MessageSquare
} from "lucide-react";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { CoursesTab } from "@/components/admin/CoursesTab";
import { RecordingsTab } from "@/components/admin/RecordingsTab";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { UsersTab } from "@/components/admin/UsersTab";
import { SettingsTab } from "@/components/admin/SettingsTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";
import { EnrollmentsTab } from "@/components/admin/EnrollmentsTab";
import { AttendanceTab } from "@/components/admin/AttendanceTab";
import { SupportTab } from "@/components/admin/SupportTab";
import { StudentManagementTab } from "@/components/admin/StudentManagementTab";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { userService } from "@/services/userService";
import { Course, Enrollment, UserData } from "@/lib/types";

type ManagementTab = 'dashboard' | 'courses' | 'recordings' | 'resources' | 'users' | 'settings' | 'analytics' | 'enrollments' | 'attendance' | 'support' | 'students';

export default function ManagementPortalPage() {
    const { userData, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get('tab') as ManagementTab) || 'dashboard';

    const [activeTab, setActiveTab] = useState<ManagementTab>(initialTab);

    useEffect(() => {
        const tab = searchParams.get('tab') as ManagementTab;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (!authLoading && userData) {
            const allowedRoles = ["lecturer", "admin", "superadmin", "developer"];
            if (!allowedRoles.includes(userData.role || '')) {
                router.push("/dashboard");
                return;
            }
            fetchData();
        }
    }, [userData, authLoading, router]);

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const isAdmin = ["admin", "superadmin", "developer"].includes(userData?.role || '');

            const promises: Promise<any>[] = [
                courseService.getAllCourses(),
                enrollmentService.getAllEnrollments()
            ];

            if (isAdmin) {
                promises.push(userService.getAllUsers());
            }

            const results = await Promise.all(promises);
            const coursesData = results[0];
            const enrollmentsData = results[1];
            if (isAdmin && results[2]) {
                setUsers(results[2]);
            }

            // Filter based on role if lecturer
            let filteredCourses = coursesData;
            if (userData?.role === 'lecturer') {
                filteredCourses = coursesData.filter((c: Course) =>
                    c.instructorId === userData.uid ||
                    (c.lecturerIds && c.lecturerIds.includes(userData.uid))
                );
            }

            setCourses(filteredCourses);
            setEnrollments(enrollmentsData);
        } catch (error) {
            console.error("Failed to fetch management data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleTabChange = (tab: ManagementTab) => {
        setActiveTab(tab);
        // Update URL without refresh
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url);
    };

    if (authLoading || (loadingData && courses.length === 0)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
            </div>
        );
    }

    if (!userData) return null;

    const isAdmin = ["admin", "superadmin", "developer"].includes(userData.role || '');

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Portal Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Management Portal</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Centralized control for courses, resources, and students.
                    </p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <TabButton
                        active={activeTab === 'dashboard'}
                        onClick={() => handleTabChange('dashboard')}
                        icon={LayoutDashboard}
                        label="Dashboard"
                    />
                    <TabButton
                        active={activeTab === 'courses'}
                        onClick={() => handleTabChange('courses')}
                        icon={BookOpen}
                        label="Courses"
                    />
                    <TabButton
                        active={activeTab === 'recordings'}
                        onClick={() => handleTabChange('recordings')}
                        icon={PlayCircle}
                        label="Recordings"
                    />
                    <TabButton
                        active={activeTab === 'resources'}
                        onClick={() => handleTabChange('resources')}
                        icon={FolderOpen}
                        label="Resources"
                    />
                    {isAdmin && (
                        <>
                            <TabButton
                                active={activeTab === 'enrollments'}
                                onClick={() => handleTabChange('enrollments')}
                                icon={CreditCard}
                                label="Enrollments"
                            />
                            <TabButton
                                active={activeTab === 'attendance'}
                                onClick={() => handleTabChange('attendance')}
                                icon={CalendarCheck}
                                label="Attendance"
                            />
                            <TabButton
                                active={activeTab === 'users'}
                                onClick={() => handleTabChange('users')}
                                icon={Users}
                                label="Users"
                            />
                            <TabButton
                                active={activeTab === 'students'}
                                onClick={() => handleTabChange('students')}
                                icon={GraduationCap}
                                label="Students"
                            />
                            <TabButton
                                active={activeTab === 'support'}
                                onClick={() => handleTabChange('support')}
                                icon={MessageSquare}
                                label="Support"
                            />
                            <TabButton
                                active={activeTab === 'analytics'}
                                onClick={() => handleTabChange('analytics')}
                                icon={BarChart2}
                                label="Analytics"
                            />
                            <TabButton
                                active={activeTab === 'settings'}
                                onClick={() => handleTabChange('settings')}
                                icon={Settings}
                                label="Settings"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[60vh]">
                {activeTab === 'dashboard' && <AdminDashboard />}
                {activeTab === 'courses' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => router.push('/courses/manage/new')}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md active:scale-95"
                            >
                                <BookOpen size={18} />
                                Create New Course
                            </button>
                        </div>
                        <CoursesTab
                            courses={courses}
                            enrollments={enrollments}
                            onCourseUpdated={fetchData}
                        />
                    </div>
                )}
                {activeTab === 'recordings' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => router.push('/admin/recordings/upload')}
                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-all shadow-md active:scale-95"
                            >
                                <Video size={18} />
                                Manual Upload
                            </button>
                        </div>
                        <RecordingsTab />
                    </div>
                )}
                {activeTab === 'resources' && (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h2 className="text-xl font-bold mb-6">Resource Management</h2>
                        <ResourceManager />
                    </div>
                )}
                {activeTab === 'enrollments' && isAdmin && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <EnrollmentsTab />
                    </div>
                )}
                {activeTab === 'attendance' && isAdmin && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <AttendanceTab />
                    </div>
                )}
                {activeTab === 'users' && isAdmin && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <UsersTab
                            users={users}
                            onUserUpdated={fetchData}
                        />
                    </div>
                )}
                {activeTab === 'students' && isAdmin && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <StudentManagementTab />
                    </div>
                )}
                {activeTab === 'support' && isAdmin && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <SupportTab />
                    </div>
                )}
                {activeTab === 'analytics' && isAdmin && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold">Analytics & Reports</h2>
                            <p className="text-gray-500 text-sm">System performance and usage trends</p>
                        </div>
                        <AnalyticsTab users={users} courses={courses} enrollments={enrollments} />
                    </div>
                )}
                {activeTab === 'settings' && isAdmin && (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold">System Settings</h2>
                            <p className="text-gray-500 text-sm">Configure platform-wide variables and maintenance modes.</p>
                        </div>
                        <SettingsTab />
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all whitespace-nowrap font-bold text-sm ${active
                ? "bg-brand-blue text-white shadow-lg shadow-blue-200 dark:shadow-none translate-y-[-2px]"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );
}
