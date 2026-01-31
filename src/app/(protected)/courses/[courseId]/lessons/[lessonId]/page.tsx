"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { 
  ChevronLeft, 
  Download, 
  FileText, 
  CheckCircle, 
  PlayCircle, 
  Menu, 
  Loader2, 
  Circle,
  Maximize2,
  Minimize2,
  PictureInPicture2,
  Lightbulb,
  LightbulbOff
} from "lucide-react";
import { clsx } from "clsx";
import { courseService } from "@/services/courseService";
import { Lesson } from "@/lib/types";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  
  const [showSidebar, setShowSidebar] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFocusMode, setIsFocusMode] = useState(false); // Local focus mode state for now

  // Handle PiP Toggle
  const togglePiP = async () => {
    if (!videoRef.current) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await videoRef.current.requestPictureInPicture();
    }
  };

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const data = await courseService.getLessons(courseId);
        setLessons(data);
      } catch (error) {
        console.error("Error fetching lessons:", error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchLessons();
    }
  }, [courseId]);

  const currentLesson = lessons.find(l => l.id === lessonId);

  // If loading, show spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.20))]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  // If lesson not found after loading
  if (!currentLesson && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-theme(spacing.20))] gap-4">
        <p className="text-gray-500">Lesson not found.</p>
        <Link href={`/courses/${courseId}`}>
          <Button variant="outline">Back to Course</Button>
        </Link>
      </div>
    );
  }

  // This should not happen if logic is correct, but for type safety
  if (!currentLesson) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] md:h-[calc(100vh-theme(spacing.10))]">
      {/* Mobile Header for Lesson */}
      <div className="md:hidden flex items-center justify-between p-3 bg-white border-b border-gray-200 shrink-0">
        <Link href={`/courses/${courseId}`} className="text-gray-500 p-1">
          <ChevronLeft size={20} />
        </Link>
        <span className="font-bold truncate max-w-[200px] text-sm">{currentLesson.title}</span>
        <button onClick={() => setShowSidebar(!showSidebar)} className="p-1">
          <Menu className="text-gray-500" size={20} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Content (Video) */}
        <div className={clsx(
          "flex-1 overflow-y-auto bg-black flex flex-col transition-all duration-500",
          isFocusMode && "fixed inset-0 z-50 justify-center"
        )}>
          <div className={clsx(
            "aspect-video w-full bg-black relative flex items-center justify-center group shrink-0",
            isFocusMode && "max-h-screen"
          )}>
            {currentLesson.videoUrl ? (
              // In a real app, use a proper video player component here
              <video 
                ref={videoRef}
                src={currentLesson.videoUrl} 
                controls 
                className="w-full h-full object-contain"
                poster="/placeholder-video-poster.jpg" // You might want a poster image
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="text-white text-center p-8">
                <PlayCircle size={48} className="mx-auto mb-4 opacity-50 md:w-16 md:h-16" />
                <p className="text-sm md:text-base">No video content available for this lesson.</p>
              </div>
            )}
            
            {/* Video Overlay Controls */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={togglePiP}
                className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors backdrop-blur-sm"
                title="Picture in Picture"
              >
                <PictureInPicture2 size={20} />
              </button>
              <button 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors backdrop-blur-sm"
                title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
              >
                {isFocusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>
          </div>
          
          <div className={clsx(
            "p-4 md:p-6 bg-white flex-1 transition-opacity duration-300 overflow-y-auto",
            isFocusMode ? "hidden" : "opacity-100"
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight">{currentLesson.title}</h1>
              <div className="flex gap-2 shrink-0">
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="text-gray-500 gap-2 h-8 md:h-9 text-xs md:text-sm"
                 >
                    {isFocusMode ? <LightbulbOff size={16} className="md:w-[18px] md:h-[18px]" /> : <Lightbulb size={16} className="md:w-[18px] md:h-[18px]" />}
                    <span className="inline">Focus Mode</span>
                 </Button>
              </div>
            </div>
            {/* Module/Section info could go here if added to data model */}
            
            <div className="flex flex-wrap gap-3 md:gap-4 mb-6 md:mb-8">
              {/* Placeholder actions */}
              <Button variant="secondary" className="gap-2 h-9 text-sm">
                <CheckCircle size={16} />
                Mark as Complete
              </Button>
            </div>

            <div className="prose max-w-none text-sm md:text-base">
              <h3 className="font-bold text-base md:text-lg">Lesson Notes</h3>
              <div className="text-gray-600 whitespace-pre-wrap mt-2">
                {currentLesson.content || "No notes available for this lesson."}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (Lesson List) */}
        <div className={clsx(
          "w-80 bg-white border-l border-gray-200 overflow-y-auto absolute md:relative inset-y-0 right-0 transform transition-transform duration-300 z-20 shadow-xl md:shadow-none h-full",
          showSidebar ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}>
          <div className="p-3 md:p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="font-bold text-gray-900">Course Content</h3>
            <button className="md:hidden p-1" onClick={() => setShowSidebar(false)}>
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="divide-y divide-gray-100 pb-20 md:pb-0">
            {lessons.map((lesson, index) => {
              const isActive = lesson.id === lessonId;
              return (
                <Link
                  key={lesson.id}
                  href={`/courses/${courseId}/lessons/${lesson.id}`}
                  className={clsx(
                    "flex items-start gap-3 p-3 md:p-4 hover:bg-gray-50 transition-colors",
                    isActive && "bg-blue-50 border-l-4 border-brand-blue"
                  )}
                  onClick={() => setShowSidebar(false)}
                >
                  <div className="mt-0.5 text-gray-400">
                    <Circle size={14} className="md:w-4 md:h-4" />
                  </div>
                  <div>
                    <p className={clsx(
                      "text-sm font-medium line-clamp-2",
                      isActive ? "text-brand-blue" : "text-gray-700"
                    )}>
                      {index + 1}. {lesson.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {lesson.videoUrl ? "Video" : "Text"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
