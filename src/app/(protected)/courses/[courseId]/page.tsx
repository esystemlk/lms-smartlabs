"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { 
  PlayCircle, 
  FileText, 
  CheckCircle, 
  Circle, 
  Loader2,
  Mic,
  Headphones,
  PenTool,
  BookOpen,
  HelpCircle,
  Lock,
  Video,
  Clock
} from "lucide-react";
import { clsx } from "clsx";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { Course, Lesson, Batch } from "@/lib/types";

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { userData } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Access Control
  const [enrolledBatch, setEnrolledBatch] = useState<Batch | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, lessonsData] = await Promise.all([
          courseService.getCourse(courseId),
          courseService.getLessons(courseId)
        ]);
        setCourse(courseData);
        setLessons(lessonsData);
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  // Check Enrollment
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!userData || !courseId) {
        setCheckingAccess(false);
        return;
      }
      
      try {
        const enrollments = await enrollmentService.getUserEnrollments(userData.uid);
        // Find active enrollment for this course
        const enrollment = enrollments.find(e => e.courseId === courseId && e.status === 'active');
        
        if (enrollment) {
          // Check expiry
          let isValid = true;
          if (enrollment.validUntil) {
             const now = new Date();
             const expiry = enrollment.validUntil.toDate();
             if (now > expiry) isValid = false;
          }

          if (isValid) {
            setAccessGranted(true);
            // Fetch Batch Details
            const batch = await courseService.getBatch(courseId, enrollment.batchId);
            setEnrolledBatch(batch);
          }
        }
      } catch (err) {
        console.error("Error checking enrollment:", err);
      } finally {
        setCheckingAccess(false);
      }
    };
    
    checkEnrollment();
  }, [userData, courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">Course not found.</p>
        <Link href="/courses">
          <Button variant="outline">Back to Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/courses" className="text-sm text-gray-500 hover:text-brand-blue mb-2 block">
            ← Back to Courses
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-sm md:text-base text-gray-500">{lessons.length} Lessons • {course.instructorName}</p>
        </div>
        
        {accessGranted ? (
          lessons.length > 0 && (
            <Link href={`/courses/${courseId}/lessons/${lessons[0].id}`}>
              <Button className="w-full md:w-auto rounded-full shadow-lg shadow-blue-200">
                <PlayCircle className="mr-2 h-5 w-5" />
                Continue Learning
              </Button>
            </Link>
          )
        ) : (
          <Link href="/courses">
            <Button className="w-full md:w-auto rounded-full shadow-lg shadow-blue-200">
              Enroll Now
            </Button>
          </Link>
        )}
      </div>

      {!accessGranted && !checkingAccess && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 md:p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Enrollment Required</p>
            <p>You need to enroll in a batch and have an active subscription to access the course materials and recorded classes.</p>
          </div>
        </div>
      )}

      {/* Recorded Classes Section (Batch Specific) */}
      {accessGranted && enrolledBatch?.recordedClasses && enrolledBatch.recordedClasses.length > 0 && (
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100 bg-blue-50/50">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-brand-blue" />
              <h2 className="font-bold text-lg text-gray-900">Recorded Classes</h2>
            </div>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Live class recordings from <span className="font-medium text-brand-blue">{enrolledBatch.name}</span>
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {enrolledBatch.recordedClasses.map((recording, index) => (
              <a 
                key={recording.id} 
                href={recording.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex-shrink-0 text-blue-300 group-hover:text-brand-blue">
                  <PlayCircle size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm md:text-base text-gray-900 group-hover:text-brand-blue transition-colors line-clamp-1">
                    {recording.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(recording.date).toLocaleDateString()}
                    </span>
                    {recording.durationMinutes && (
                      <span>{recording.durationMinutes} mins</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" className="rounded-full h-8 text-xs md:text-sm">
                    Watch
                  </Button>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Course Materials (Lessons) */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100">
          <h2 className="font-bold text-lg">Course Materials</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">{course.description}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {lessons.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No lessons available yet.
            </div>
          ) : (
            lessons.map((lesson, index) => {
              const content = (
                <>
                  <div className="flex-shrink-0 text-gray-400 group-hover:text-brand-blue transition-colors">
                    {accessGranted ? <Circle size={16} className="md:w-5 md:h-5" /> : <Lock size={16} className="md:w-5 md:h-5" />}
                  </div>
                  <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-gray-100 rounded-lg text-xs md:text-sm font-medium text-gray-500">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium text-sm md:text-base transition-colors ${accessGranted ? "text-gray-900 group-hover:text-brand-blue" : "text-gray-500"}`}>
                      {lesson.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                        {lesson.type === 'video' && <><PlayCircle size={10} className="md:w-3 md:h-3" /> Video</>}
                        {lesson.type === 'speaking' && <><Mic size={10} className="md:w-3 md:h-3" /> Speaking</>}
                        {lesson.type === 'listening' && <><Headphones size={10} className="md:w-3 md:h-3" /> Listening</>}
                        {lesson.type === 'reading' && <><BookOpen size={10} className="md:w-3 md:h-3" /> Reading</>}
                        {lesson.type === 'writing' && <><PenTool size={10} className="md:w-3 md:h-3" /> Writing</>}
                        {lesson.type === 'quiz' && <><HelpCircle size={10} className="md:w-3 md:h-3" /> Quiz</>}
                        {!lesson.type && <><PlayCircle size={10} className="md:w-3 md:h-3" /> Video</>}
                      </span>

                      {lesson.durationMinutes && (
                        <span className="text-[10px] md:text-xs text-gray-500">
                          {lesson.durationMinutes} mins
                        </span>
                      )}
                    </div>
                  </div>
                  {accessGranted && (
                    <div className="flex-shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="rounded-full h-8 text-xs md:text-sm">
                        Start
                      </Button>
                    </div>
                  )}
                </>
              );

              return accessGranted ? (
                <Link 
                  key={lesson.id} 
                  href={`/courses/${courseId}/lessons/${lesson.id}`}
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-gray-50 transition-colors group"
                >
                  {content}
                </Link>
              ) : (
                <div 
                  key={lesson.id} 
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 opacity-75 cursor-not-allowed bg-gray-50/50"
                >
                  {content}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
