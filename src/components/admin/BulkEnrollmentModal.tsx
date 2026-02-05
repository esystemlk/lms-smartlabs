import { useState, useEffect } from "react";
import { Course, Batch } from "@/lib/types";
import { courseService } from "@/services/courseService";
import { userService } from "@/services/userService";
import { enrollmentService } from "@/services/enrollmentService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, X, CheckCircle, AlertCircle, BookOpen, Calendar } from "lucide-react";

interface BulkEnrollmentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkEnrollmentModal({ onClose, onSuccess }: BulkEnrollmentModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [emailsText, setEmailsText] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{email: string, status: 'success' | 'failed', message?: string}[] | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadBatches(selectedCourseId);
    } else {
      setBatches([]);
      setSelectedBatchId("");
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadBatches = async (courseId: string) => {
    try {
      const data = await courseService.getBatches(courseId);
      setBatches(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnroll = async () => {
    const course = courses.find(c => c.id === selectedCourseId);
    const batch = batches.find(b => b.id === selectedBatchId);
    
    if (!course || !batch) return;
    
    const emails = emailsText
      .split(/[\n,]/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emails.length === 0) {
      alert("Please enter at least one email address");
      return;
    }

    setProcessing(true);
    const processResults: typeof results = [];

    for (const email of emails) {
      try {
        // 1. Find User
        const user = await userService.getUserByEmail(email);
        
        if (!user) {
          processResults.push({ email, status: 'failed', message: 'User not found' });
          continue;
        }

        // 2. Enroll
        const result = await enrollmentService.adminEnrollUser(
          user.uid,
          user.email,
          user.name,
          course,
          batch
        );

        if (result.success) {
          processResults.push({ email, status: 'success' });
        } else {
          processResults.push({ email, status: 'failed', message: result.message || 'Enrollment failed' });
        }
      } catch (error) {
        console.error(`Error enrolling ${email}:`, error);
        processResults.push({ email, status: 'failed', message: 'System error' });
      }
    }

    setResults(processResults);
    setProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Bulk Enrollment</h3>
            <p className="text-sm text-gray-500">Enroll multiple students into a batch via email</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {!results ? (
            <div className="space-y-6">
              {/* Course & Batch Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <BookOpen size={16} /> Select Course
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none bg-white"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                  >
                    <option value="">Select a course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar size={16} /> Select Batch
                  </label>
                  <select
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none bg-white"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    disabled={!selectedCourseId}
                  >
                    <option value="">Select a batch...</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emails Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Student Emails</label>
                <p className="text-xs text-gray-500">Enter email addresses separated by commas or new lines.</p>
                <textarea
                  className="w-full h-40 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none resize-none font-mono text-sm"
                  placeholder="student1@example.com&#10;student2@example.com"
                  value={emailsText}
                  onChange={(e) => setEmailsText(e.target.value)}
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                <p className="font-semibold mb-1">Note:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Users must already be registered in the system.</li>
                  <li>Enrollment will be active immediately.</li>
                  <li>Users will be added to the batch and course access list.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Enrollment Results</h4>
                <div className="text-sm">
                  <span className="text-green-600 font-medium">{results.filter(r => r.status === 'success').length} Success</span>
                  <span className="text-gray-300 mx-2">|</span>
                  <span className="text-red-600 font-medium">{results.filter(r => r.status === 'failed').length} Failed</span>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-500">Email</th>
                      <th className="px-4 py-2 font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 font-medium text-gray-500">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((result, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-4 py-2 font-mono text-xs">{result.email}</td>
                        <td className="px-4 py-2">
                          {result.status === 'success' ? (
                            <span className="inline-flex items-center text-green-600 gap-1.5">
                              <CheckCircle size={14} /> Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600 gap-1.5">
                              <AlertCircle size={14} /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{result.message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50">
          {!results ? (
            <>
              <Button variant="ghost" onClick={onClose} disabled={processing}>
                Cancel
              </Button>
              <Button 
                onClick={handleEnroll} 
                disabled={processing || !selectedBatchId || !emailsText.trim()}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Enroll Students"
                )}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
