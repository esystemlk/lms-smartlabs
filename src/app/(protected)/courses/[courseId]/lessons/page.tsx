 "use client";
 
 import { useEffect } from "react";
 import { useRouter, useParams } from "next/navigation";
 import Link from "next/link";
 import { Button } from "@/components/ui/Button";
 import { BookOpen } from "lucide-react";
 
 export default function LessonsIndexPage() {
   const router = useRouter();
   const params = useParams();
   const courseId = params.courseId as string;
 
   useEffect(() => {
     if (courseId) {
       const t = setTimeout(() => {
         router.replace(`/courses/${courseId}`);
       }, 1200);
       return () => clearTimeout(t);
     }
   }, [router, courseId]);
 
   return (
     <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
       <div className="w-20 h-20 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-6">
         <BookOpen size={36} />
       </div>
       <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Lessons</h1>
       <p className="text-gray-600 mb-6 max-w-md">
         Redirecting to the course overview. Choose a lesson from the list there.
       </p>
       <Link href={`/courses/${courseId || ""}`}>
         <Button>Go to Course</Button>
       </Link>
     </div>
   );
 }
