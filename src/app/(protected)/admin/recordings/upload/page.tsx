"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { courseService } from "@/services/courseService";
import { bunnyService } from "@/services/bunnyService";
import { Course, Batch, RecordedClass } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    Loader2,
    ArrowLeft,
    Upload,
    Check,
    AlertCircle,
    Video,
    Calendar,
    Clock,
    Play,
    X
} from "lucide-react";
import Link from "next/link";

export default function RecordingUploadPage() {
    const { userData, loading: authLoading } = useAuth();
    const router = useRouter();

    const [courses, setCourses] = useState<Course[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        date: new Date().toISOString().split('T')[0],
        duration: "60",
        order: "0" // For alignment
    });

    interface CourseSelection {
        courseId: string;
        batchId: string;
        timeSlotId: string;
        batches: Batch[];
        fetchingBatches: boolean;
    }

    const [selections, setSelections] = useState<CourseSelection[]>([
        { courseId: "", batchId: "", timeSlotId: "", batches: [], fetchingBatches: false }
    ]);

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && userData) {
            if (!["admin", "superadmin", "developer", "lecturer"].includes(userData.role)) {
                router.push("/dashboard");
                return;
            }
            fetchInitialData();
        }
    }, [userData, authLoading]);

    const fetchInitialData = async () => {
        try {
            const data = await courseService.getAllCourses();
            setCourses(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBatchesForSelection = async (index: number, courseId: string) => {
        if (!courseId) return;

        setSelections((prev: CourseSelection[]) => {
            const updated = [...prev];
            if (updated[index]) {
                updated[index] = { ...updated[index], fetchingBatches: true };
            }
            return updated;
        });

        try {
            const batches = await courseService.getBatches(courseId);
            setSelections((prev: CourseSelection[]) => {
                const updated = [...prev];
                if (updated[index] && updated[index].courseId === courseId) {
                    updated[index] = { ...updated[index], batches: batches, fetchingBatches: false };
                }
                return updated;
            });
        } catch (error) {
            console.error("Error fetching batches:", error);
            setSelections((prev: CourseSelection[]) => {
                const updated = [...prev];
                if (updated[index] && updated[index].courseId === courseId) {
                    updated[index] = { ...updated[index], fetchingBatches: false };
                }
                return updated;
            });
        }
    };

    const updateCourseSelection = (index: number, courseId: string) => {
        setSelections((prev: CourseSelection[]) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                courseId,
                batchId: "",
                batches: [],
                timeSlotId: ""
            };
            return updated;
        });
        if (courseId) {
            fetchBatchesForSelection(index, courseId);
        }
    };

    const addSelection = () => {
        setSelections((prev: CourseSelection[]) => [...prev, { courseId: "", batchId: "", timeSlotId: "", batches: [], fetchingBatches: false }]);
    };

    const removeSelection = (index: number) => {
        setSelections((prev: CourseSelection[]) => {
            if (prev.length <= 1) return prev;
            return prev.filter((_: CourseSelection, i: number) => i !== index);
        });
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        const validSelections = selections.filter(s => s.courseId && s.batchId);
        
        if (!videoFile || validSelections.length === 0 || !formData.title) {
            setError("Please fill all required fields and select at least one course/batch.");
            return;
        }

        setUploading(true);
        setProgress(0);
        setError("");
        setSuccess(false);

        try {
            // 1. Create Video Object in Bunny.net
            const videoObj = await bunnyService.createVideo(formData.title);
            const videoId = videoObj.guid;

            // 2. Upload Video File
            await bunnyService.uploadVideo(videoFile, videoId, (p) => setProgress(p));

            // 3. Save to Firestore for ALL selections
            const promises = validSelections.map((s, index) => {
                const recording: any = {
                    id: videoId + "_" + Date.now() + "_" + index,
                    title: formData.title,
                    videoUrl: videoId, // Bunny ID
                    date: formData.date,
                    durationMinutes: parseInt(formData.duration) || 0,
                    order: parseInt(formData.order) || 0,
                };

                if (s.timeSlotId) {
                    recording.timeSlotId = s.timeSlotId;
                }

                return courseService.addRecording(s.courseId, s.batchId, recording);
            });

            await Promise.all(promises);

            setSuccess(true);
            setVideoFile(null);
            setFormData(prev => ({ ...prev, title: "" }));
            // Reset file input
            const fileInput = document.getElementById('video-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (err: any) {
            setError(err.message || "Failed to upload recording");
        } finally {
            setUploading(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
            <div className="flex items-center gap-4">
                <Link href="/courses/manage">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Manager
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Upload Class Recording</h1>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Selections Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Video className="w-4 h-4 text-brand-blue" />
                                    Target Courses & Batches
                                </label>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={addSelection}
                                    className="h-8 text-xs border-dashed"
                                >
                                    Add Another
                                </Button>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {selections.map((sel, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative space-y-3">
                                        {selections.length > 1 && (
                                            <button 
                                                type="button"
                                                onClick={() => removeSelection(idx)}
                                                className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-500 hover:bg-red-50 rounded"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Course</label>
                                            <select
                                                className="w-full h-9 text-sm rounded-lg border-gray-200 focus:ring-brand-blue focus:border-brand-blue bg-white"
                                                value={sel.courseId}
                                                onChange={e => updateCourseSelection(idx, e.target.value)}
                                                required
                                            >
                                                <option value="">Select Course</option>
                                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Batch</label>
                                                <select
                                                    className="w-full h-9 text-sm rounded-lg border-gray-200 focus:ring-brand-blue focus:border-brand-blue bg-white disabled:bg-gray-100"
                                                    value={sel.batchId}
                                                    onChange={e => {
                                                        const updated = [...selections];
                                                        updated[idx].batchId = e.target.value;
                                                        updated[idx].timeSlotId = "";
                                                        setSelections(updated);
                                                    }}
                                                    required
                                                    disabled={!sel.courseId}
                                                >
                                                    <option value="">Select Batch</option>
                                                    {sel.batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Slot (Optional)</label>
                                                <select
                                                    className="w-full h-9 text-sm rounded-lg border-gray-200 focus:ring-brand-blue focus:border-brand-blue bg-white disabled:bg-gray-100"
                                                    value={sel.timeSlotId}
                                                    onChange={e => {
                                                        const updated = [...selections];
                                                        updated[idx].timeSlotId = e.target.value;
                                                        setSelections(updated);
                                                    }}
                                                    disabled={!sel.batchId}
                                                >
                                                    <option value="">All Slots</option>
                                                    {sel.batches.find(b => b.id === sel.batchId)?.timeSlots?.map(s => (
                                                        <option key={s.id} value={s.id}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recording details */}
                        <div className="space-y-6">
                            <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Play className="w-4 h-4 text-brand-blue" />
                                Recording Info
                            </label>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Recording Title</label>
                                    <Input
                                        placeholder="e.g. Lesson 05: Grammar Basics"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Date of Class</label>
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            required
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Duration (mins)</label>
                                        <Input
                                            type="number"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ordering (0 = Last, 1+ = Custom)</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={formData.order}
                                        onChange={e => setFormData({ ...formData, order: e.target.value })}
                                        className="h-11 rounded-xl"
                                    />
                                    <p className="text-xs text-gray-500">Higher numbers show first in the student portal.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-4 pt-6 border-t">
                        <label className="block text-sm font-medium mb-2">Video File (MP4, MKV, etc.)</label>
                        <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${videoFile ? "border-green-200 bg-green-50" : "border-gray-200 hover:border-brand-blue"
                            }`}>
                            <input
                                id="video-input"
                                type="file"
                                accept="video/*"
                                onChange={e => setVideoFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploading}
                            />
                            <div className="space-y-2">
                                <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
                                    {videoFile ? <Check className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                </div>
                                {videoFile ? (
                                    <div>
                                        <p className="font-medium text-gray-900">{videoFile.name}</p>
                                        <p className="text-sm text-gray-500">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-medium text-gray-900">Click or drag to select video</p>
                                        <p className="text-sm text-gray-500">Video will be optimized for streaming by Bunny.net</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {uploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Uploading to storage...</span>
                                    <span className="font-medium text-brand-blue">{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-brand-blue h-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400">Please do not close this window until upload is complete.</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
                                <AlertCircle className="shrink-0" size={18} />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3">
                                <Check className="shrink-0" size={18} />
                                <p className="text-sm">Recording uploaded and linked successfully!</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                size="lg"
                                disabled={uploading || !videoFile}
                                className="w-full md:w-auto"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Uploading Recording...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Start Upload
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
