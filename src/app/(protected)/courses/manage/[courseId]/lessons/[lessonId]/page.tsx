"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { courseService } from "@/services/courseService";
import { Lesson } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function EditLessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    videoUrl: "",
    published: false,
    order: 0
  });

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const lessons = await courseService.getLessons(courseId);
        const currentLesson = lessons.find(l => l.id === lessonId);
        if (currentLesson) {
          setLesson(currentLesson);
          setFormData({
            title: currentLesson.title,
            content: currentLesson.content || "",
            videoUrl: currentLesson.videoUrl || "",
            published: currentLesson.published,
            order: currentLesson.order
          });
        }
      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && lessonId) {
      fetchLesson();
    }
  }, [courseId, lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await courseService.updateLesson(courseId, lessonId, {
        title: formData.title,
        content: formData.content,
        videoUrl: formData.videoUrl,
        published: formData.published,
        order: Number(formData.order)
      });
      alert("Lesson updated successfully!");
      router.push(`/courses/manage/${courseId}`);
    } catch (error) {
      console.error("Error updating lesson:", error);
      alert("Failed to update lesson");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!lesson) {
    return <div className="text-center py-12">Lesson not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href={`/courses/manage/${courseId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Lesson</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <Input
          label="Lesson Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Video URL</label>
          <Input
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            placeholder="https://..."
          />
          <p className="text-xs text-gray-500">Direct link to mp4 or supported video format</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Content / Notes</label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={8}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            placeholder="Enter lesson content, notes, or instructions..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Sort Order"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
          />
          
          <div className="flex items-center h-full pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Published</span>
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Link href={`/courses/manage/${courseId}`}>
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
