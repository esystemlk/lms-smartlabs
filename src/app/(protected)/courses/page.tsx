
"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, Transition } from "@headlessui/react";
import { 
  Loader2, 
  CheckCircle2, 
  Calendar, 
  Users, 
  X,
  BookOpen,
  Award,
  Clock,
  CreditCard,
  Landmark,
  Upload,
  AlertCircle
} from "lucide-react";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { useAuth } from "@/context/AuthContext";
import { Course, Batch } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export default function CoursesPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Enrollment Modal State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  
  // Enrollment Flow State
  const [step, setStep] = useState<1 | 2>(1); // 1: Batch, 2: Payment
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false); // For Card (Active)
  const [pendingApproval, setPendingApproval] = useState(false); // For Transfer (Pending)

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getPublishedCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnrollModal = async (course: Course) => {
    setSelectedCourse(course);
    setSelectedBatchId(null);
    setEnrollSuccess(false);
    setPendingApproval(false);
    setStep(1);
    setPaymentMethod('card');
    setReceiptFile(null);
    setLoadingBatches(true);
    
    try {
      // Fetch open batches for this course
      const allBatches = await courseService.getBatches(course.id);
      const openBatches = allBatches.filter(b => b.status === 'open' || b.status === 'ongoing');
      setBatches(openBatches);
    } catch (error) {
      console.error("Error fetching batches:", error);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedCourse || !selectedBatchId || !userData) return;
    
    // Validation for Transfer
    if (paymentMethod === 'transfer' && !receiptFile) {
      alert("Please upload your payment receipt.");
      return;
    }

    setEnrolling(true);
    try {
      const selectedBatch = batches.find(b => b.id === selectedBatchId)!;
      const price = selectedCourse.price || 0;

      await enrollmentService.createEnrollment(
        userData.uid,
        userData.email,
        userData.name,
        selectedCourse,
        selectedBatch,
        paymentMethod,
        price,
        receiptFile || undefined
      );

      if (paymentMethod === 'card') {
        setEnrollSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setPendingApproval(true);
        // Pending approval doesn't redirect immediately or redirects to dashboard with pending status
        // User asked for "RED NOTIFICATION"
      }
    } catch (error) {
      console.error("Enrollment failed:", error);
      alert("Failed to enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const closeModal = () => {
    if (!enrolling && !enrollSuccess && !pendingApproval) {
      setSelectedCourse(null);
    } else if (enrollSuccess || pendingApproval) {
      // Allow closing after success
      setSelectedCourse(null);
      if (enrollSuccess) router.push("/dashboard");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 md:p-12 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-5xl font-bold mb-3 md:mb-4 leading-tight">
            Master Your Future with <span className="text-yellow-300">Smart Labs</span>
          </h1>
          <p className="text-blue-100 text-sm md:text-lg mb-6 md:mb-8">
            Join thousands of students learning cutting-edge technologies. Select a course, choose your batch, and start your journey today.
          </p>
          <div className="flex gap-4">
            <Button variant="ghost" className="bg-white/20 hover:bg-white/30 text-white border-0 text-sm md:text-base">
              Browse Courses
            </Button>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 md:w-72 md:h-72 bg-blue-500/30 rounded-full blur-3xl"></div>
      </section>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {courses.map((course) => (
          <div key={course.id} className="group bg-white dark:bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-border overflow-hidden flex flex-col h-full">
            {/* Image */}
            <div className="relative h-40 md:h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300 dark:text-gray-600">
                  <BookOpen className="w-12 h-12 md:w-16 md:h-16" />
                </div>
              )}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-brand-blue shadow-sm">
                {course.lessonsCount} Lessons
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 flex flex-col flex-1">
              <div className="mb-3 md:mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {course.level && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                      {course.level}
                    </span>
                  )}
                  {course.category && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300">
                      {course.category}
                    </span>
                  )}
                  {course.includesCertificate && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300">
                      Certificate
                    </span>
                  )}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 line-clamp-1 group-hover:text-brand-blue transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {course.description}
                </p>
              </div>

              {course.tags && course.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3 md:mb-4">
                  {course.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4 md:mb-6">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{course.instructorName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>Flexible</span>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">Price</span>
                  <span className="text-lg md:text-xl font-bold text-brand-blue">
                    {course.price && course.price > 0 ? `LKR ${course.price.toLocaleString()}` : "Free"}
                  </span>
                </div>
                <Button 
                  onClick={() => handleOpenEnrollModal(course)}
                  variant="secondary"
                  className="shadow-lg shadow-blue-500/20 text-xs md:text-sm h-8 md:h-10"
                >
                  Enroll Now
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No courses available yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Check back soon for new learning opportunities.</p>
        </div>
      )}

      {/* Enrollment Modal */}
      <Transition appear show={!!selectedCourse} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-card p-6 text-left align-middle shadow-xl transition-all">
                  
                  {/* Success State (Active) */}
                  {enrollSuccess && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                        <CheckCircle2 size={32} />
                      </div>
                      <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Enrollment Successful!
                      </Dialog.Title>
                      <p className="text-gray-500 mb-6">
                        You have successfully registered for {selectedCourse?.title}. Redirecting you to your dashboard...
                      </p>
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-blue" />
                    </div>
                  )}

                  {/* Pending Approval State (Transfer) */}
                  {pendingApproval && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                        <Clock size={32} />
                      </div>
                      <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Verification Pending
                      </Dialog.Title>
                      
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-left">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                          <div className="text-sm text-red-800">
                            <p className="font-semibold mb-1">Important Notice:</p>
                            <p>Bank transfer verification typically takes 24 hours. If submitted on a weekend, it will be checked on Monday.</p>
                          </div>
                        </div>
                      </div>

                      <Button onClick={closeModal} fullWidth>
                        Close
                      </Button>
                    </div>
                  )}

                  {/* Enrollment Steps */}
                  {!enrollSuccess && !pendingApproval && (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 dark:text-white">
                          {step === 1 ? "Select a Batch" : "Payment Method"}
                        </Dialog.Title>
                        <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                          <X size={20} />
                        </button>
                      </div>

                      {/* Step 1: Batch Selection */}
                      {step === 1 && (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-500">
                            Choose an available intake for <span className="font-semibold text-gray-900 dark:text-white">{selectedCourse?.title}</span>.
                          </p>

                          {loadingBatches ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
                            </div>
                          ) : batches.length > 0 ? (
                            <div className="space-y-3">
                              {batches.map((batch) => (
                                <div 
                                  key={batch.id}
                                  onClick={() => setSelectedBatchId(batch.id)}
                                  className={`
                                    cursor-pointer p-3 rounded-xl border-2 transition-all flex items-center justify-between gap-3
                                    ${selectedBatchId === batch.id 
                                      ? "border-brand-blue bg-blue-50 dark:bg-blue-900/20" 
                                      : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-12 h-12 relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                                      {batch.image ? (
                                        <Image src={batch.image} alt={batch.name} fill className="object-cover" />
                                      ) : (
                                        <div className="flex items-center justify-center h-full text-gray-300 dark:text-gray-600">
                                          <Users size={16} />
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{batch.name}</h4>
                                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                        <Calendar size={12} />
                                        <span>Starts: {new Date(batch.startDate).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedBatchId === batch.id ? "border-brand-blue" : "border-gray-300"}`}>
                                    {selectedBatchId === batch.id && <div className="w-2.5 h-2.5 rounded-full bg-brand-blue" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                              <p className="text-gray-500">No open batches available for this course right now.</p>
                            </div>
                          )}

                          <div className="flex gap-3 pt-2">
                            <Button variant="ghost" fullWidth onClick={closeModal}>Cancel</Button>
                            <Button 
                              fullWidth 
                              disabled={!selectedBatchId}
                              onClick={() => setStep(2)}
                            >
                              Next: Payment
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Payment */}
                      {step === 2 && (
                        <div className="space-y-6">
                          {/* Payment Tabs */}
                          <div className="flex p-1 bg-gray-100 rounded-xl">
                            <button
                              onClick={() => setPaymentMethod('card')}
                              className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                                paymentMethod === 'card' 
                                  ? 'bg-white text-brand-blue shadow-sm' 
                                  : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              <CreditCard size={16} />
                              Card
                            </button>
                            <button
                              onClick={() => setPaymentMethod('transfer')}
                              className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                                paymentMethod === 'transfer' 
                                  ? 'bg-white text-brand-blue shadow-sm' 
                                  : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              <Landmark size={16} />
                              Bank Transfer
                            </button>
                          </div>

                          {paymentMethod === 'card' ? (
                            <div className="space-y-4">
                              <div className="p-4 border border-blue-100 bg-blue-50 rounded-xl text-center">
                                <p className="text-sm text-blue-800 font-medium">Mock Payment Gateway</p>
                                <p className="text-xs text-blue-600 mt-1">Click "Pay Now" to simulate a successful transaction.</p>
                              </div>
                              <div className="flex justify-between items-center text-sm font-medium">
                                <span>Total Amount:</span>
                                <span className="text-lg font-bold text-gray-900">
                                  LKR {selectedCourse?.price?.toLocaleString() || "0"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm text-gray-600">
                                <p><span className="font-semibold text-gray-900">Bank:</span> Commercial Bank</p>
                                <p><span className="font-semibold text-gray-900">Account Name:</span> Smart Labs Institute</p>
                                <p><span className="font-semibold text-gray-900">Account No:</span> 1234567890</p>
                                <p><span className="font-semibold text-gray-900">Branch:</span> Colombo 07</p>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Upload Receipt</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                  <input 
                                    type="file" 
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                  <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-6 h-6 text-gray-400" />
                                    {receiptFile ? (
                                      <span className="text-sm text-brand-blue font-medium">{receiptFile.name}</span>
                                    ) : (
                                      <span className="text-sm text-gray-500">Click to upload payment proof</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-3 pt-2">
                            <Button variant="ghost" fullWidth onClick={() => setStep(1)}>Back</Button>
                            <Button 
                              fullWidth 
                              disabled={enrolling || (paymentMethod === 'transfer' && !receiptFile)}
                              onClick={handleEnroll}
                            >
                              {enrolling ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : paymentMethod === 'card' ? (
                                "Pay Now"
                              ) : (
                                "Submit for Verification"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
