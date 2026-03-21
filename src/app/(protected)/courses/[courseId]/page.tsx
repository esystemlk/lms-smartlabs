"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
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
  Clock,
  Heart
} from "lucide-react";
import { clsx } from "clsx";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { userService } from "@/services/userService";
import { useCurrency } from "@/context/CurrencyContext";
import { Course, Lesson, Batch } from "@/lib/types";

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { userData } = useAuth();
  const { formatPrice } = useCurrency();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Access Control
  const [enrolledBatch, setEnrolledBatch] = useState<Batch | null>(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [userTimeSlotId, setUserTimeSlotId] = useState<string | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [bunnyLibraryId, setBunnyLibraryId] = useState<string>("");

  // Video Player state
  const [showVideo, setShowVideo] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string>("");
  const [activeLibraryId, setActiveLibraryId] = useState<string>("");

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const settings = await courseService.getGlobalSettings();
            if (settings?.bunny?.libraryId) {
                setBunnyLibraryId(settings.bunny.libraryId);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, lessonsData] = await Promise.all([
          courseService.getCourse(courseId),
          courseService.getLessons(courseId)
        ]);
        setCourse(courseData);

        // Filter lessons based on access rights
        let filteredLessons = lessonsData;
        if (userData && userData.role === 'student' && !["admin", "superadmin", "developer"].includes(userData.role)) {
          // Find enrollment for this course
          const enrollments = await enrollmentService.getUserEnrollments(userData.uid);
          const enrollment = enrollments.find(e => e.courseId === courseId && (e.status === 'active' || e.status === 'completed'));
          
          if (enrollment) {
            filteredLessons = lessonsData.filter(lesson => {
              // If it's a live class recording with batch restrictions
              if (lesson.type === 'live_class' && lesson.batchIds && lesson.batchIds.length > 0) {
                const matchesBatch = lesson.batchIds.includes(enrollment.batchId);
                if (!matchesBatch) return false;

                // If also restricted by time slot
                if (lesson.timeSlotId) {
                  return lesson.timeSlotId === enrollment.timeSlotId;
                }
              }
              return true;
            });
          }
        }
        setLessons(filteredLessons);
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
        // Find active or pending enrollment for this course
        const active = enrollments.find(e => e.courseId === courseId && e.status === 'active');
        const pending = enrollments.find(e => e.courseId === courseId && (e.status === 'pending' || e.status === 'pending_payment'));
        const completed = enrollments.find(e => e.courseId === courseId && e.status === 'completed');

        if (active || completed) {
          const enrollment = active || completed;
          // Check expiry
          let isValid = true;
          if (enrollment?.validUntil) {
            const now = new Date();
            const expiry = enrollment.validUntil.toDate();
            if (now > expiry) isValid = false;
          }

          if (isValid || completed) {
            setAccessGranted(true);
            setProgress(enrollment?.progress || 0);
            setCompletedLessonIds(enrollment?.completedLessonIds || []);
            setUserTimeSlotId(enrollment?.timeSlotId || null);
            // Fetch Batch Details
            if (enrollment?.batchId) {
              const batch = await courseService.getBatch(courseId, enrollment.batchId);
              setEnrolledBatch(batch);
            }
          }
        } else if (pending) {
            // Found a pending request
            setHasPendingRequest(true);
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
          <div className="w-full md:w-auto flex flex-col items-end gap-2">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex-1 md:w-48">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-blue transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              {lessons.length > 0 && (
                <Link href={`/courses/${courseId}/lessons/${lessons[0].id}`}>
                  <Button className="rounded-full shadow-lg shadow-blue-200 shrink-0">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Continue
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : hasPendingRequest ? (
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <div className="text-xs text-amber-800">
                <p className="font-bold">Enrollment Pending</p>
                <p>Waiting for admin approval</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Price</p>
              <p className="text-2xl font-bold text-brand-blue">
                {formatPrice(course.priceLKR || course.price, course.priceUSD)}
              </p>
            </div>
            <Link href="/courses">
              <Button className="w-full md:w-auto rounded-full shadow-lg shadow-blue-200 px-8">
                Enroll Now
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Hero Image and Description */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          <div className="relative aspect-square bg-gray-100">
            {course.image ? (
              <Image
                src={course.image}
                alt={course.title}
                width={1024}
                height={1024}
                quality={95}
                className="w-full h-full object-cover"
                priority={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">
                <BookOpen className="w-16 h-16" />
              </div>
            )}
          </div>
          <div className="p-4 md:p-6 flex flex-col justify-center">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">About this course</h2>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              {course.description}
            </p>
            {course.tags && course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {course.tags.slice(0, 6).map((tag, i) => (
                  <span key={i} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
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

      {/* Course Highlights */}
      <div className="bg-white rounded-2xl shadow-soft p-4 md:p-6 border border-gray-100">
        <div className="flex flex-wrap gap-4 mb-6">
          {course.level && (
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <span className={`w-2 h-2 rounded-full ${course.level === 'Beginner' ? 'bg-green-500' :
                  course.level === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              {course.level} Level
            </div>
          )}
          {course.category && (
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <BookOpen size={14} className="text-gray-500" />
              {course.category}
            </div>
          )}
          {course.includesCertificate && (
            <div className="flex items-center gap-2 text-sm font-medium text-brand-blue bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <CheckCircle size={14} />
              Certificate Included
            </div>
          )}
        </div>

        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">What you'll learn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {course.learningOutcomes.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
              {userTimeSlotId && (
                <> • Restricted to <span className="font-medium text-brand-blue">{userTimeSlotId}</span></>
              )}
            </p>
          </div>

          {(() => {
            // Check 3-Month Expiry from Batch Start Date
            const startDate = new Date(enrolledBatch.startDate);
            const expiryDate = new Date(startDate);
            expiryDate.setMonth(expiryDate.getMonth() + 3);
            const isExpired = new Date() > expiryDate;
            const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            if (isExpired) {
              return (
                <div className="p-8 text-center bg-gray-50/50">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500">
                    <Clock size={24} />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">Recordings Expired</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Access to recorded classes for this batch ended on {expiryDate.toLocaleDateString()}.
                    Recordings are available for 3 months from the batch start date.
                  </p>
                </div>
              );
            }

            // Filter recordings by timeSlot if applicable
            const filteredRecordings = (enrolledBatch.recordedClasses || []).filter(recording => {
              if (!recording.timeSlotId) return true; // Show to everyone if no restriction
              return recording.timeSlotId === userTimeSlotId; // Show only if matches student's slot
            });

            if (filteredRecordings.length === 0) {
              return (
                <div className="p-8 text-center bg-gray-50/50">
                  <p className="text-sm text-gray-500">No recorded classes available for your time slot yet.</p>
                </div>
              );
            }

            return (
              <div className="divide-y divide-gray-100">
                {/* Expiry Warning if close */}
                {daysLeft > 0 && daysLeft <= 14 && (
                  <div className="bg-amber-50 px-4 py-2 text-xs text-amber-800 flex items-center gap-2 border-b border-amber-100">
                    <Clock size={12} />
                    <span>Recordings expire in {daysLeft} days ({expiryDate.toLocaleDateString()})</span>
                  </div>
                )}

                {[...filteredRecordings]
                  .sort((a, b) => (b.order || 0) - (a.order || 0) || new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((recording, index) => (
                    <div
                      key={recording.id}
                      onClick={() => {
                        const videoId = recording.videoUrl;
                        if (videoId.includes('http')) {
                            window.open(videoId, '_blank');
                        } else {
                            setActiveVideoId(videoId);
                            setActiveLibraryId(bunnyLibraryId || "301323");
                            setShowVideo(true);
                        }
                      }}
                      className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-blue-50 transition-colors group cursor-pointer"
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
                    </div>
                  ))}
              </div>
            );
          })()}
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
              const isCompleted = completedLessonIds.includes(lesson.id);

              const content = (
                <>
                  <div className={clsx(
                    "flex-shrink-0 transition-colors",
                    isCompleted ? "text-green-500" : "text-gray-400 group-hover:text-brand-blue"
                  )}>
                    {accessGranted ? (
                      isCompleted ? <CheckCircle size={16} className="md:w-5 md:h-5" /> : <Circle size={16} className="md:w-5 md:h-5" />
                    ) : (
                      <Lock size={16} className="md:w-5 md:h-5" />
                    )}
                  </div>
                  <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-gray-100 rounded-lg text-xs md:text-sm font-medium text-gray-500">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className={clsx(
                      "font-medium text-sm md:text-base transition-colors",
                      accessGranted ? "text-gray-900 group-hover:text-brand-blue" : "text-gray-500",
                      isCompleted && "text-gray-500"
                    )}>
                      {lesson.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                        {lesson.type === 'video' && <><PlayCircle size={10} className="md:w-3 md:h-3" /> Video</>}
                        {lesson.type === 'live_class' && <><Video size={10} className="md:w-3 md:h-3 text-blue-600" /> <span className="text-blue-600 font-medium">Live Class</span></>}
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
      {/* Video Player Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-5xl aspect-video relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <FileText className="w-6 h-6 rotate-45" /> {/* Using as an X Close button alternative if X is not imported */}
            </button>
            <iframe
              src={`https://iframe.mediadelivery.net/embed/${activeLibraryId}/${activeVideoId}?autoplay=true&loop=false&muted=false&preload=true`}
              loading="lazy"
              className="w-full h-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
