"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { Course } from "@/lib/types";
import { Loader2, Video, Calendar, Clock, Lock, CheckCircle2, Copy, ExternalLink, Presentation } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Hardcoded default webinar info provided by user
const DEFAULT_WEBINAR_ZOOM = {
    joinUrl: "https://us06web.zoom.us/j/87523067923?pwd=YTVepQfpt7dGZbSUDd9qqEqxWVWIyq.1",
    meetingId: "875 2306 7923",
    passcode: "251388"
};

export default function WebinarJoinPage() {
    const { courseId } = useParams();
    const { userData } = useAuth();
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (userData && courseId) {
            checkAccess();
        }
    }, [userData, courseId]);

    const checkAccess = async () => {
        try {
            const courseData = await courseService.getCourse(courseId as string);
            setCourse(courseData);

            if (userData?.role === 'admin' || userData?.role === 'superadmin') {
                setIsRegistered(true);
            } else {
                const enrollments = await enrollmentService.getUserEnrollments(userData!.uid);
                const hasCourse = enrollments.some(e => 
                    e.courseId === courseId && 
                    (e.status === 'active' || e.status === 'completed')
                );
                setIsRegistered(hasCourse);
            }
        } catch (error) {
            console.error("Failed to check webinar access:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
                <p className="text-gray-500 font-medium">Verifying registration...</p>
            </div>
        );
    }

    if (!isRegistered) {
        return (
            <div className="max-w-2xl mx-auto py-20 px-4 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={40} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Registration Required</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    This webinar is exclusive to registered students. Please register for the course 
                    <span className="font-bold text-gray-900"> "{course?.title}" </span> 
                    to access the live Zoom link.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => router.push(`/courses`)} variant="outline">
                        Browse Courses
                    </Button>
                    <Button onClick={() => router.push(`/courses/${courseId}`)}>
                        Go to Course Page
                    </Button>
                </div>
            </div>
        );
    }

    // Use course specific Zoom info if available, otherwise use the default provided by user
    const zoomInfo = course?.zoomDetails || DEFAULT_WEBINAR_ZOOM;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 md:px-6">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Header Decoration */}
                <div className="h-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
                
                <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold uppercase tracking-wider mb-4 border border-green-100">
                                <CheckCircle2 size={12} />
                                Successfully Registered
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                Webinar: {course?.title}
                            </h1>
                            <p className="text-gray-500 mt-2 font-medium">
                                Welcome! You have access to join this live session.
                            </p>
                        </div>
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-brand-blue shrink-0 shadow-inner">
                            <Video size={40} />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        {/* Main Link Card */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Presentation className="text-brand-blue" />
                                    Join Meeting
                                </h3>
                                
                                <div className="space-y-4">
                                    <a 
                                        href={zoomInfo.joinUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block"
                                    >
                                        <Button fullWidth size="lg" className="h-16 text-lg rounded-2xl shadow-xl shadow-blue-500/20">
                                            Join via Zoom App
                                            <ExternalLink className="ml-2" size={20} />
                                        </Button>
                                    </a>
                                    
                                    <p className="text-center text-xs text-gray-400">
                                        Have the Zoom desktop client or mobile app installed for the best experience.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Clock size={20} />
                                    Session Reminders
                                </h3>
                                <ul className="space-y-3 text-blue-100 text-sm">
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0"></div>
                                        <span>Join 5-10 minutes early to test your audio.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0"></div>
                                        <span>Keep your microphone muted when not speaking.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0"></div>
                                        <span>A recording will be available 24h after the session.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Meeting Details */}
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Credential Details</h3>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Meeting ID</label>
                                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 font-mono text-lg font-bold text-gray-800 dark:text-gray-200">
                                            {zoomInfo.meetingId}
                                            <button 
                                                onClick={() => copyToClipboard(zoomInfo.meetingId)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-brand-blue transition-all"
                                            >
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Passcode</label>
                                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 font-mono text-lg font-bold text-gray-800 dark:text-gray-200">
                                            {zoomInfo.passcode}
                                            <button 
                                                onClick={() => copyToClipboard(zoomInfo.passcode)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-brand-blue transition-all"
                                            >
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {copied && (
                                    <div className="mt-4 text-center text-sm font-bold text-green-500 animate-in fade-in slide-in-from-bottom-2">
                                        Copied to clipboard!
                                    </div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center text-yellow-600">
                                    <Lock size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Secure Access</p>
                                    <p className="text-xs text-gray-500">Only authorized emails can join this meeting.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-gray-900">
                    Go Back
                </Button>
            </div>
        </div>
    );
}
