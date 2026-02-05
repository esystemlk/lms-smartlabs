"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user || !userData) {
      // Should be handled by ProtectedLayout, but double check
      return;
    }

    // Check if user has any active enrollments
    const hasActiveEnrollments = userData.enrolledCourses && userData.enrolledCourses.length > 0;

    if (!hasActiveEnrollments) {
      // If trying to access LMS without enrollment, block access
      toast(
        "You need to enroll in a course to access the Learning Management System.",
        "error",
        5000
      );
      setIsChecking(false); // Stop checking to show the blocked state
      // We don't redirect immediately to allow the user to read the message, 
      // or we can show a "Access Denied" state in place of children.
    } else {
      setIsChecking(false);
    }
  }, [user, userData, loading, router, pathname]);

  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  const hasActiveEnrollments = userData?.enrolledCourses && userData.enrolledCourses.length > 0;

  if (!hasActiveEnrollments) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-blue-100 text-brand-blue rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-200/50">
          <BookOpen size={48} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Start Your Learning Journey
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 max-w-md mb-8 text-lg">
          You need to enroll in a course to access the Learning Management System (LMS).
        </p>

        <Button 
          size="lg" 
          onClick={() => router.push("/courses")}
          className="shadow-lg shadow-blue-500/20"
        >
          Browse Courses
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
