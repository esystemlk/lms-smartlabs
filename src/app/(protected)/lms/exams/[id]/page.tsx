"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { quizService } from "@/services/quizService";
import { Quiz, Question } from "@/lib/types";
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, ChevronLeft, Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// ...

export default function QuizPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (params.id) {
        try {
          const data = await quizService.getQuiz(params.id);
          if (data) {
            setQuiz(data);
            if (data.durationMinutes > 0) {
              setTimeLeft(data.durationMinutes * 60);
            }
          }
        } catch (error) {
          console.error("Failed to load quiz", error);
          toast("Failed to load quiz", "error");
        }
      }
      setLoading(false);
    };

    fetchQuiz();
  }, [params.id]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;

    if (timeLeft === 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (questionId: string, value: string) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const calculateScore = () => {
    if (!quiz) return { score: 0, passed: false };
    
    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach(q => {
      totalPoints += q.points;
      if (answers[q.id] === q.correctAnswer) {
        earnedPoints += q.points;
      }
    });

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    return {
      score: Math.round(percentage),
      passed: percentage >= quiz.passingScore
    };
  };

  const handleSubmit = async () => {
    if (!quiz || !userData || submitted || isSubmitting) return;

    setIsSubmitting(true);
    const result = calculateScore();
    setScore(result.score);
    setPassed(result.passed);
    setSubmitted(true);

    try {
      await quizService.submitAttempt({
        quizId: quiz.id,
        userId: userData.uid,
        answers,
        score: result.score,
        passed: result.passed
      });
      toast("Quiz submitted successfully!", "success");
    } catch (error) {
      console.error("Failed to submit quiz", error);
      toast("Failed to save results, but you can see your score here.", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-brand-blue" size={32} />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h1>
        <p className="text-gray-500 mb-6">The quiz you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/lms/exams')}>Back to Exams</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden text-center p-12">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {passed ? <CheckCircle size={48} /> : <XCircle size={48} />}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {passed ? "Congratulations!" : "Keep Practicing"}
          </h1>
          <p className="text-gray-500 mb-8">
            You scored <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{score}%</span>. 
            The passing score is {quiz.passingScore}%.
          </p>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push('/lms/exams')}>
              Back to Exams
            </Button>
            {/* Could add 'Review Answers' button here later */}
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 sticky top-4 z-10 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-sm md:text-base">{quiz.title}</h2>
          <div className="text-xs text-gray-500">Question {currentQuestion + 1} of {quiz.questions.length}</div>
        </div>
        
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 font-mono font-bold px-3 py-1.5 rounded-lg ${timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <Clock size={16} />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1.5 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-brand-blue h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 mb-8 min-h-[400px] flex flex-col">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
          {question.text}
        </h3>

        <div className="space-y-3 flex-1">
          {question.options?.map((option, idx) => (
            <label 
              key={idx}
              className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                answers[question.id] === option 
                  ? 'border-brand-blue bg-blue-50/50' 
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={answers[question.id] === option}
                onChange={() => handleOptionSelect(question.id, option)}
                className="w-5 h-5 text-brand-blue border-gray-300 focus:ring-brand-blue"
              />
              <span className="ml-3 text-gray-700 font-medium">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
          className="text-gray-500"
        >
          <ChevronLeft className="mr-2" size={20} />
          Previous
        </Button>

        {isLastQuestion ? (
          <Button 
            onClick={handleSubmit}
            className="bg-brand-blue hover:bg-blue-700 text-white px-8"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Flag className="mr-2" size={18} />}
            Submit Quiz
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-8"
          >
            Next
            <ChevronRight className="ml-2" size={20} />
          </Button>
        )}
      </div>
    </div>
  );
}
