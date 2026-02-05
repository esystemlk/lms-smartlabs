"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { quizService } from "@/services/quizService";
import { Quiz } from "@/lib/types";
import { Loader2, BookOpen, Clock, Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function ExamsPage() {
  const { userData } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (userData?.enrolledCourses) {
        try {
          // Fetch quizzes for all enrolled courses
          const promises = userData.enrolledCourses.map(courseId => 
            quizService.getQuizzesByCourse(courseId)
          );
          const results = await Promise.all(promises);
          setQuizzes(results.flat());
        } catch (error) {
          console.error("Failed to load quizzes", error);
        }
      }
      setLoading(false);
    };

    if (userData) {
      fetchQuizzes();
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-brand-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exams & Quizzes</h1>
        <p className="text-gray-500">Test your knowledge and earn certificates.</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <BookOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Exams Available</h3>
          <p className="text-gray-500">There are no quizzes for your enrolled courses yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all flex flex-col h-full">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
                <BookOpen size={24} />
              </div>
              
              <h3 className="font-bold text-lg text-gray-900 mb-2">{quiz.title}</h3>
              <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{quiz.description || "No description provided."}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {quiz.durationMinutes > 0 ? `${quiz.durationMinutes} min` : 'Unlimited'}
                </span>
                <span className="flex items-center gap-1">
                  <Award size={14} />
                  Pass: {quiz.passingScore}%
                </span>
              </div>

              <Link href={`/lms/exams/${quiz.id}`} className="mt-auto">
                <Button className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-none justify-between">
                  Start Quiz
                  <ChevronRight size={16} />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
