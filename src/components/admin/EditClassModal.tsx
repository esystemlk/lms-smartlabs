"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, X } from "lucide-react";
import { courseService } from "@/services/courseService";
import { Lesson } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

interface EditClassModalProps {
  lesson: Lesson | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Format an ISO/Date into the local yyyy-MM-dd and HH:mm the inputs expect.
function toLocalParts(startTime?: string) {
  if (!startTime) return { date: "", time: "" };
  const d = new Date(startTime);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function EditClassModal({ lesson, onClose, onSuccess }: EditClassModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", duration: 60 });

  useEffect(() => {
    if (!lesson) return;
    const { date, time } = toLocalParts(lesson.startTime as string | undefined);
    setForm({
      title: lesson.title || "",
      date,
      time,
      duration: (lesson.duration as number) || 60,
    });
  }, [lesson]);

  if (!lesson) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!form.title || !form.date || !form.time) {
      toast("Please fill in the topic, date and time.", "error");
      return;
    }
    const startTime = new Date(`${form.date}T${form.time}`);
    if (isNaN(startTime.getTime())) {
      toast("Invalid date/time.", "error");
      return;
    }
    const startIso = startTime.toISOString();

    setSaving(true);
    try {
      // 1. Update the lesson in Firestore.
      await courseService.updateLesson(lesson.courseId, lesson.id, {
        title: form.title,
        startTime: startIso,
        duration: form.duration,
      });

      // 2. Keep the Zoom meeting in sync (best-effort).
      if ((lesson as any).zoomMeetingId) {
        try {
          const res = await fetch("/api/zoom/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              meetingId: (lesson as any).zoomMeetingId,
              topic: form.title,
              startTime: startIso,
              duration: form.duration,
            }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast(`Class saved, but Zoom wasn't updated: ${d.error || res.status}`, "error");
          }
        } catch {
          toast("Class saved, but the Zoom meeting couldn't be updated.", "error");
        }
      }

      toast("Class updated", "success");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Edit class error:", error);
      toast(error.message || "Failed to update class", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Scheduled Class</h2>
            <p className="text-xs text-gray-500 mt-1">Rename or reschedule this session.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Topic</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="h-11 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required className="h-11 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes)</label>
            <Input
              type="number"
              min={15}
              step={15}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
              required
              className="h-11 rounded-xl"
            />
          </div>

          {(lesson as any).zoomMeetingId && (
            <p className="text-xs text-gray-400">The linked Zoom meeting will be updated to match.</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose} className="font-bold text-gray-500">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-brand-blue hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-xl">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
