"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { assignmentService } from "@/services/assignmentService";
import { Assignment } from "@/lib/types";
import { Loader2, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AssignmentsPage() {
  const { userData } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (userData?.enrolledCourses && userData.enrolledCourses.length > 0) {
        try {
          const data = await assignmentService.getAssignmentsForStudent(
            userData.enrolledCourses,
            userData.enrolledBatches || []
          );
          setAssignments(data);
        } catch (error) {
          console.error("Failed to load assignments", error);
        }
      }
      setLoading(false);
    };

    if (userData) {
      fetchAssignments();
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assignments</h1>
        <p className="text-gray-500">Track and submit your coursework.</p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Assignments Yet</h3>
          <p className="text-gray-500">You're all caught up! Check back later.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate);
            const isOverdue = new Date() > dueDate;
            
            return (
              <div key={assignment.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{assignment.title}</h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        Due: {format(dueDate, "MMM d, h:mm a")}
                      </span>
                      {isOverdue && (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <AlertCircle size={14} />
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Link href={`/lms/assignments/${assignment.id}`}>
                  <Button variant={isOverdue ? "destructive" : "primary"}>
                    View Details
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
