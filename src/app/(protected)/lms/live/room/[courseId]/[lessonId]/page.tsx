"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { courseService } from "@/services/courseService";
import { Lesson } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function ClassroomPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = use(params);
  const { userData } = useAuth();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [iframeUrl, setIframeUrl] = useState("");

  useEffect(() => {
    if (!userData) return;
    fetchLesson();
  }, [userData, courseId, lessonId]);

  const fetchLesson = async () => {
    try {
      const data = await courseService.getLesson(courseId, lessonId);
      if (!data) throw new Error("Class not found");
      setLesson(data);
      // Automatically prepare meeting when lesson is loaded
      prepareMeeting(data);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const prepareMeeting = async (lessonData: Lesson) => {
    if (!userData) return;

    try {
      // Get Signature
      const res = await fetch('/api/zoom/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingNumber: lessonData.zoomMeetingId,
          role: 0 // Student = 0
        })
      });

      const { signature, sdkKey } = await res.json();

      if (!signature) throw new Error("Failed to generate signature");

      // Construct Iframe URL
      const params = new URLSearchParams({
        signature: String(signature),
        mn: lessonData.zoomMeetingId || "",
        pwd: lessonData.zoomPassword || "",
        name: userData.name || "Student",
        email: userData.email,
        sdkKey: String(sdkKey),
        leaveUrl: `${window.location.origin}/lms/live`
      });

      setIframeUrl(`/classroom.html?${params.toString()}`);

    } catch (err: any) {
      console.error("Setup error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white relative z-0">
       {iframeUrl ? (
         <iframe 
            src={iframeUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-screen border-0"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
         />
       ) : (
         <div className="text-center animate-pulse">Initializing Classroom Environment...</div>
       )}
    </div>
  );
}
