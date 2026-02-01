"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, X, Calendar, Clock, Video, Users, Check } from "lucide-react";
import { courseService } from "@/services/courseService";
import { Course, Batch } from "@/lib/types";

interface ScheduleClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleClassModal({ isOpen, onClose, onSuccess }: ScheduleClassModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBatches, setFetchingBatches] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    courseId: "",
    batchIds: [] as string[],
    date: "",
    time: "",
    duration: 60,
  });

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.courseId) {
      fetchBatches(formData.courseId);
    } else {
      setBatches([]);
      setFormData(prev => ({ ...prev, batchIds: [] }));
    }
  }, [formData.courseId]);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchBatches = async (courseId: string) => {
    setFetchingBatches(true);
    try {
      const data = await courseService.getBatches(courseId);
      setBatches(data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setFetchingBatches(false);
    }
  };

  const toggleBatch = (batchId: string) => {
    setFormData(prev => {
      const exists = prev.batchIds.includes(batchId);
      if (exists) {
        return { ...prev, batchIds: prev.batchIds.filter(id => id !== batchId) };
      } else {
        return { ...prev, batchIds: [...prev.batchIds, batchId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || formData.batchIds.length === 0) {
      alert("Please select a course and at least one batch.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Zoom Meeting
      const startTime = new Date(`${formData.date}T${formData.time}`).toISOString();
      
      const zoomRes = await fetch('/api/zoom/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formData.title,
          type: 2, // Scheduled
          startTime,
          duration: formData.duration,
          agenda: `Course: ${courses.find(c => c.id === formData.courseId)?.title}`
        })
      });

      const zoomData = await zoomRes.json();
      if (!zoomRes.ok) throw new Error(zoomData.error || "Failed to create Zoom meeting");

      // 2. Create Lesson in Firestore
      await courseService.addLesson(formData.courseId, {
        title: formData.title,
        type: "live_class",
        content: "Live Zoom Class",
        duration: formData.duration,
        startTime,
        zoomMeetingId: zoomData.id,
        zoomStartUrl: zoomData.start_url,
        zoomJoinUrl: zoomData.join_url,
        batchIds: formData.batchIds,
        order: 999, // Append to end
        published: true
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Scheduling error:", error);
      alert(error.message || "Failed to schedule class");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Schedule New Class</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="schedule-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Topic</label>
              <Input
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Advanced React Patterns"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <Input
                type="number"
                min="15"
                step="15"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
              <select
                className="w-full rounded-xl border-gray-200 focus:border-brand-blue focus:ring-brand-blue"
                value={formData.courseId}
                onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                required
              >
                <option value="">-- Choose Course --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {formData.courseId && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select Batches</label>
                {fetchingBatches ? (
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Loading batches...
                  </div>
                ) : batches.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {batches.map(batch => {
                      const isSelected = formData.batchIds.includes(batch.id);
                      return (
                        <button
                          key={batch.id}
                          type="button"
                          onClick={() => toggleBatch(batch.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <span className="truncate">{batch.name}</span>
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No batches found for this course.</p>
                )}
                <p className="text-xs text-gray-500">Only students in selected batches will see this class.</p>
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button 
            type="submit" 
            form="schedule-form"
            disabled={loading || !formData.courseId || formData.batchIds.length === 0}
            className="bg-brand-blue hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule Class"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
