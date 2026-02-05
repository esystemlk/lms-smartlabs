"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { courseService } from "@/services/courseService";
import { userService } from "@/services/userService";
import { bunnyService } from "@/services/bunnyService";
import { Course, Lesson, Batch, UserData } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Loader2, 
  ArrowLeft, 
  Upload, 
  Save, 
  Plus, 
  GripVertical, 
  Pencil, 
  Trash2,
  Video,
  FileText,
  Users,
  Calendar,
  X,
  Mic,
  Headphones,
  PenTool,
  BookOpen,
  PlayCircle,
  HelpCircle,
  User,
  Clock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { QuizBuilder } from "@/components/quiz/QuizBuilder";

export default function EditCoursePage() {
  const { userData } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "curriculum" | "batches" | "quiz">("settings");
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [lecturers, setLecturers] = useState<UserData[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]); // For prerequisites
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    priceLKR: "",
    priceUSD: "",
    published: false,
    level: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    category: "",
    tags: "",
    includesCertificate: false,
    resourceAvailabilityMonths: "3",
    instructorId: "",
    prerequisites: [] as string[],
    learningOutcomes: [] as string[]
  });
  const [learningOutcomeInput, setLearningOutcomeInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Batch Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [newBatchData, setNewBatchData] = useState({
    name: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    maxStudents: "",
    schedule: "",
    status: "open" as "open" | "closed" | "ongoing" | "completed",
    imageFile: null as File | null,
    imagePreview: "" as string
  });
  const [batchSaving, setBatchSaving] = useState(false);

  // Recording Modal State
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [newRecording, setNewRecording] = useState({
    title: "",
    videoUrl: "",
    date: new Date().toISOString().split('T')[0],
    durationMinutes: ""
  });
  const [recordingSaving, setRecordingSaving] = useState(false);

  // Bunny Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Lesson Modal State
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [newLessonData, setNewLessonData] = useState({
    title: "",
    type: "video" as "video" | "quiz" | "speaking" | "writing" | "reading" | "listening" | "live_class",
    startTime: "",
    duration: "60",
    batchIds: [] as string[], // Selected batch IDs for live classes
    attachments: [] as { name: string; url: string }[]
  });
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [lessonSaving, setLessonSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [courseData, lessonsData, batchesData, allCoursesData] = await Promise.all([
        courseService.getCourse(courseId),
        courseService.getLessons(courseId),
        courseService.getBatches(courseId),
        courseService.getAllCourses()
      ]);
      
      if (courseData) {
        setCourse(courseData);
        setFormData({
          title: courseData.title,
          description: courseData.description,
          price: courseData.price?.toString() || "",
          priceLKR: courseData.priceLKR?.toString() || courseData.price?.toString() || "",
          priceUSD: courseData.priceUSD?.toString() || "",
          published: courseData.published,
          level: courseData.level || "Beginner",
          category: courseData.category || "",
          tags: courseData.tags?.join(", ") || "",
          includesCertificate: courseData.includesCertificate || false,
          resourceAvailabilityMonths: courseData.resourceAvailabilityMonths?.toString() || "3",
          instructorId: courseData.instructorId,
          prerequisites: courseData.prerequisites || [],
          learningOutcomes: courseData.learningOutcomes || [] // Assuming this exists in Course type or will act as fallback
        });
        if (courseData.image) {
          setImagePreview(courseData.image);
        }
      }
      setLessons(lessonsData);
      setBatches(batchesData);
      setAllCourses(allCoursesData.filter(c => c.id !== courseId)); // Exclude current course
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = course?.image;
      if (imageFile) {
        imageUrl = await courseService.uploadImage(imageFile, `courses/${courseId}_${Date.now()}`);
      }

      await courseService.updateCourse(courseId, {
        title: formData.title,
        description: formData.description,
        price: Number(formData.priceLKR) || Number(formData.price) || 0,
        priceLKR: Number(formData.priceLKR) || 0,
        priceUSD: Number(formData.priceUSD) || 0,
        published: formData.published,
        image: imageUrl,
        level: formData.level,
        category: formData.category,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        includesCertificate: formData.includesCertificate,
        resourceAvailabilityMonths: Number(formData.resourceAvailabilityMonths) || 3,
        prerequisites: formData.prerequisites,
        learningOutcomes: formData.learningOutcomes
      });

      alert("Course updated successfully!");
    } catch (error) {
      console.error("Error updating course:", error);
      alert("Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonData.title) return;

    setLessonSaving(true);
    try {
      let zoomDetails = {};

      if (newLessonData.type === 'live_class') {
        // Create Zoom Meeting
        const response = await fetch('/api/zoom/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: newLessonData.title,
            startTime: newLessonData.startTime,
            duration: parseInt(newLessonData.duration) || 60
          })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        zoomDetails = {
            zoomMeetingId: data.id,
            zoomStartUrl: data.start_url,
            zoomJoinUrl: data.join_url,
            zoomPassword: data.password,
            startTime: newLessonData.startTime,
            duration: parseInt(newLessonData.duration) || 60,
            batchIds: newLessonData.batchIds
          };
        }

        const newLesson = {
          title: newLessonData.title,
          type: newLessonData.type,
          order: lessons.length + 1,
          published: false,
          attachments: newLessonData.attachments,
          ...zoomDetails
        };

        await courseService.addLesson(courseId, newLesson);
        
        // Reset and refresh
        setNewLessonData({ 
          title: "", 
          type: "video", 
          startTime: "", 
          duration: "60",
          batchIds: [],
          attachments: []
        });
        setShowLessonModal(false);
        fetchData(); 
      } catch (error) {
      console.error("Error adding lesson:", error);
      alert("Failed to add lesson: " + (error as any).message);
    } finally {
      setLessonSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await courseService.deleteLesson(courseId, lessonId);
      setLessons(lessons.filter(l => l.id !== lessonId));
    } catch (error) {
      console.error("Error deleting lesson:", error);
    }
  };

  const handleBatchImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewBatchData({
        ...newBatchData,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchData.name || !newBatchData.startDate) return;

    // Validation
    if (newBatchData.endDate && newBatchData.endDate < newBatchData.startDate) {
      alert("End date cannot be before start date");
      return;
    }

    if (newBatchData.maxStudents) {
      const max = Number(newBatchData.maxStudents);
      if (max < 0) {
        alert("Max students cannot be negative");
        return;
      }
      
      if (editingBatchId) {
        const currentBatch = batches.find(b => b.id === editingBatchId);
        if (currentBatch && max < currentBatch.enrolledCount) {
          alert(`Max students cannot be less than current enrollment (${currentBatch.enrolledCount})`);
          return;
        }
      }
    }

    setBatchSaving(true);
    try {
      let batchImageUrl = newBatchData.imagePreview; // Default to existing preview (which might be URL)

      if (newBatchData.imageFile) {
        batchImageUrl = await courseService.uploadImage(
          newBatchData.imageFile, 
          `courses/${courseId}/batches/${Date.now()}_${newBatchData.imageFile.name}`
        );
      }

      const batchPayload = {
        name: newBatchData.name,
        startDate: newBatchData.startDate,
        endDate: newBatchData.endDate,
        maxStudents: newBatchData.maxStudents ? Number(newBatchData.maxStudents) : undefined,
        schedule: newBatchData.schedule,
        status: newBatchData.status,
        image: batchImageUrl
      };

      if (editingBatchId) {
        // Update existing batch
        await courseService.updateBatch(courseId, editingBatchId, batchPayload);
        alert("Batch updated successfully!");
      } else {
        // Create new batch
        await courseService.addBatch(courseId, {
          ...batchPayload,
          enrolledCount: 0
        });
      }

      // Refresh batches
      const updatedBatches = await courseService.getBatches(courseId);
      setBatches(updatedBatches);
      
      // Reset and close
      handleCloseBatchModal();
    } catch (error) {
      console.error("Error saving batch:", error);
      alert("Failed to save batch");
    } finally {
      setBatchSaving(false);
    }
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatchId(batch.id);
    setNewBatchData({
      name: batch.name,
      startDate: batch.startDate,
      endDate: batch.endDate || "",
      maxStudents: batch.maxStudents?.toString() || "",
      schedule: batch.schedule || "",
      status: batch.status,
      imageFile: null,
      imagePreview: batch.image || ""
    });
    setShowBatchModal(true);
  };

  const handleCloseBatchModal = () => {
    setShowBatchModal(false);
    setEditingBatchId(null);
    setNewBatchData({
      name: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      maxStudents: "",
      schedule: "",
      status: 'open',
      imageFile: null,
      imagePreview: ""
    });
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    try {
      await courseService.deleteBatch(courseId, batchId);
      setBatches(batches.filter(b => b.id !== batchId));
    } catch (error) {
      console.error("Error deleting batch:", error);
    }
  };

  const toggleBatchStatus = async (batch: Batch) => {
    const newStatus = batch.status === 'open' ? 'closed' : 'open';
    try {
      await courseService.updateBatch(courseId, batch.id, { status: newStatus });
      setBatches(batches.map(b => b.id === batch.id ? { ...b, status: newStatus } : b));
    } catch (error) {
      console.error("Error updating batch status:", error);
    }
  };

  const handleSaveRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    setRecordingSaving(true);
    try {
      // Create a recording object
      const recordingData = {
        title: newRecording.title,
        videoUrl: newRecording.videoUrl,
        date: newRecording.date,
        durationMinutes: parseInt(newRecording.durationMinutes) || 0,
        batchId: selectedBatch.id,
        courseId: courseId
      };

      // Add to Firestore
      await courseService.addRecording(courseId, selectedBatch.id, recordingData);
      
      // Update local state if we had a way to fetch recordings, 
      // but for now we'll just reset the form and show success
      setNewRecording({
        title: "",
        videoUrl: "",
        date: new Date().toISOString().split('T')[0],
        durationMinutes: ""
      });
      
      alert("Recording added successfully!");
    } catch (error) {
      console.error("Error adding recording:", error);
      alert("Failed to add recording");
    } finally {
      setRecordingSaving(false);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (!selectedBatch) return;
    if (!confirm("Are you sure you want to delete this recording?")) return;

    try {
      await courseService.removeRecordedClassFromBatch(courseId, selectedBatch.id, recordingId);
      
      // Update local state
      const updatedRecordings = (selectedBatch.recordedClasses || []).filter(r => r.id !== recordingId);
      setSelectedBatch({
        ...selectedBatch,
        recordedClasses: updatedRecordings
      });
      
      // Also update the batch in the batches list
      setBatches(batches.map(b => 
        b.id === selectedBatch.id 
          ? { ...b, recordedClasses: updatedRecordings }
          : b
      ));

    } catch (error) {
      console.error("Error deleting recording:", error);
      alert("Failed to delete recording");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-12">Course not found</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/courses/manage">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-500 text-sm">Manage course content and settings</p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === "curriculum" && (
            <Button onClick={() => setShowLessonModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lesson
            </Button>
          )}
          {activeTab === "batches" && (
            <Button onClick={() => setShowBatchModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Batch
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-4 md:gap-6 min-w-max px-1">
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-2 md:pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`pb-2 md:pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "curriculum"
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Curriculum
          </button>
          <button
            onClick={() => setActiveTab("batches")}
            className={`pb-2 md:pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "batches"
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Batches
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`pb-2 md:pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "quiz"
                ? "border-brand-blue text-brand-blue"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Create Quiz
          </button>
        </div>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <form onSubmit={handleUpdateCourse} className="max-w-2xl bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm border border-gray-100 space-y-4 md:space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Course Cover Image</label>
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                {imagePreview ? (
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Upload className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                />
              </div>
            </div>
          </div>

          <Input
            label="Course Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Lecturer</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.instructorId}
                onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all appearance-none"
              >
                <option value="">Select a Lecturer</option>
                {lecturers.map((lecturer) => (
                  <option key={lecturer.uid} value={lecturer.uid}>
                    {lecturer.name} ({lecturer.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                className="w-full rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <Input
              label="Category"
              placeholder="e.g. Academic, General, Spoken English"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <Input
            label="Tags (comma separated)"
            placeholder="e.g. ielts, pte, grammar, vocabulary"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Prerequisites</label>
            <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 max-h-40 overflow-y-auto space-y-2">
              {allCourses.length > 0 ? allCourses.map(c => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                  <input
                    type="checkbox"
                    checked={formData.prerequisites.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, prerequisites: [...formData.prerequisites, c.id] });
                      } else {
                        setFormData({ ...formData, prerequisites: formData.prerequisites.filter(id => id !== c.id) });
                      }
                    }}
                    className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <span className="text-sm text-gray-700">{c.title}</span>
                </label>
              )) : (
                <p className="text-sm text-gray-500 italic">No other courses available.</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Learning Outcomes</label>
            <div className="flex gap-2">
              <Input
                value={learningOutcomeInput}
                onChange={(e) => setLearningOutcomeInput(e.target.value)}
                placeholder="What will students learn?"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (learningOutcomeInput.trim()) {
                      setFormData({ 
                        ...formData, 
                        learningOutcomes: [...formData.learningOutcomes, learningOutcomeInput.trim()] 
                      });
                      setLearningOutcomeInput("");
                    }
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={() => {
                  if (learningOutcomeInput.trim()) {
                    setFormData({ 
                      ...formData, 
                      learningOutcomes: [...formData.learningOutcomes, learningOutcomeInput.trim()] 
                    });
                    setLearningOutcomeInput("");
                  }
                }}
              >
                Add
              </Button>
            </div>
            <div className="space-y-2 mt-2">
              {formData.learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-700">• {outcome}</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      learningOutcomes: formData.learningOutcomes.filter((_, i) => i !== idx) 
                    })}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Price (LKR)"
              type="number"
              value={formData.priceLKR}
              onChange={(e) => setFormData({ ...formData, priceLKR: e.target.value })}
              placeholder="0.00"
            />

            <Input
              label="Price (USD)"
              type="number"
              value={formData.priceUSD}
              onChange={(e) => setFormData({ ...formData, priceUSD: e.target.value })}
              placeholder="0.00"
            />

            <Input
              label="Resource Access (Months)"
              type="number"
              value={formData.resourceAvailabilityMonths}
              onChange={(e) => setFormData({ ...formData, resourceAvailabilityMonths: e.target.value })}
              placeholder="e.g. 3"
              min="1"
            />
          </div>
            
          <div className="flex flex-col justify-center gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Published</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includesCertificate}
                  onChange={(e) => setFormData({ ...formData, includesCertificate: e.target.checked })}
                  className="w-4 h-4 text-brand-blue rounded focus:ring-brand-blue border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Includes Certificate</span>
              </label>
            </div>

          <div className="pt-4 flex justify-end">
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
      )}

      {/* Curriculum Tab */}
      {activeTab === "curriculum" && (
        <div className="space-y-4">
          {lessons.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No lessons yet</h3>
              <p className="text-gray-500 mb-4">Start building your curriculum by adding a lesson.</p>
              <Button onClick={() => setShowLessonModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Lesson
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {lessons.map((lesson, index) => (
                <div 
                  key={lesson.id}
                  className="group flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-0 border-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-gray-400 cursor-move">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="w-8 h-8 bg-blue-100 text-brand-blue rounded-lg flex items-center justify-center font-medium text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {lesson.type === 'video' && <Video className="w-3 h-3" />}
                        {lesson.type === 'speaking' && <Mic className="w-3 h-3" />}
                        {lesson.type === 'listening' && <Headphones className="w-3 h-3" />}
                        {lesson.type === 'reading' && <BookOpen className="w-3 h-3" />}
                        {lesson.type === 'writing' && <PenTool className="w-3 h-3" />}
                        {lesson.type === 'quiz' && <HelpCircle className="w-3 h-3" />}
                        {!lesson.type && <Video className="w-3 h-3" />} {/* Fallback */}
                        
                        <span>{lesson.published ? "Published" : "Draft"}</span>
                        {lesson.type && <span className="capitalize">• {lesson.type}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/courses/manage/${courseId}/lessons/${lesson.id}`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDeleteLesson(lesson.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Batches Tab */}
      {activeTab === "batches" && (
        <div className="space-y-4">
          {batches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No batches yet</h3>
              <p className="text-gray-500 mb-4">Create a batch to start enrolling students.</p>
              <Button onClick={() => setShowBatchModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Batch
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.map((batch) => (
                <div key={batch.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4">
                  {/* Batch Image */}
                  <div className="w-20 h-20 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {batch.image ? (
                      <Image src={batch.image} alt={batch.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <Users className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{batch.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>Starts: {batch.startDate}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        batch.status === 'open' 
                          ? "bg-green-100 text-green-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {batch.status === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{batch.enrolledCount}</span>
                        <span className="text-gray-500"> Students</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setShowRecordingsModal(true);
                          }}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Recordings
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditBatch(batch)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleBatchStatus(batch)}
                        >
                          {batch.status === 'open' ? 'Close' : 'Open'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteBatch(batch.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === "quiz" && (
        <QuizBuilder 
          courseId={courseId} 
          onSuccess={() => {
            alert("Quiz created successfully!");
            setActiveTab("curriculum");
          }} 
        />
      )}

      {/* Batch Modal Overlay */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingBatchId ? "Edit Batch" : "Add New Batch"}</h3>
              <button 
                onClick={handleCloseBatchModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBatch} className="p-6 space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Batch Image (Optional)</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    {newBatchData.imagePreview ? (
                      <Image src={newBatchData.imagePreview} alt="Preview" fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Upload className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBatchImageChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
                    />
                  </div>
                </div>
              </div>

              <Input
                label="Batch Name"
                placeholder="e.g. Intake 01 - 2026"
                value={newBatchData.name}
                onChange={(e) => setNewBatchData({...newBatchData, name: e.target.value})}
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={newBatchData.startDate}
                  onChange={(e) => setNewBatchData({...newBatchData, startDate: e.target.value})}
                  required
                />
                <Input
                  label="End Date"
                  type="date"
                  value={newBatchData.endDate}
                  onChange={(e) => setNewBatchData({...newBatchData, endDate: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Max Students"
                  type="number"
                  placeholder="Optional"
                  value={newBatchData.maxStudents}
                  onChange={(e) => setNewBatchData({...newBatchData, maxStudents: e.target.value})}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={newBatchData.status}
                    onChange={(e) => setNewBatchData({...newBatchData, status: e.target.value as any})}
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
                onChange={(e) => setNewBatchData({...newBatchData, schedule: e.target.value})}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={handleCloseBatchModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={batchSaving}>
                  {batchSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingBatchId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingBatchId ? "Update Batch" : "Create Batch"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Creation Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Add New Lesson</h3>
              <button 
                onClick={() => setShowLessonModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddLesson} className="p-6 space-y-4">
              <Input
                label="Lesson Title"
                value={newLessonData.title}
                onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                placeholder="e.g. Introduction to Speaking Task 1"
                required
                autoFocus
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Lesson Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'video', label: 'Video Lesson', icon: PlayCircle },
                    { id: 'live_class', label: 'Live Class (Zoom)', icon: Video },
                    { id: 'speaking', label: 'Speaking', icon: Mic },
                    { id: 'writing', label: 'Writing', icon: PenTool },
                    { id: 'reading', label: 'Reading', icon: BookOpen },
                    { id: 'listening', label: 'Listening', icon: Headphones },
                    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setNewLessonData({ ...newLessonData, type: type.id as any })}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                        newLessonData.type === type.id
                          ? "border-brand-blue bg-blue-50 text-brand-blue"
                          : "border-gray-200 hover:border-brand-blue/50 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {newLessonData.type === 'live_class' && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="col-span-2">
                    <p className="text-xs text-blue-600 mb-2 font-medium flex items-center gap-2">
                      <Video size={14} />
                      Zoom Meeting Details
                    </p>
                  </div>
                  <Input
                    label="Start Time"
                    type="datetime-local"
                    value={newLessonData.startTime}
                    onChange={(e) => setNewLessonData({ ...newLessonData, startTime: e.target.value })}
                    required
                  />
                  <Input
                    label="Duration (minutes)"
                    type="number"
                    value={newLessonData.duration}
                    onChange={(e) => setNewLessonData({ ...newLessonData, duration: e.target.value })}
                    required
                  />
                  
                  <div className="col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Select Batches (Optional)</label>
                    <p className="text-xs text-gray-500 mb-2">If selected, only students in these batches will see this class.</p>
                    {batches.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-white">
                        {batches.map(batch => (
                          <label key={batch.id} className="flex items-center gap-2 text-sm p-1 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newLessonData.batchIds.includes(batch.id)}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setNewLessonData(prev => ({
                                  ...prev,
                                  batchIds: isChecked
                                    ? [...prev.batchIds, batch.id]
                                    : prev.batchIds.filter(id => id !== batch.id)
                                }));
                              }}
                              className="w-4 h-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue"
                            />
                            <span className="text-gray-900 font-medium">{batch.name}</span>
                            <span className="text-xs text-gray-500">({batch.startDate})</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No batches created yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700">Lesson Resources (PDF, Zip, etc.)</label>
                
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="attachment-upload"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setAttachmentUploading(true);
                      try {
                        const url = await courseService.uploadImage(file, `courses/${courseId}/lessons/${Date.now()}_${file.name}`);
                        setNewLessonData(prev => ({
                          ...prev,
                          attachments: [...prev.attachments, { name: file.name, url }]
                        }));
                      } catch (error) {
                        console.error("Upload failed:", error);
                        alert("Failed to upload attachment");
                      } finally {
                        setAttachmentUploading(false);
                        // Reset input
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={attachmentUploading}
                    onClick={() => document.getElementById('attachment-upload')?.click()}
                  >
                    {attachmentUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload Resource
                  </Button>
                </div>

                {newLessonData.attachments.length > 0 && (
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {newLessonData.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200">
                        <span className="truncate flex-1 pr-2">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setNewLessonData(prev => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== idx)
                          }))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowLessonModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={lessonSaving}>
                  {lessonSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Lesson"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recordings Modal */}
      {showRecordingsModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Manage Recordings</h3>
                <p className="text-sm text-gray-500">{selectedBatch.name}</p>
              </div>
              <button 
                onClick={() => setShowRecordingsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Add New Recording Form */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                <h4 className="font-semibold text-sm text-gray-900">Add New Recording</h4>
                
                {/* Upload Section */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Upload size={16} />
                    Upload from Device (Bunny.net)
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      accept="video/*"
                      onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                      className="text-sm flex-1"
                    />
                    <Button 
                      size="sm" 
                      disabled={!uploadFile || uploading}
                      onClick={async () => {
                        if (!uploadFile) return;
                        setUploading(true);
                        try {
                           // 1. Create Video
                           const videoObj = await bunnyService.createVideo(uploadFile.name);
                           // 2. Upload
                           await bunnyService.uploadVideo(uploadFile, videoObj.guid, setUploadProgress);
                           // 3. Auto-fill form
                           setNewRecording(prev => ({
                             ...prev,
                             title: uploadFile.name.replace(/\.[^/.]+$/, ""),
                             videoUrl: `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${videoObj.guid}`, // Construct or fetch embed URL
                             bunnyVideoId: videoObj.guid
                           }));
                           alert("Upload complete! Please verify details and click 'Add Recording'.");
                        } catch (e) {
                          console.error(e);
                          alert("Upload failed");
                        } finally {
                          setUploading(false);
                          setUploadProgress(0);
                        }
                      }}
                    >
                      {uploading ? `${uploadProgress}%` : "Upload"}
                    </Button>
                  </div>
                  {uploading && (
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>

                <form onSubmit={handleSaveRecording} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Title"
                      placeholder="e.g. Week 1 - Introduction"
                      value={newRecording.title}
                      onChange={(e) => setNewRecording({...newRecording, title: e.target.value})}
                      required
                    />
                    <Input
                      label="Video URL / Embed Link"
                      placeholder="https://..."
                      value={newRecording.videoUrl}
                      onChange={(e) => setNewRecording({...newRecording, videoUrl: e.target.value})}
                      required
                    />
                    <Input
                      label="Date"
                      type="date"
                      value={newRecording.date}
                      onChange={(e) => setNewRecording({...newRecording, date: e.target.value})}
                      required
                    />
                    <Input
                      label="Duration (mins)"
                      type="number"
                      placeholder="e.g. 60"
                      value={newRecording.durationMinutes}
                      onChange={(e) => setNewRecording({...newRecording, durationMinutes: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={recordingSaving}>
                      {recordingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Add Recording
                    </Button>
                  </div>
                </form>
              </div>

              {/* Recordings List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">Existing Recordings</h4>
                {!selectedBatch.recordedClasses?.length ? (
                  <p className="text-sm text-gray-500 italic">No recordings added yet.</p>
                ) : (
                  selectedBatch.recordedClasses.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-blue-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center">
                          <PlayCircle size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{rec.title}</p>
                          <p className="text-xs text-gray-500">{new Date(rec.date).toLocaleDateString()} • {rec.durationMinutes} mins</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteRecording(rec.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
