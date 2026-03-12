"use client";

import { useState } from "react";
import {
    X, Loader2, Save, Plus, Trash2,
    Video, PlayCircle, Mic, Headphones,
    PenTool, BookOpen, HelpCircle, Upload
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Batch, Lesson, Course, RecordedClass } from "@/lib/types";
import { courseService } from "@/services/courseService";
import { bunnyService } from "@/services/bunnyService";

interface BatchModalProps {
    courseId: string;
    editingBatchId: string | null;
    newBatchData: any;
    setNewBatchData: (data: any) => void;
    newBatchSlots: any[];
    setNewBatchSlots: (slots: any[]) => void;
    batchSaving: boolean;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
}

export function BatchModal({
    editingBatchId,
    newBatchData,
    setNewBatchData,
    newBatchSlots,
    setNewBatchSlots,
    batchSaving,
    onClose,
    onSave
}: BatchModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">{editingBatchId ? "Edit Batch" : "Add New Batch"}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSave} className="p-6 space-y-4">
                    <Input
                        label="Batch Name"
                        placeholder="e.g. Intake 01 - 2026"
                        value={newBatchData.name}
                        onChange={(e) => setNewBatchData({ ...newBatchData, name: e.target.value })}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={newBatchData.startDate}
                            onChange={(e) => setNewBatchData({ ...newBatchData, startDate: e.target.value })}
                            required
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={newBatchData.endDate}
                            onChange={(e) => setNewBatchData({ ...newBatchData, endDate: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Max Students"
                            type="number"
                            placeholder="Optional"
                            value={newBatchData.maxStudents}
                            onChange={(e) => setNewBatchData({ ...newBatchData, maxStudents: e.target.value })}
                        />
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={newBatchData.status}
                                onChange={(e) => setNewBatchData({ ...newBatchData, status: e.target.value as any })}
                                className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all bg-white"
                            >
                                <option value="open">Open</option>
                                <option value="closed">Closed</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Schedule"
                        placeholder="e.g. Mon/Wed 7PM"
                        value={newBatchData.schedule}
                        onChange={(e) => setNewBatchData({ ...newBatchData, schedule: e.target.value })}
                    />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">Time Slots</label>
                            <button
                                type="button"
                                onClick={() => setNewBatchSlots([...newBatchSlots, { id: Date.now().toString(), label: "", capacity: "" }])}
                                className="text-sm text-brand-blue hover:underline"
                            >
                                + Add Slot
                            </button>
                        </div>
                        {newBatchSlots.map((slot, idx) => (
                            <div key={slot.id} className="grid grid-cols-[1fr_80px_40px] gap-2 items-end">
                                <Input
                                    label={`Label`}
                                    value={slot.label}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewBatchSlots(newBatchSlots.map(s => s.id === slot.id ? { ...s, label: val } : s));
                                    }}
                                    placeholder="Slot label"
                                    required
                                />
                                <Input
                                    label="Cap."
                                    type="number"
                                    value={slot.capacity || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewBatchSlots(newBatchSlots.map(s => s.id === slot.id ? { ...s, capacity: val } : s));
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setNewBatchSlots(newBatchSlots.filter(s => s.id !== slot.id))}
                                    className="h-10 px-2 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={batchSaving}>
                            {batchSaving ? "Saving..." : editingBatchId ? "Update Batch" : "Create Batch"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface LessonModalProps {
    courseId: string;
    batches: Batch[];
    newLessonData: any;
    setNewLessonData: (data: any) => void;
    lessonSaving: boolean;
    attachmentUploading: boolean;
    setAttachmentUploading: (v: boolean) => void;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
}

export function LessonModal({
    courseId,
    batches,
    newLessonData,
    setNewLessonData,
    lessonSaving,
    attachmentUploading,
    setAttachmentUploading,
    onClose,
    onSave
}: LessonModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900">Add New Lesson</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSave} className="p-6 space-y-4 overflow-y-auto">
                    <Input
                        label="Lesson Title"
                        value={newLessonData.title}
                        onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                        placeholder="e.g. Introduction"
                        required
                        autoFocus
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Lesson Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'video', label: 'Video', icon: PlayCircle },
                                { id: 'live_class', label: 'Live (Zoom)', icon: Video },
                                { id: 'speaking', label: 'Speaking', icon: Mic },
                                { id: 'writing', label: 'Writing', icon: PenTool },
                                { id: 'quiz', label: 'Quiz', icon: HelpCircle },
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setNewLessonData({ ...newLessonData, type: type.id as any })}
                                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all ${newLessonData.type === type.id
                                        ? "border-brand-blue bg-blue-50 text-brand-blue"
                                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                                        }`}
                                >
                                    <type.icon className="w-4 h-4" />
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {newLessonData.type === 'live_class' && (
                        <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="col-span-2 text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Zoom Meeting Configuration</div>
                            <Input
                                label="Start Time"
                                type="datetime-local"
                                value={newLessonData.startTime}
                                onChange={(e) => setNewLessonData({ ...newLessonData, startTime: e.target.value })}
                                required
                            />
                            <Input
                                label="Duration (mins)"
                                type="number"
                                value={newLessonData.duration}
                                onChange={(e) => setNewLessonData({ ...newLessonData, duration: e.target.value })}
                            />
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Available for Batches</label>
                                <div className="flex flex-wrap gap-2">
                                    {batches.map(b => (
                                        <label key={b.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newLessonData.batchIds.includes(b.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...newLessonData.batchIds, b.id]
                                                        : newLessonData.batchIds.filter((id: string) => id !== b.id);
                                                    setNewLessonData({ ...newLessonData, batchIds: ids });
                                                }}
                                            />
                                            {b.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700">Attachments</label>
                        <div className="flex flex-wrap gap-2">
                            {newLessonData.attachments.map((att: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded border border-gray-100 text-xs">
                                    <span className="truncate max-w-[100px]">{att.name}</span>
                                    <button type="button" onClick={() => setNewLessonData({ ...newLessonData, attachments: newLessonData.attachments.filter((_: any, i: number) => i !== idx) })} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                                </div>
                            ))}
                            <input
                                type="file"
                                id="modal-att-upload"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setAttachmentUploading(true);
                                    try {
                                        const url = await courseService.uploadImage(file, `courses/${courseId}/lessons/${Date.now()}_${file.name}`);
                                        setNewLessonData({ ...newLessonData, attachments: [...newLessonData.attachments, { name: file.name, url }] });
                                    } finally {
                                        setAttachmentUploading(false);
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={attachmentUploading}
                                onClick={() => document.getElementById('modal-att-upload')?.click()}
                            >
                                {attachmentUploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                                Add File
                            </Button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 shrink-0">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={lessonSaving}>
                            {lessonSaving ? "Saving..." : "Create Lesson"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface RecordingsModalProps {
    courseId: string;
    selectedBatch: Batch | null;
    newRecording: any;
    setNewRecording: (data: any) => void;
    recordingSaving: boolean;
    uploading: boolean;
    uploadProgress: number;
    setUploading: (v: boolean) => void;
    setUploadProgress: (v: number) => void;
    onClose: () => void;
    onSave: (e: React.FormEvent) => void;
    onDelete: (id: string) => void;
}

export function RecordingsModal({
    courseId,
    selectedBatch,
    newRecording,
    setNewRecording,
    recordingSaving,
    uploading,
    uploadProgress,
    setUploading,
    setUploadProgress,
    onClose,
    onSave,
    onDelete
}: RecordingsModalProps) {
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    if (!selectedBatch) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Batch Recordings</h3>
                        <p className="text-sm text-gray-500">{selectedBatch.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                        <h4 className="font-bold text-sm text-blue-900">Upload New Recording</h4>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-600 file:text-white"
                                    onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                />
                                <Button
                                    size="sm"
                                    disabled={!uploadFile || uploading}
                                    onClick={async () => {
                                        if (!uploadFile) return;
                                        setUploading(true);
                                        try {
                                            const videoObj = await bunnyService.createVideo(uploadFile.name);
                                            await bunnyService.uploadVideo(uploadFile, videoObj.guid, setUploadProgress);
                                            setNewRecording({
                                                ...newRecording,
                                                title: uploadFile.name.replace(/\.[^/.]+$/, ""),
                                                videoUrl: videoObj.guid // We store GUID for later reference
                                            });
                                            alert("Upload complete. Fill details and Save.");
                                        } finally {
                                            setUploading(false);
                                            setUploadProgress(0);
                                        }
                                    }}
                                >
                                    {uploading ? `${uploadProgress}%` : "Upload to Bunny"}
                                </Button>
                            </div>
                            {uploading && (
                                <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            )}
                        </div>

                        <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Recording Title"
                                value={newRecording.title}
                                onChange={e => setNewRecording({ ...newRecording, title: e.target.value })}
                                required
                            />
                            <Input
                                label="Bunny Video ID / URL"
                                value={newRecording.videoUrl}
                                onChange={e => setNewRecording({ ...newRecording, videoUrl: e.target.value })}
                                required
                            />
                            <Input
                                label="Date"
                                type="date"
                                value={newRecording.date}
                                onChange={e => setNewRecording({ ...newRecording, date: e.target.value })}
                                required
                            />
                            <Input
                                label="Duration (min)"
                                type="number"
                                value={newRecording.durationMinutes}
                                onChange={e => setNewRecording({ ...newRecording, durationMinutes: e.target.value })}
                            />
                            <div className="col-span-2 flex justify-end">
                                <Button type="submit" disabled={recordingSaving}>
                                    {recordingSaving ? "Adding..." : "Add to Batch"}
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-gray-900">Existing Recordings</h4>
                        {(selectedBatch.recordedClasses || []).length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No recordings yet.</p>
                        ) : (
                            (selectedBatch.recordedClasses || []).map((rec) => (
                                <div key={rec.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center">
                                            <PlayCircle size={16} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{rec.title}</p>
                                            <p className="text-xs text-gray-500">{rec.date} • {rec.durationMinutes}m</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDelete(rec.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
