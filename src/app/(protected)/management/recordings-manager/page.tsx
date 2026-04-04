"use client";

import React, { useEffect, useState, Fragment } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { courseService } from "@/services/courseService";
import { Lesson, Course, Batch } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { 
    Loader2, 
    Video, 
    Search, 
    Filter, 
    MoreVertical, 
    Play, 
    Link as LinkIcon, 
    Trash2, 
    CheckCircle, 
    ExternalLink,
    RefreshCw,
    X,
    Layout
} from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function RecordingManagerPage() {
    const { userData } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    interface ManagerRecording extends Lesson {
        isAttached?: boolean;
        originalBatchId?: string;
    }

    const [recordings, setRecordings] = useState<ManagerRecording[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourseId, setFilterCourseId] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "ended">("ended"); // Default to ended as it's most common
    const [syncing, setSyncing] = useState(false);
    const [bunnyLibraryId, setBunnyLibraryId] = useState("");

    // Attach Modal State
    const [attachModalOpen, setAttachModalOpen] = useState(false);
    const [selectedRecording, setSelectedRecording] = useState<ManagerRecording | null>(null);
    const [targetCourseId, setTargetCourseId] = useState("");
    const [targetBatches, setTargetBatches] = useState<Batch[]>([]);
    const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
    const [attaching, setAttaching] = useState(false);

    useEffect(() => {
        if (userData && !["lecturer", "admin", "superadmin", "developer"].includes(userData.role || '')) {
            router.push("/dashboard");
            return;
        }
        fetchData();
    }, [userData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [allPastClasses, allUpcomingClasses, allCourses, allBatchRecs] = await Promise.all([
                courseService.getPastLiveClasses(),
                courseService.getUpcomingLiveClasses(),
                courseService.getAllCourses(),
                courseService.getAllBatchRecordings()
            ]);

            try {
                const settings = await courseService.getGlobalSettings();
                if (settings?.bunny?.libraryId) {
                    setBunnyLibraryId(settings.bunny.libraryId);
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            }

            // Standardize all recordings for display
            const lessonsWithRecs = (allPastClasses as Lesson[]).filter((cls: Lesson) => !!cls.bunnyVideoId || !!cls.recordingUrl);
            const upcomingLessons = (allUpcomingClasses as Lesson[]);
            
            // Map batch recordings to look like lessons for the table
            const mappedBatchRecs = (allBatchRecs || []).map((r: any) => ({
                ...r,
                type: 'live_class',
                isAttached: true,
                // Ensure field names match for display
                bunnyVideoId: r.bunnyVideoId || (r.videoUrl && !r.videoUrl.includes('http') ? r.videoUrl : ""),
                recordingUrl: r.recordingUrl || (r.videoUrl && r.videoUrl.includes('http') ? r.videoUrl : ""),
                startTime: r.date || r.startTime,
                // Keep reference to which batch it belongs to for identification
                originalBatchId: r.batchIds?.[0]
            }));

            // Combine both sources
            const combined = [...lessonsWithRecs, ...upcomingLessons, ...mappedBatchRecs].sort((a, b) => 
                new Date(b.startTime || b.date || 0).getTime() - new Date(a.startTime || a.date || 0).getTime()
            );

            setRecordings(combined);
            setCourses(allCourses);
        } catch (error) {
            console.error("Error fetching recordings:", error);
            toast("Failed to load recordings", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncRecordings = async () => {
        setSyncing(true);
        try {
            // Priority 1: Cloud Sync via the new /api/zoom/sync-recordings
            const res = await fetch('/api/zoom/sync-recordings', { method: 'POST' });
            const data = await res.json();
            
            if (res.ok) {
                if (data.processedMeetings > 0) {
                    toast(`Sync successful! Cloud recordings linked to ${data.processedMeetings} sessions.`, "success");
                    fetchData();
                } else {
                    toast("Cloud check complete. No new recordings found for recent sessions.", "info");
                }
            } else {
                // Try fallback to cron route if new sync route fails
                const cronRes = await fetch('/api/cron/process-recordings', {
                    headers: { 'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || '' }
                });
                if (cronRes.ok) {
                    toast("Sync successful (via processing route).", "success");
                    fetchData();
                } else {
                    throw new Error(data.error || "Sync failed");
                }
            }
        } catch (error: any) {
            console.error("Sync failed:", error);
            toast(error.message || "Failed to sync recordings.", "error");
        } finally {
            setSyncing(false);
        }
    };

    const handleDeleteRecording = async (recording: ManagerRecording) => {
        let confirmMessage = "Are you sure you want to remove this recording link? This won't delete the video file itself.";

        if (recording.isAttached) {
            confirmMessage = "Are you sure you want to detach this recording from this batch? The original recording will not be affected.";
        } else {
            confirmMessage = "Are you sure you want to remove the recording from this original lesson? This will unlink the video, but other manually attached copies in other batches will remain.";
        }

        if (!confirm(confirmMessage)) return;
        
        try {
            if (recording.isAttached && recording.originalBatchId) {
                // It's a manual batch recording
                await courseService.removeRecordedClassFromBatch(recording.courseId, recording.originalBatchId, recording.id);
                toast("Attached recording removed", "success");
            } else {
                // It's a lesson recording
                await courseService.updateLesson(recording.courseId, recording.id, {
                    bunnyVideoId: "",
                    recordingUrl: "",
                    recordingStatus: "processed"
                });
                toast("Recording removed from lesson", "success");
            }
            fetchData();
        } catch (error) {
            console.error("Failed to remove recording:", error);
            toast("Failed to remove recording", "error");
        }
    };

    // Attachment Logic
    const openAttachModal = (recording: ManagerRecording) => {
        setSelectedRecording(recording);
        setTargetCourseId("");
        setTargetBatches([]);
        setSelectedBatchIds([]);
        setAttachModalOpen(true);
    };

    useEffect(() => {
        if (targetCourseId) {
            fetchTargetBatches(targetCourseId);
        } else {
            setTargetBatches([]);
        }
    }, [targetCourseId]);

    const fetchTargetBatches = async (courseId: string) => {
        try {
            const data = await courseService.getBatches(courseId);
            setTargetBatches(data);
        } catch (error) {
            console.error("Error fetching batches:", error);
        }
    };

    const handleAttach = async () => {
        if (!selectedRecording || !targetCourseId || selectedBatchIds.length === 0) {
            toast("Please select a course and at least one batch", "error");
            return;
        }

        setAttaching(true);
        try {
            for (const batchId of selectedBatchIds) {
                await courseService.addRecording(targetCourseId, batchId, {
                    id: selectedRecording.id + "_" + Date.now(), // Unique ID for this entry
                    title: selectedRecording.title,
                    videoUrl: selectedRecording.bunnyVideoId || selectedRecording.recordingUrl || "",
                    date: selectedRecording.startTime || new Date().toISOString(),
                    durationMinutes: selectedRecording.duration || 60
                });
            }
            toast(`Successfully attached to ${selectedBatchIds.length} batches`, "success");
            setAttachModalOpen(false);
        } catch (error) {
            console.error("Attachment failed:", error);
            toast("Failed to attach recording", "error");
        } finally {
            setAttaching(false);
        }
    };

    const filteredRecordings = recordings.filter((rec: ManagerRecording) => {
        const matchSearch = rec.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCourse = !filterCourseId || rec.courseId === filterCourseId || ((rec as any).bindedCourseIds && (rec as any).bindedCourseIds.includes(filterCourseId));
        
        // Status filter logic
        const now = new Date();
        const startTime = new Date(rec.startTime || (rec as any).date || 0);
        const isUpcoming = startTime > now;
        
        const matchStatus = 
            statusFilter === "all" || 
            (statusFilter === "upcoming" && isUpcoming) || 
            (statusFilter === "ended" && !isUpcoming);

        return matchSearch && matchCourse && matchStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Live Class Recordings</h1>
                    <p className="text-gray-500 mt-1">Manage, link, and organize recordings from your live sessions.</p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handleSyncRecordings} 
                        disabled={syncing}
                        className="gap-2 border-gray-200 hover:bg-gray-50"
                    >
                        {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                        Sync Zoom
                    </Button>
                    <Link href="/management?tab=class-recordings">
                        <Button className="gap-2 shadow-lg shadow-blue-500/20">
                            <Layout size={16} />
                            Portal
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                        placeholder="Search by topic..." 
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 bg-gray-50/50 border-transparent focus:bg-white focus:ring-brand-blue/20 rounded-xl"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select 
                        value={filterCourseId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCourseId(e.target.value)}
                        className="h-11 px-4 pr-10 rounded-xl border-gray-100 bg-gray-50/50 text-sm focus:ring-brand-blue/20 outline-none cursor-pointer hover:bg-white transition-colors"
                    >
                        <option value="">All Courses</option>
                        {courses.map((c: Course) => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex bg-gray-50/50 p-1 rounded-xl items-center border border-gray-100">
                    <button 
                        onClick={() => setStatusFilter("all")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white shadow text-brand-blue' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setStatusFilter("upcoming")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === 'upcoming' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Upcoming
                    </button>
                    <button 
                        onClick={() => setStatusFilter("ended")}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === 'ended' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Ended
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-black">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Recording Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Origin Course</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRecordings.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <Video size={48} strokeWidth={1.5} />
                                            <p className="text-lg font-medium">No recordings found</p>
                                            <p className="text-sm">Try adjusting your filters or sync with Zoom.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRecordings.map((rec: ManagerRecording) => (
                                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                                     <Play size={20} fill="currentColor" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 group-hover:text-brand-blue transition-colors line-clamp-1">
                                                        {rec.title}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                                        {new Date(rec.startTime || (rec as any).date || 0) > new Date() ? (
                                                            <span className="text-xs text-green-600 font-bold flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded">
                                                                <RefreshCw size={12} className="animate-spin-slow" />
                                                                Upcoming
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                                                                Ended
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            {(rec.bunnyVideoId || rec.recordingUrl) ? (
                                                                <CheckCircle size={12} className="text-green-500" />
                                                            ) : (
                                                                <X size={12} className="text-amber-500" />
                                                            )}
                                                            {(rec.bunnyVideoId || rec.recordingUrl) ? 'Recorded' : 'No Recording'}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-medium">
                                                            {rec.startTime || (rec as any).date ? new Date(rec.startTime || (rec as any).date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '-'}
                                                        </span>
                                                        {rec.bunnyVideoId && (
                                                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold tracking-tight">
                                                                BUNNY.NET
                                                            </span>
                                                        )}
                                                        {rec.isAttached && (
                                                            <span className="text-[10px] text-brand-blue font-bold uppercase tracking-wider flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded">
                                                                <LinkIcon size={10} /> Attached
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm text-gray-600 font-medium truncate max-w-[200px]">
                                                {courses.find((c: Course) => c.id === rec.courseId)?.title || "Unknown Course"}
                                            </div>
                                            {rec.batchIds && rec.batchIds.length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {rec.batchIds.map((bid: string) => (
                                                        <span key={bid} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium">
                                                            {bid}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="gap-2 border-gray-200 hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50 transition-all rounded-lg"
                                                    onClick={() => openAttachModal(rec)}
                                                    disabled={!(rec.bunnyVideoId || rec.recordingUrl)}
                                                >
                                                    <LinkIcon size={14} />
                                                    Attach
                                                </Button>

                                                {(rec.bunnyVideoId || rec.recordingUrl) && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className={`p-2 transition-all rounded-lg ${rec.isAttached ? "text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`}
                                                        onClick={() => handleDeleteRecording(rec)}
                                                        title={rec.isAttached ? "Detach from this batch" : "Delete recording linkage"}
                                                    >
                                                        {rec.isAttached ? (
                                                            <div className="flex items-center gap-1">
                                                                <X size={16} />
                                                                <span className="text-xs font-bold">Remove</span>
                                                            </div>
                                                        ) : (
                                                            <Trash2 size={16} />
                                                        )}
                                                    </Button>
                                                )}

                                                <Menu as="div" className="relative inline-block text-left">
                                                    <Menu.Button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                                                        <MoreVertical size={18} />
                                                    </Menu.Button>
                                                    <Transition
                                                        as={Fragment}
                                                        enter="transition ease-out duration-100"
                                                        enterFrom="transform opacity-0 scale-95"
                                                        enterTo="transform opacity-100 scale-100"
                                                        leave="transition ease-in duration-75"
                                                        leaveFrom="transform opacity-100 scale-100"
                                                        leaveTo="transform opacity-0 scale-95"
                                                    >
                                                        <Menu.Items className="absolute right-0 w-48 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                                            <div className="px-1 py-1">
                                                                 <Menu.Item>
                                                                    {({ active }: { active: boolean }) => (
                                                                        <a 
                                                                            href={`https://iframe.mediadelivery.net/play/${bunnyLibraryId || '301323'}/${rec.bunnyVideoId}`} 
                                                                            target="_blank"
                                                                            className={`${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} group flex rounded-lg items-center w-full px-3 py-2 text-sm transition-colors`}
                                                                        >
                                                                            <ExternalLink className="w-4 h-4 mr-3" />
                                                                            Preview Video
                                                                        </a>
                                                                    )}
                                                                </Menu.Item>
                                                                 <Menu.Item>
                                                                    {({ active }: { active: boolean }) => (
                                                                        <button
                                                                            onClick={() => handleDeleteRecording(rec)}
                                                                            className={`${active ? 'bg-red-50 text-red-600' : 'text-red-700'} group flex rounded-lg items-center w-full px-3 py-2 text-sm transition-colors`}
                                                                        >
                                                                            <Trash2 className="w-4 h-4 mr-3" />
                                                                            Remove Link
                                                                        </button>
                                                                    )}
                                                                </Menu.Item>
                                                            </div>
                                                        </Menu.Items>
                                                    </Transition>
                                                </Menu>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Attach Modal */}
            {attachModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Attach Recording</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Link "{selectedRecording?.title}" to other courses</p>
                            </div>
                            <button onClick={() => setAttachModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2 text-black">
                                <label className="text-sm font-bold text-gray-700 mb-1 block">Target Course</label>
                                <select 
                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all cursor-pointer"
                                    value={targetCourseId}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                        setTargetCourseId(e.target.value);
                                        setSelectedBatchIds([]);
                                    }}
                                >
                                    <option value="">-- Select Target Course --</option>
                                    {courses.map((c: Course) => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            {targetCourseId && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-bold text-gray-700 flex items-center justify-between mb-2">
                                        Select Target Batches
                                        <span className="text-[10px] font-normal text-gray-400 uppercase tracking-wider">{targetBatches.length} Available</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {targetBatches.length > 0 ? (
                                            targetBatches.map((batch: Batch) => {
                                                const isSelected = selectedBatchIds.includes(batch.id);
                                                return (
                                                    <button
                                                        key={batch.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const isSelected = selectedBatchIds.includes(batch.id);
                                                            if (isSelected) {
                                                                setSelectedBatchIds((prev: string[]) => prev.filter((id: string) => id !== batch.id));
                                                            } else {
                                                                setSelectedBatchIds((prev: string[]) => [...prev, batch.id]);
                                                            }
                                                        }}
                                                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-all ${selectedBatchIds.includes(batch.id)
                                                            ? "bg-blue-50 border-brand-blue/50 text-brand-blue"
                                                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 shadow-sm"
                                                        }`}
                                                    >
                                                        <span className="truncate">{batch.name}</span>
                                                        {selectedBatchIds.includes(batch.id) && <CheckCircle size={14} className="shrink-0" />}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-2 text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                <p className="text-sm text-gray-400">No batches found for this course</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                    <LinkIcon className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                        This will add the recording to the selected batches. Students in these batches will see this video in their "Recent History" section.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <Button variant="ghost" className="font-bold text-gray-500" onClick={() => setAttachModalOpen(false)}>Cancel</Button>
                            <Button 
                                onClick={handleAttach}
                                disabled={attaching || !targetCourseId || selectedBatchIds.length === 0}
                                className="bg-brand-blue hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-500/20"
                            >
                                {attaching ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Attaching...
                                    </>
                                ) : "Confirm Attachment"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
