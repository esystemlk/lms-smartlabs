"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { assignmentService } from "@/services/assignmentService";
import { Assignment, AssignmentSubmission } from "@/lib/types";
import { Loader2, Calendar, FileText, CheckCircle, Upload, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/components/ui/Toast";

export default function AssignmentDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answer, setAnswer] = useState("");

  const id = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      if (!userData || !id) return;

      try {
        // Fetch Assignment Details
        const assignRef = doc(db, "assignments", id);
        const assignSnap = await getDoc(assignRef);
        
        if (assignSnap.exists()) {
          setAssignment({ id: assignSnap.id, ...assignSnap.data() } as Assignment);
        } else {
          toast("Assignment not found", "error");
          router.push("/lms/assignments");
          return;
        }

        // Fetch Submission
        const sub = await assignmentService.getSubmission(id, userData.uid);
        if (sub) {
          setSubmission(sub);
          setAnswer(sub.content || "");
        }
      } catch (error) {
        console.error("Error loading assignment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, userData, router]);

  const handleSubmit = async () => {
    if (!userData || !assignment) return;
    if (!answer.trim()) {
      toast("Please write an answer before submitting", "error");
      return;
    }

    setSubmitting(true);
    try {
      await assignmentService.submitAssignment(
        assignment.id,
        userData.uid,
        userData.name,
        answer
      );
      
      toast("Assignment submitted successfully!", "success");
      
      // Refresh submission
      const sub = await assignmentService.getSubmission(assignment.id, userData.uid);
      setSubmission(sub);
    } catch (error) {
      console.error("Submission failed:", error);
      toast("Failed to submit assignment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-brand-blue" size={32} />
      </div>
    );
  }

  if (!assignment) return null;

  const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate);
  const isSubmitted = !!submission;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Link href="/lms/assignments" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={16} className="mr-2" />
        Back to Assignments
      </Link>

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
            <div className="flex items-center gap-4 text-gray-500">
              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                <Calendar size={14} />
                Due {format(dueDate, "PPP p")}
              </span>
              <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                {assignment.points} Points
              </span>
            </div>
          </div>
          {isSubmitted && (
             <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl flex items-center gap-2 font-bold">
               <CheckCircle size={18} />
               Submitted
             </div>
          )}
        </div>

        <div className="prose max-w-none text-gray-600 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Instructions</h3>
          <div className="whitespace-pre-wrap">{assignment.description}</div>
        </div>

        <div className="border-t border-gray-100 pt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Work</h3>
          
          {isSubmitted ? (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Submitted on {format(submission.submittedAt?.toDate ? submission.submittedAt.toDate() : new Date(submission.submittedAt), "PPP p")}</p>
              <div className="whitespace-pre-wrap text-gray-800">{submission.content}</div>
              {submission.grade && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="font-bold text-gray-900">Grade: {submission.grade} / {assignment.points}</p>
                  {submission.feedback && <p className="text-gray-600 mt-1">Feedback: {submission.feedback}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Response
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full min-h-[200px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Type your answer here..."
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="bg-brand-blue hover:bg-blue-700 text-white min-w-[150px]"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Upload size={18} className="mr-2" />}
                  Submit Assignment
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
