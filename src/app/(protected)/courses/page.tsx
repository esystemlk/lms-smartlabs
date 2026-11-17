
"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
import { useCurrency } from "@/context/CurrencyContext";
import { Course, Batch } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { settingsService } from "@/services/settingsService";
import { BookOpenText, Books, Storefront, Play, Clock as ClockIcon, ChalkboardTeacher, ListBullets, Certificate } from "@phosphor-icons/react";

export default function CoursesPage() {
  const router = useRouter();
  const { userData } = useAuth();
  const { currency, formatPrice } = useCurrency();
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingCourses, setPendingCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "mine" | "available">("all");

  // Enrollment Modal State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | null>(null);

  // Enrollment Flow State
  const [step, setStep] = useState<1 | 2>(1); // 1: Batch, 2: Payment
  const [paymentMethod, setPaymentMethod] = useState<'request' | 'transfer'>('request');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [websitePaymentEmail, setWebsitePaymentEmail] = useState("");
  const [websitePaymentName, setWebsitePaymentName] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false); // For Card (Active)
  const [pendingApproval, setPendingApproval] = useState(false); // For Transfer (Pending)
  const [bankDetails, setBankDetails] = useState<{ bankName: string; accountName: string; accountNumber: string; branch: string } | null>(null);

  useEffect(() => {
    fetchCourses();
    const loadSettings = async () => {
      try {
        const s = await settingsService.getSettings();
        if (s.bankDetails) {
          setBankDetails(s.bankDetails as any);
        }
      } catch { }
    };
    
    const checkPending = async () => {
      if (userData) {
        try {
          const enrollments = await enrollmentService.getUserEnrollments(userData.uid);
          const pending = enrollments
            .filter(e => e.status === 'pending' || e.status === 'pending_payment')
            .map(e => e.courseId);
          setPendingCourses(pending);
        } catch (err) {
          console.error("Error checking pending enrollments:", err);
        }
      }
    };

    loadSettings();
    checkPending();
  }, [userData]);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getPublishedCourses();
      // Filter out closed courses
      const availableCourses = data.filter(c => c.enrollmentStatus !== 'closed');
      setCourses(availableCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEnrollmentStatus = (courseId: string) => {
    if (userData?.enrolledCourses?.includes(courseId)) return 'active';
    if (pendingCourses.includes(courseId)) return 'pending';
    return 'none';
  };

  const handleOpenEnrollModal = async (course: Course) => {
    setSelectedCourse(course);
    setSelectedBatchId(null);
    setSelectedTimeSlotId(null);
    setEnrollSuccess(false);
    setPendingApproval(false);
    setStep(1);
    setPaymentMethod('request');
    setReceiptFile(null);
    setWebsitePaymentEmail("");
    setWebsitePaymentName("");
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

    // Validation for Request
    if (paymentMethod === 'request' && (!websitePaymentEmail || !websitePaymentName)) {
      alert("Please enter the name and email you used on the website.");
      return;
    }

    setEnrolling(true);
    try {
      const selectedBatch = batches.find(b => b.id === selectedBatchId)!;
      const selectedSlot = selectedBatch.timeSlots?.find(s => s.id === (selectedTimeSlotId || ""));
      if (selectedBatch.timeSlots && selectedBatch.timeSlots.length > 0 && !selectedSlot) {
        alert("Please select a time slot.");
        setEnrolling(false);
        return;
      }
      if (selectedSlot && !selectedSlot.id) {
        alert("Invalid time slot. Please choose again.");
        setEnrolling(false);
        return;
      }
      // Enforce LKR across the site
      const priceLKR = selectedCourse.priceLKR || selectedCourse.price || 0;
      const finalAmount = priceLKR;
      const finalCurrency = 'LKR';

      await enrollmentService.createEnrollment(
        userData.uid,
        userData.email,
        userData.name,
        selectedCourse,
        selectedBatch,
        paymentMethod === 'request' ? 'website' : 'transfer',
        finalAmount,
        receiptFile || undefined,
        selectedSlot ? { id: selectedSlot.id, label: selectedSlot.label } : null,
        paymentMethod === 'request' ? websitePaymentEmail : undefined,
        paymentMethod === 'request' ? websitePaymentName : undefined
      );

      setPendingApproval(true);
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
      
      if (enrollSuccess) {
        router.push("/dashboard");
      }
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

  const isMine = (id: string) => getEnrollmentStatus(id) !== "none";
  const counts = { mine: courses.filter((c) => isMine(c.id)).length, available: courses.filter((c) => !isMine(c.id)).length };
  const visibleCourses = filter === "all" ? courses : courses.filter((c) => (filter === "mine") === isMine(c.id));

  return (
    <div className="w-full max-w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Header */}
      <section className="sl-hero sl-rise relative overflow-hidden rounded-[26px] p-5 md:p-8 text-white">
        <span aria-hidden className="sl-float absolute -right-12 -top-20 w-56 h-56 rounded-full bg-[radial-gradient(circle,#9EB0FF,transparent_70%)] opacity-60" />
        <span aria-hidden className="sl-float absolute right-40 -bottom-24 w-44 h-44 rounded-full bg-[radial-gradient(circle,#FFB070,transparent_70%)] opacity-50" style={{ animationDelay: "-3s" }} />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <h1 className="text-[24px] md:text-[34px] font-extrabold leading-tight">Courses</h1>
            <p className="text-[#DCE2FF] mt-1.5 text-sm md:text-base">
              Continue your enrolled courses, or pick a new one, choose your batch and start learning.
            </p>
          </div>
          <div className="flex gap-2.5">
            <div className="rounded-2xl bg-white/15 border border-white/25 px-4 py-2.5 text-center min-w-[92px]">
              <b className="block font-display text-2xl">{counts.mine}</b>
              <span className="text-[12px] text-[#DCE2FF]">Enrolled</span>
            </div>
            <div className="rounded-2xl bg-white/15 border border-white/25 px-4 py-2.5 text-center min-w-[92px]">
              <b className="block font-display text-2xl">{counts.available}</b>
              <span className="text-[12px] text-[#DCE2FF]">Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter tabs */}
      <div role="tablist" aria-label="Course filter" className="flex gap-1 p-1.5 bg-white dark:bg-slate-900 border border-line dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar w-fit max-w-full">
        {([
          { id: "all", label: "All courses", icon: ListBullets, n: courses.length },
          { id: "mine", label: "My courses", icon: Books, n: counts.mine },
          { id: "available", label: "Available", icon: Storefront, n: counts.available },
        ] as const).map((t) => {
          const on = filter === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(t.id)}
              className={`h-10 px-4 rounded-xl inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors ${on ? "bg-ink text-white shadow-[0_4px_12px_rgba(15,23,42,.18)]" : "text-slate-600 dark:text-slate-300 hover:text-ink"}`}
            >
              <t.icon size={18} weight={on ? "fill" : "regular"} />
              {t.label}
              <span className={`text-[11.5px] px-1.5 rounded-full ${on ? "bg-white/20" : "bg-soft text-primary"}`}>{t.n}</span>
            </button>
          );
        })}
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {visibleCourses.map((course, i) => {
          const status = getEnrollmentStatus(course.id);
          return (
            <article
              key={course.id}
              className="sl-card sl-card-hover sl-rise group flex flex-col overflow-hidden"
              style={{ animationDelay: `${0.05 + i * 0.04}s` }}
            >
              {/* Colour band with icon + status */}
              <div className="relative h-24 bg-gradient-to-br from-[#EEF1FF] to-[#FFF1E6] dark:from-slate-800 dark:to-slate-800 flex items-end justify-between px-5 pb-3">
                <span className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm text-primary flex items-center justify-center translate-y-6">
                  <BookOpenText size={24} weight="duotone" />
                </span>
                <div className="flex flex-wrap justify-end gap-1.5 self-start mt-3">
                  {status === "active" && <span className="pill-sm bg-[#E6F8F1] text-[#08795A]">Enrolled</span>}
                  {status === "pending" && <span className="pill-sm bg-[#FFF5E0] text-[#8A5300]">Pending approval</span>}
                  {course.level && <span className="pill-sm bg-white/80 text-primary">{course.level}</span>}
                </div>
              </div>

              <div className="p-5 pt-8 flex flex-col gap-3 flex-1">
                <Link href={`/courses/${course.id}`} className="min-w-0">
                  <h3 className="text-[17px] font-bold text-ink dark:text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                </Link>
                {course.description && (
                  <p className="text-[13.5px] text-ink-muted line-clamp-2">{course.description}</p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-muted">
                  {course.instructorName && (
                    <span className="inline-flex items-center gap-1.5"><ChalkboardTeacher size={16} /> {course.instructorName}</span>
                  )}
                  <span className="inline-flex items-center gap-1.5"><ClockIcon size={16} /> Flexible</span>
                  <span className="inline-flex items-center gap-1.5"><ListBullets size={16} /> {course.lessonsCount || 0} lessons</span>
                  {course.includesCertificate && (
                    <span className="inline-flex items-center gap-1.5"><Certificate size={16} /> Certificate</span>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-line dark:border-slate-800 flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-muted">Course fee</span>
                    <span className="font-display text-xl font-extrabold text-ink dark:text-white">
                      {formatPrice(course.priceLKR || course.price, course.priceUSD)}
                    </span>
                  </div>
                  {status === "active" ? (
                    <Link href={`/courses/${course.id}`} className="sl-btn sl-btn-soft w-full">
                      <Play size={16} weight="fill" /> Continue learning
                    </Link>
                  ) : status === "pending" ? (
                    <div className="sl-btn w-full bg-[#FFF5E0] text-[#8A5300] cursor-default hover:transform-none">
                      <ClockIcon size={16} /> Waiting for approval
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/courses/${course.id}`} className="sl-btn sl-btn-outline">Details</Link>
                      <button type="button" onClick={() => handleOpenEnrollModal(course)} className="sl-btn sl-btn-primary">
                        Enroll now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visibleCourses.length === 0 && (
        <div className="w-full max-w-full mx-auto text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 overflow-hidden">
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

                          {/* Time Slot selector when a batch is selected and it has slots */}
                          {selectedBatchId && (() => {
                            const b = batches.find(x => x.id === selectedBatchId);
                            if (!b?.timeSlots || b.timeSlots.length === 0) return null;
                            return (
                              <div className="mt-4 space-y-2">
                                <div className="font-semibold text-sm">Select your time slot</div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {b.timeSlots.map(slot => {
                                    const used = (slot.enrolledCount || 0) + (slot.reservedCount || 0);
                                    const full = slot.capacity !== undefined && slot.capacity > 0 && used >= slot.capacity;
                                    return (
                                      <div
                                        key={slot.id}
                                        onClick={() => !full && setSelectedTimeSlotId(slot.id)}
                                        className={`cursor-pointer p-3 rounded-lg border flex items-center justify-between ${selectedTimeSlotId === slot.id ? 'border-brand-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'} ${full ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        <div className="text-sm">{slot.label}</div>
                                        <div className="text-xs text-gray-600">{used}/{slot.capacity || '∞'}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                          <div className="flex gap-3 pt-2">
                            <Button variant="ghost" fullWidth onClick={closeModal}>Cancel</Button>
                            <Button
                              fullWidth
                              disabled={!selectedBatchId || (() => {
                                const b = batches.find(x => x.id === selectedBatchId);
                                if (!b?.timeSlots || b.timeSlots.length === 0) return false;
                                return !selectedTimeSlotId;
                              })()}
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
                          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <button
                              onClick={() => setPaymentMethod('request')}
                              className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${paymentMethod === 'request'
                                ? 'bg-white dark:bg-gray-700 text-brand-blue shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                              <BookOpen size={16} />
                              Request Access
                            </button>
                            <button
                              onClick={() => setPaymentMethod('transfer')}
                              className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${paymentMethod === 'transfer'
                                ? 'bg-white dark:bg-gray-700 text-brand-blue shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                              <Landmark size={16} />
                              Bank Transfer
                            </button>
                          </div>

                          {paymentMethod === 'request' ? (
                            <div className="space-y-4">
                              <div className="p-4 border border-blue-100 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-xl text-center">
                                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Already Paid via Website?</p>
                                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">If you have already made a payment through our main website, please request access here. Our team will verify and activate your course.</p>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name used on website</label>
                                  <input
                                    type="text"
                                    value={websitePaymentName}
                                    onChange={(e) => setWebsitePaymentName(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
                                    placeholder="John Doe"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email used on website</label>
                                  <input
                                    type="email"
                                    value={websitePaymentEmail}
                                    onChange={(e) => setWebsitePaymentEmail(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand-blue"
                                    placeholder="john@example.com"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-sm font-medium pt-2">
                                <span>Course Price:</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatPrice(selectedCourse?.priceLKR || selectedCourse?.price, selectedCourse?.priceUSD)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {bankDetails ? (
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                  <p><span className="font-semibold text-gray-900 dark:text-white">Bank:</span> {bankDetails.bankName}</p>
                                  <p><span className="font-semibold text-gray-900 dark:text-white">Account Name:</span> {bankDetails.accountName}</p>
                                  <p><span className="font-semibold text-gray-900 dark:text-white">Account Number:</span> {bankDetails.accountNumber}</p>
                                  <p><span className="font-semibold text-gray-900 dark:text-white">Branch:</span> {bankDetails.branch}</p>
                                </div>
                              ) : (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl text-sm text-yellow-700 dark:text-yellow-300">
                                  Bank details are not configured. Please contact support.
                                </div>
                              )}

                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Receipt</label>
                                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer relative">
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
                              disabled={
                                enrolling ||
                                (paymentMethod === 'transfer' && !receiptFile) ||
                                (paymentMethod === 'request' && (!websitePaymentEmail || !websitePaymentName))
                              }
                              onClick={handleEnroll}
                            >
                              {enrolling ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : paymentMethod === 'request' ? (
                                "Request Access"
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
