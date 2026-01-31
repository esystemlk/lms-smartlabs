import { useState, useEffect } from "react";
import { enrollmentService } from "@/services/enrollmentService";
import { Enrollment } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Loader2, 
  Calendar,
  CreditCard,
  User,
  BookOpen
} from "lucide-react";

export function EnrollmentsTab() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const data = await enrollmentService.getPendingEnrollments();
      setEnrollments(data);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this enrollment?")) return;
    
    setProcessingId(id);
    try {
      await enrollmentService.approveEnrollment(id);
      setEnrollments(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error("Error approving enrollment:", error);
      alert("Failed to approve enrollment.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this enrollment?")) return;

    setProcessingId(id);
    try {
      await enrollmentService.rejectEnrollment(id);
      setEnrollments(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error("Error rejecting enrollment:", error);
      alert("Failed to reject enrollment.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Enrollments</h2>
          <p className="text-gray-500">Review and approve bank transfer enrollments</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
          {enrollments.length} Pending Requests
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
          <p className="text-gray-500 mt-1">There are no pending enrollments to review.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment) => (
            <div 
              key={enrollment.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center gap-6"
            >
              {/* User Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue font-bold">
                      {enrollment.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{enrollment.userName}</h3>
                      <p className="text-sm text-gray-500">{enrollment.userEmail}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen size={16} className="text-gray-400" />
                    <span>{enrollment.courseTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{enrollment.batchName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard size={16} className="text-gray-400" />
                    <span>LKR {enrollment.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span>Submitted: {enrollment.enrolledAt?.toDate().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 md:border-l md:pl-6 md:border-gray-100">
                {enrollment.paymentProofUrl && (
                  <a 
                    href={enrollment.paymentProofUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} />
                    View Receipt
                  </a>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={() => handleReject(enrollment.id)}
                    disabled={processingId === enrollment.id}
                  >
                    {processingId === enrollment.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    <span className="ml-2">Reject</span>
                  </Button>
                  
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(enrollment.id)}
                    disabled={processingId === enrollment.id}
                  >
                    {processingId === enrollment.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    <span className="ml-2">Approve</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
