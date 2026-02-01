"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Upload, CloudUpload, X, CheckCircle } from "lucide-react";
import { bunnyService } from "@/services/bunnyService";
import { courseService } from "@/services/courseService";

interface ManualUploadModalProps {
  isOpen: boolean;
  lessonId?: string;
  courseId?: string; // Needed to update the lesson in the correct course
  onClose: () => void;
  onSuccess: () => void;
}

export default function ManualUploadModal({ isOpen, lessonId, courseId, onClose, onSuccess }: ManualUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<"select" | "uploading" | "success">("select");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!courseId || !lessonId) {
      setError("Missing course or lesson information.");
      return;
    }
    
    setUploading(true);
    setStep("uploading");
    setError("");

    try {
      // 1. Create Video Object in Bunny.net
      const videoData = await bunnyService.createVideo(file.name.replace(/\.[^/.]+$/, ""));
      const videoId = videoData.guid;

      // 2. Upload the file content
      await bunnyService.uploadVideo(file, videoId, (percent) => {
        setProgress(Math.round(percent));
      });

      // 3. Update Firestore Lesson with Recording URL (using videoId)
      // Note: We'll store just the videoId or the full embed URL?
      // For now, let's store the videoId, but to be compatible with existing players, 
      // we might need a full URL. Let's assume the player knows how to handle Bunny IDs 
      // or we construct a URL.
      // Actually, let's just store the videoId in a new field `bunnyVideoId` 
      // and also `recordingUrl` for compatibility if needed.
      
      await courseService.updateLesson(courseId, lessonId, {
        recordingUrl: videoId, // Or construct full URL if needed
        bunnyVideoId: videoId,
        recordingStatus: "processed"
      });

      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed. Please check your settings and try again.");
      setStep("select");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Recording</h2>
        <p className="text-sm text-gray-500 mb-6">
          Manually upload a class recording to Bunny.net.
        </p>

        {step === "select" && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer relative">
              <input 
                type="file" 
                accept="video/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <CloudUpload size={48} className="text-purple-200 mb-4" />
              {file ? (
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-700">Click to browse or drag file here</p>
                  <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI up to 1GB</p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Start Upload
              </Button>
            </div>
          </div>
        )}

        {step === "uploading" && (
          <div className="py-8 text-center space-y-4">
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-100"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={276}
                  strokeDashoffset={276 - (276 * progress) / 100}
                  className="text-purple-600 transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-purple-700">
                {progress}%
              </div>
            </div>
            <p className="text-gray-600 font-medium">Uploading to Bunny.net...</p>
            <p className="text-xs text-gray-400">Please do not close this window.</p>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Upload Complete!</h3>
            <p className="text-gray-500">The recording has been attached to the class.</p>
          </div>
        )}
      </div>
    </div>
  );
}