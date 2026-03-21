"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, X, Calendar, Clock, Video, Users, Check, Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { courseService } from "@/services/courseService";
import { Course, Batch } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface ScheduleClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CourseSelection {
  courseId: string;
  batchIds: string[];
  timeSlotId?: string;
  batches: Batch[]; // Cached batches for this course
  fetchingBatches: boolean;
}

export default function ScheduleClassModal({ isOpen, onClose, onSuccess }: ScheduleClassModalProps) {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    duration: 60,
  });

  const [selections, setSelections] = useState<CourseSelection[]>([
    { courseId: "", batchIds: [], batches: [], fetchingBatches: false }
  ]);

  useEffect(() => {
    if (isOpen && userData) {
      fetchCourses();
    }
  }, [isOpen, userData?.uid, userData?.role]);

  const fetchCourses = async () => {
    try {
      const allCourses = await courseService.getAllCourses(); // Changed to getAllCourses as per original
      const filtered = allCourses.filter((c: Course) => {
        if (userData?.role === 'admin' || userData?.role === 'superadmin' || userData?.role === 'developer') return true;
        // Original logic for lecturer:
        if (userData?.role === 'lecturer') {
          return c.lecturerId === userData?.uid ||
                 c.instructorId === userData?.uid ||
                 (c.lecturerIds && c.lecturerIds.includes(userData.uid));
        }
        return false; // Default for other roles
      });
      setCourses(filtered);
    } catch (error) {
      console.error("Error fetching courses:", error);
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
        batchIds: [],
        batches: [],
        timeSlotId: ""
      };
      return updated;
    });
    if (courseId) { // Only fetch if a course is selected
      fetchBatchesForSelection(index, courseId);
    }
  };

  const toggleBatch = (index: number, batchId: string) => {
    setSelections((prev: CourseSelection[]) => {
      const updated = [...prev];
      if (!updated[index]) return prev; // Ensure the selection exists

      const currentBatchIds = updated[index].batchIds;
      if (currentBatchIds.includes(batchId)) {
        updated[index] = { ...updated[index], batchIds: currentBatchIds.filter((id: string) => id !== batchId) };
      } else {
        updated[index] = { ...updated[index], batchIds: [...currentBatchIds, batchId] };
      }
      return updated;
    });
  };

  const updateTimeSlot = (index: number, timeSlotId: string) => {
    setSelections((prev: CourseSelection[]) => {
      const updated = [...prev];
      if (updated[index]) { // Ensure the selection exists
        updated[index] = { ...updated[index], timeSlotId: timeSlotId };
      }
      return updated;
    });
  };

  const addSelection = () => {
    setSelections((prev: CourseSelection[]) => [...prev, { courseId: "", batchIds: [], batches: [], fetchingBatches: false }]);
  };

  const removeSelection = (index: number) => {
    setSelections((prev: CourseSelection[]) => {
        if (prev.length <= 1) return prev;
        return prev.filter((_: CourseSelection, i: number) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Filter to only valid selections
    const validSelections = selections.filter((s: CourseSelection) => s.courseId && s.batchIds.length > 0);

    if (validSelections.length === 0) {
        toast({
            title: "Selection missing",
            description: "Please select at least one course and batch.",
            variant: "error"
        });
        return;
    }

    setLoading(true);
    try {
      const startTime = new Date(`${formData.date}T${formData.time}`).toISOString();

      // 1. Create ONE Zoom Meeting for all courses
      const zoomRes = await fetch('/api/zoom/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formData.title,
          type: 2, // Scheduled
          startTime,
          duration: formData.duration,
          agenda: `Binded Course Session: ${validSelections.map((s: CourseSelection) => courses.find((c: Course) => c.id === s.courseId)?.title).join(', ')}`
        })
      });

      const zoomData = await zoomRes.json();
      if (!zoomRes.ok) throw new Error(zoomData.error || "Failed to create Zoom meeting");

      // 2. Create Lessons in EACH course
      const promises = validSelections.map((s: CourseSelection) => 
        courseService.addLesson(s.courseId, {
            title: formData.title,
            type: "live_class",
            content: "Live Zoom Class (Binded)",
            duration: formData.duration,
            startTime,
            zoomMeetingId: zoomData.id,
            zoomStartUrl: zoomData.start_url,
            zoomJoinUrl: zoomData.join_url,
            batchIds: s.batchIds,
            ...(s.timeSlotId ? { timeSlotId: s.timeSlotId } : {}),
            order: 999,
            published: true
        })
      );

      await Promise.all(promises);

      toast({ title: "Success", description: "Class scheduled successfully for all courses" });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Scheduling error:", error);
      toast({ title: "Error", description: error.message || "Failed to schedule class", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Live Class</h2>
            <p className="text-xs text-gray-500 mt-1">Select one or more courses to bind this class to.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          <form id="schedule-form" onSubmit={handleSubmit} className="space-y-6">
            {/* General Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Session Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Topic</label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Unit 5: Advanced Speaking Practice"
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mins</label>
                  <Input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Binded Courses Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                   <LinkIcon size={14} className="text-brand-blue" />
                   Courses & Batches (Binded)
                </h3>
              </div>

              <div className="space-y-4">
                {selections.map((sel, idx) => (
                  <div key={idx} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-4 relative animate-in slide-in-from-left-2 duration-300">
                    {selections.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeSelection(idx)}
                        className="absolute top-4 right-4 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-500">Pick Course {idx + 1}</label>
                      <select
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all text-gray-900"
                        value={sel.courseId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateCourseSelection(idx, e.target.value)}
                        required
                      >
                        <option value="" className="text-gray-500">-- Choose Course --</option>
                        {courses.map((c: Course) => (
                          <option key={c.id} value={c.id} className="text-gray-900">{c.title}</option>
                        ))}
                      </select>
                    </div>

                    {sel.courseId && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <label className="block text-xs font-bold text-gray-500">Select Batches for this course</label>
                        {sel.fetchingBatches ? (
                          <div className="text-xs text-gray-400 flex items-center gap-2 py-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Fetching batches...
                          </div>
                        ) : sel.batches.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {sel.batches.map((batch: Batch) => {
                              const isSelected = sel.batchIds.includes(batch.id);
                              return (
                                <button
                                  key={batch.id}
                                  type="button"
                                  onClick={() => toggleBatch(idx, batch.id)}
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-all ${isSelected
                                      ? "bg-blue-50 border-brand-blue/50 text-brand-blue"
                                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                    }`}
                                >
                                  <span className="truncate">{batch.name}</span>
                                  {isSelected && <Check size={14} className="shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No batches found.</p>
                        )}

                        {sel.batchIds.length === 1 && (
                          <div className="pt-2">
                            <label className="block text-xs font-bold text-gray-500 mb-2">Specific Time Slot (Optional)</label>
                            <select
                              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 outline-none"
                              value={sel.timeSlotId || ""}
                              onChange={e => {
                                const updated = [...selections];
                                updated[idx] = { ...updated[idx], timeSlotId: e.target.value };
                                setSelections(updated);
                              }}
                            >
                              <option value="">All Time Slots</option>
                              {sel.batches.find(b => b.id === sel.batchIds[0])?.timeSlots?.map(slot => (
                                <option key={slot.id} value={slot.id}>{slot.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSelection}
                  className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 hover:text-brand-blue hover:border-brand-blue/50 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Add Another Course (Binded)</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <Button variant="ghost" onClick={onClose} type="button" className="font-bold text-gray-500">Cancel</Button>
          <Button
            type="submit"
            form="schedule-form"
            disabled={loading}
            className="bg-brand-blue hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Schedule Binded Class"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
