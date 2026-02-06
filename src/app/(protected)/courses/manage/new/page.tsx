"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { courseService } from "@/services/courseService";
import { userService } from "@/services/userService";
import { UserData } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, ArrowLeft, Upload, Plus, Trash2, Calendar, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface TempBatch {
  id: string;
  name: string;
  startDate: string;
  imageFile: File | null;
  imagePreview: string;
}

export default function NewCoursePage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [lecturers, setLecturers] = useState<UserData[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    published: false,
    instructorId: "",
    endDate: ""
  });

  const [initialBatches, setInitialBatches] = useState<TempBatch[]>([]);

  useEffect(() => {
    fetchLecturers();
  }, []);

  const fetchLecturers = async () => {
    try {
      const data = await userService.getLecturers();
      setLecturers(data);
      // If user is a lecturer, auto-select them
      if (userData && (userData.role === "instructor" || userData.role === "lecturer")) {
        setFormData(prev => ({ ...prev, instructorId: userData.uid }));
      }
    } catch (error) {
      console.error("Error fetching lecturers:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddBatch = () => {
    setInitialBatches([
      ...initialBatches,
      {
        id: Date.now().toString(),
        name: "",
        startDate: "",
        imageFile: null,
        imagePreview: ""
      }
    ]);
  };

  const handleRemoveBatch = (id: string) => {
    setInitialBatches(initialBatches.filter(b => b.id !== id));
  };

  const handleBatchChange = (id: string, field: keyof TempBatch, value: any) => {
    setInitialBatches(initialBatches.map(b => 
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  const handleBatchImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleBatchChange(id, "imageFile", file);
      handleBatchChange(id, "imagePreview", URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    
    // Validate instructor selection
    if (!formData.instructorId) {
      alert("Please select a lecturer for the course.");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await courseService.uploadImage(imageFile, `courses/${Date.now()}_${imageFile.name}`);
      }

      // Find selected lecturer name
      const selectedLecturer = lecturers.find(l => l.uid === formData.instructorId);
      const instructorName = selectedLecturer ? selectedLecturer.name : userData.name;

      const courseId = await courseService.createCourse({
        title: formData.title,
        description: formData.description,
        price: Number(formData.price) || 0,
        published: formData.published,
        instructorId: formData.instructorId,
        instructorName: instructorName,
        image: imageUrl,
        endDate: formData.endDate
      });

      // Process Initial Batches
      if (initialBatches.length > 0) {
        for (const batch of initialBatches) {
          if (!batch.name || !batch.startDate) continue; // Skip incomplete batches

          let batchImageUrl = "";
          if (batch.imageFile) {
            // Upload batch image
            batchImageUrl = await courseService.uploadImage(
              batch.imageFile, 
              `courses/${courseId}/batches/${Date.now()}_${batch.imageFile.name}`
            );
          }

          await courseService.addBatch(courseId, {
            name: batch.name,
            startDate: batch.startDate,
            status: 'open',
            image: batchImageUrl
          });
        }
      }

      router.push("/courses/manage");
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/courses/manage">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Course Details Section */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Course Details</h2>
          
          {/* Image Upload */}
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
                <p className="mt-1 text-xs text-gray-500">Recommended size: 1280x720px (16:9)</p>
              </div>
            </div>
          </div>

          <Input
            label="Course Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. IELTS Academic Preparation"
            required
          />
          
          {/* Lecturer Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Lecturer</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.instructorId}
                onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all appearance-none"
                required
              >
                <option value="">Select a Lecturer</option>
                {lecturers.map((lecturer) => (
                  <option key={lecturer.uid} value={lecturer.uid}>
                    {lecturer.name} ({lecturer.email})
                  </option>
                ))}
              </select>
            </div>
            {lecturers.length === 0 && (
               <p className="text-xs text-amber-600 mt-1">No lecturers found. Please add a lecturer in the Admin portal.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all resize-none"
              placeholder="Describe what students will learn..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Price (LKR)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0 for free"
              min="0"
            />

            <Input
              label="Course End Date (Optional)"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div className="flex items-center h-full pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-5 h-5 text-brand-blue rounded focus:ring-brand-blue border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Publish immediately</span>
            </label>
          </div>
        </div>

        {/* Batches Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-lg font-semibold text-gray-900">Initial Batches (Optional)</h2>
            <Button type="button" onClick={handleAddBatch} variant="secondary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Batch
            </Button>
          </div>
          
          <div className="space-y-4">
            {initialBatches.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No batches added yet. You can add them later.</p>
              </div>
            )}

            {initialBatches.map((batch, index) => (
              <div key={batch.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative animate-in slide-in-from-top-2">
                <button
                  type="button"
                  onClick={() => handleRemoveBatch(batch.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr] gap-4 items-start">
                  {/* Batch Image */}
                  <div className="space-y-2">
                    <div className="w-24 h-24 bg-white rounded-lg border border-gray-200 overflow-hidden relative group">
                      {batch.imagePreview ? (
                        <Image src={batch.imagePreview} alt="Batch" fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300">
                          <Upload className="w-6 h-6" />
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="w-6 h-6 text-white" />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleBatchImageChange(batch.id, e)}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-center text-gray-500">Batch Image</p>
                  </div>

                  {/* Batch Details */}
                  <div className="space-y-4 col-span-1 md:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Batch Name"
                        value={batch.name}
                        onChange={(e) => handleBatchChange(batch.id, "name", e.target.value)}
                        placeholder="e.g. Intake 01 - 2026"
                        required
                      />
                      <Input
                        label="Start Date"
                        type="date"
                        value={batch.startDate}
                        onChange={(e) => handleBatchChange(batch.id, "startDate", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link href="/courses/manage">
            <Button type="button" variant="ghost">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="px-8">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Course & Batches...
              </>
            ) : (
              "Create Course"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
