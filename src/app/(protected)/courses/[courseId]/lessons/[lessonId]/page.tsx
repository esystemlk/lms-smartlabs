"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
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
  LightbulbOff,
  Video,
  StickyNote,
  Save
} from "lucide-react";
import { clsx } from "clsx";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { noteService } from "@/services/noteService";
import { Lesson } from "@/lib/types";

export default function LessonPage() {
  const { userData } = useAuth();
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
  
  // Progress Tracking
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const isCompleted = completedLessonIds.includes(lessonId);
  const [markingComplete, setMarkingComplete] = useState(false);

  // Personal Notes
  const [myNote, setMyNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const loadNote = async () => {
      if (!userData) return;
      const note = await noteService.getNote(userData.uid, lessonId);
      if (note) {
        setMyNote(note.content);
        if (note.updatedAt) {
          setLastSaved(note.updatedAt.toDate ? note.updatedAt.toDate() : new Date(note.updatedAt));
        }
      }
    };
    loadNote();
  }, [userData, lessonId]);

  const handleSaveNote = async () => {
    if (!userData) return;
    setIsSavingNote(true);
    try {
      await noteService.saveNote(userData.uid, courseId, lessonId, myNote);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsSavingNote(false);
    }
  };

  useEffect(() => {
    const checkCompletion = async () => {
        if (!userData) return;
        try {
            const enrollments = await enrollmentService.getUserEnrollments(userData.uid);
            const active = enrollments.find(e => e.courseId === courseId && e.status === 'active');
            if (active) {
                setEnrollmentId(active.id);
                setCompletedLessonIds(active.completedLessonIds || []);
            }
        } catch (error) {
            console.error("Error checking completion:", error);
        }
    };
    if (!loading) {
        checkCompletion();
    }
  }, [userData, courseId, loading]);

  const handleMarkComplete = async () => {
    if (!enrollmentId || isCompleted) return;
    setMarkingComplete(true);
    try {
        await enrollmentService.markLessonComplete(enrollmentId, lessonId, lessons.length);
        setCompletedLessonIds(prev => [...prev, lessonId]);
    } catch (error) {
        console.error("Error marking complete:", error);
    } finally {
        setMarkingComplete(false);
    }
  };

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
            {currentLesson.type === 'live_class' ? (
              <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 text-white p-4 md:p-8 text-center relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-slate-900"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4 md:mb-6 animate-pulse shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                    <Video size={32} className="md:w-10 md:h-10" />
                  </div>
                  <h2 className="text-xl md:text-3xl font-bold mb-2">{currentLesson.title}</h2>
                  <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8 max-w-md">
                    This is a scheduled live class. Please join at the scheduled time.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8 text-left bg-white/5 p-4 md:p-6 rounded-2xl border border-white/10 w-full max-w-md backdrop-blur-sm">
                    <div>
                      <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mb-1">Start Time</p>
                      <p className="font-medium text-sm md:text-lg">
                        {currentLesson.startTime ? new Date(currentLesson.startTime).toLocaleString() : 'TBA'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mb-1">Duration</p>
                      <p className="font-medium text-sm md:text-lg">{currentLesson.duration} mins</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full max-w-sm">
                    {currentLesson.zoomJoinUrl && (
                      <a 
                        href={currentLesson.zoomJoinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full h-10 md:h-12 text-base md:text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20">
                          Join Live Class
                        </Button>
                      </a>
                    )}
                    
                    {userData && ['admin', 'lecturer', 'superadmin', 'developer'].includes(userData.role) && currentLesson.zoomStartUrl && (
                      <a 
                        href={currentLesson.zoomStartUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button variant="outline" className="w-full h-10 md:h-12 border-white/20 text-white hover:bg-white/10 hover:text-white">
                          Start Meeting (Host)
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : currentLesson.videoUrl ? (
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
            
            {/* Video Overlay Controls (only for video type) */}
            {currentLesson.type !== 'live_class' && (
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
            )}
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
              <Button 
                variant={isCompleted ? "outline" : "secondary"} 
                className={clsx("gap-2 h-9 text-sm transition-all", isCompleted && "text-green-600 border-green-200 bg-green-50 hover:bg-green-100")}
                onClick={handleMarkComplete}
                disabled={markingComplete || isCompleted || !enrollmentId}
              >
                {markingComplete ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {isCompleted ? "Completed" : "Mark as Complete"}
              </Button>
            </div>

            <div className="prose max-w-none text-sm md:text-base mb-8">
              <h3 className="font-bold text-base md:text-lg">Lesson Notes</h3>
              <div className="text-gray-600 whitespace-pre-wrap mt-2">
                {currentLesson.content || "No notes available for this lesson."}
              </div>
            </div>

            {/* Personal Notes Section */}
            <div className="bg-yellow-50/50 border border-yellow-100 rounded-2xl p-4 md:p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <StickyNote size={20} />
                  <h3 className="font-bold text-base md:text-lg">My Private Notes</h3>
                </div>
                {lastSaved && (
                  <span className="text-xs text-yellow-600/70">
                    Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <textarea
                value={myNote}
                onChange={(e) => setMyNote(e.target.value)}
                placeholder="Type your personal notes here... only you can see this."
                className="w-full min-h-[150px] p-4 rounded-xl border-yellow-200 bg-white/80 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-y text-sm md:text-base"
              />
              <div className="flex justify-end mt-3">
                <Button 
                  onClick={handleSaveNote} 
                  disabled={isSavingNote}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
                  size="sm"
                >
                  {isSavingNote ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Notes
                </Button>
              </div>
            </div>

            {currentLesson.attachments && currentLesson.attachments.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="font-bold text-base md:text-lg mb-4">Resources</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentLesson.attachments.map((attachment, idx) => (
                    <a 
                      key={idx}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-blue hover:bg-blue-50 transition-all group"
                    >
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white text-gray-500 group-hover:text-brand-blue transition-colors">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-blue">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">Download Resource</p>
                      </div>
                      <Download size={16} className="text-gray-400 group-hover:text-brand-blue" />
                    </a>
                  ))}
                </div>
              </div>
            )}
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
              const isLessonCompleted = completedLessonIds.includes(lesson.id);
              
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
                  <div className={clsx("mt-0.5", isLessonCompleted ? "text-green-500" : "text-gray-400")}>
                    {isLessonCompleted ? <CheckCircle size={14} className="md:w-4 md:h-4" /> : <Circle size={14} className="md:w-4 md:h-4" />}
                  </div>
                  <div>
                    <p className={clsx(
                      "text-sm font-medium line-clamp-2",
                      isActive ? "text-brand-blue" : "text-gray-700",
                      isLessonCompleted && !isActive && "text-gray-500"
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
