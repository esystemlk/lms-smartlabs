"use client";

import { useState, useEffect, useMemo } from "react";
import { UserData, Enrollment, Course, Batch } from "@/lib/types";
import { userService } from "@/services/userService";
import { enrollmentService } from "@/services/enrollmentService";
import { courseService } from "@/services/courseService";
import { useToast } from "@/components/ui/Toast";
import { 
  Search, 
  Filter, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  Globe, 
  Loader2,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { 
  X, 
  Trash2, 
  UserMinus, 
  ShieldX, 
  CheckCircle2, 
  RefreshCcw,
  AlertTriangle 
} from "lucide-react";

export function StudentManagementTab() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string>("all");

  // Management State
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Edit Modal Specific
  const [editCourseId, setEditCourseId] = useState("");
  const [editBatchId, setEditBatchId] = useState("");
  const [editTimeSlotId, setEditTimeSlotId] = useState("");
  const [editBatches, setEditBatches] = useState<Batch[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [usersData, enrollmentsData, coursesData] = await Promise.all([
        userService.getAllUsers(),
        enrollmentService.getAllEnrollments(),
        courseService.getAllCourses(),
      ]);
      setUsers(usersData);
      setEnrollments(enrollmentsData);
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch batches when course changes
  useEffect(() => {
    if (selectedCourseId !== "all") {
      fetchBatches(selectedCourseId);
    } else {
      setBatches([]);
      setSelectedBatchId("all");
      setSelectedTimeSlotId("all");
    }
  }, [selectedCourseId]);

  const fetchBatches = async (courseId: string, forEdit = false) => {
    try {
      const data = await courseService.getBatches(courseId);
      if (forEdit) {
        setEditBatches(data);
      } else {
        setBatches(data);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const handleEditClick = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setEditCourseId(enrollment.courseId);
    setEditBatchId(enrollment.batchId);
    setEditTimeSlotId(enrollment.timeSlotId || "");
    fetchBatches(enrollment.courseId, true);
    setIsEditModalOpen(true);
  };

  const handleUpdateEnrollment = async () => {
    if (!selectedEnrollment) return;
    try {
      setProcessing(true);
      const course = courses.find(c => c.id === editCourseId)!;
      const batch = editBatches.find(b => b.id === editBatchId)!;
      const slot = batch.timeSlots?.find(s => s.id === editTimeSlotId);

      await enrollmentService.updateStudentEnrollment(
        selectedEnrollment.id,
        course,
        batch,
        slot ? { id: slot.id, label: slot.label } : null
      );
      
      await fetchInitialData();
      setIsEditModalOpen(false);
      toast("Student enrollment updated successfully", "success");
    } catch (error: any) {
      toast(error.message || "Failed to update enrollment", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusToggle = async (status: Enrollment['status']) => {
    if (!selectedEnrollment) return;
    try {
      setProcessing(true);
      await enrollmentService.toggleEnrollmentStatus(selectedEnrollment.id, status);
      await fetchInitialData();
      setIsStatusModalOpen(false);
      toast(`Status updated to ${status}`, "success");
    } catch (error: any) {
      toast(error.message || "Failed to update status", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!selectedEnrollment) return;
    try {
      setProcessing(true);
      await enrollmentService.deleteEnrollment(selectedEnrollment.id);
      await fetchInitialData();
      setIsDeleteModalOpen(false);
      toast("Student removed from course", "success");
    } catch (error: any) {
      toast(error.message || "Failed to delete enrollment", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Filtered Students/Enrollments
  const displayData = useMemo(() => {
    return enrollments.filter(enrollment => {
      // 1. Search by email or name
      const matchesSearch = 
        enrollment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.userName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Filter by Course
      const matchesCourse = selectedCourseId === "all" || enrollment.courseId === selectedCourseId;
      
      // 3. Filter by Batch
      const matchesBatch = selectedBatchId === "all" || enrollment.batchId === selectedBatchId;
      
      // 4. Filter by Time Slot
      const matchesTimeSlot = selectedTimeSlotId === "all" || enrollment.timeSlotId === selectedTimeSlotId;

      return matchesSearch && matchesCourse && matchesBatch && matchesTimeSlot;
    });
  }, [enrollments, searchTerm, selectedCourseId, selectedBatchId, selectedTimeSlotId]);

  // Available Time Slots for selected batch
  const availableTimeSlots = useMemo(() => {
    if (selectedBatchId === "all") return [];
    const batch = batches.find(b => b.id === selectedBatchId);
    return batch?.timeSlots || [];
  }, [selectedBatchId, batches]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          {/* Course Filter */}
          <div className="md:w-64">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Batch Filter */}
          <div className="md:w-64">
            <select
              disabled={selectedCourseId === "all"}
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all appearance-none bg-white cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="all">All Batches</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
          </div>

          {/* Time Slot Filter */}
          <div className="md:w-64">
            <select
              disabled={selectedBatchId === "all"}
              value={selectedTimeSlotId}
              onChange={(e) => setSelectedTimeSlotId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all appearance-none bg-white cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="all">All Time Slots</option>
              {availableTimeSlots.map(slot => (
                <option key={slot.id} value={slot.id}>{slot.label}</option>
              ))}
            </select>
          </div>

          <Button 
            variant="ghost" 
            onClick={() => {
              setSearchTerm("");
              setSelectedCourseId("all");
              setSelectedBatchId("all");
              setSelectedTimeSlotId("all");
            }}
            className="text-gray-500"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Course & Batch</th>
                <th className="px-6 py-4">Time Slot</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayData.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold">
                        {enrollment.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{enrollment.userName}</div>
                        <div className="text-sm text-gray-500">{enrollment.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <BookOpen size={14} className="text-gray-400" />
                        {enrollment.courseTitle}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={14} className="text-gray-400" />
                        {enrollment.batchName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {enrollment.timeSlotLabel ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} className="text-gray-400" />
                        {enrollment.timeSlotLabel}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Regular</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                      enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      enrollment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      enrollment.status === 'banned' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {enrollment.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditClick(enrollment)}
                        className="text-brand-blue hover:bg-brand-blue/10"
                        title="Change Course/Batch"
                      >
                        <RefreshCcw size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedEnrollment(enrollment);
                          setIsStatusModalOpen(true);
                        }}
                        className="text-amber-600 hover:bg-amber-50"
                        title="Change Status / Ban"
                      >
                        <ShieldX size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedEnrollment(enrollment);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:bg-red-50"
                        title="Remove Student"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayData.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <GraduationCap size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No students found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Edit Course/Batch Modal */}
      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !processing && setIsEditModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-xl font-bold">Transfer Student</Dialog.Title>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">New Course</label>
                      <select 
                        value={editCourseId}
                        onChange={(e) => {
                          setEditCourseId(e.target.value);
                          fetchBatches(e.target.value, true);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 outline-none appearance-none bg-white font-medium"
                      >
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">New Batch</label>
                      <select 
                        value={editBatchId}
                        onChange={(e) => setEditBatchId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 outline-none appearance-none bg-white font-medium"
                      >
                        {editBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    
                    {editBatchId && (() => {
                      const b = editBatches.find(x => x.id === editBatchId);
                      if (!b || !b.timeSlots || b.timeSlots.length === 0) return null;
                      return (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Time Slot</label>
                          <select 
                            value={editTimeSlotId}
                            onChange={(e) => setEditTimeSlotId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 outline-none appearance-none bg-white font-medium"
                          >
                            <option value="">No specific slot</option>
                            {b.timeSlots.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                        </div>
                      );
                    })()}

                    <div className="pt-4 flex gap-3">
                      <Button variant="ghost" fullWidth onClick={() => setIsEditModalOpen(false)} disabled={processing}>Cancel</Button>
                      <Button fullWidth onClick={handleUpdateEnrollment} disabled={processing} className="bg-brand-blue shadow-lg shadow-blue-100">
                        {processing ? "Updating..." : "Confirm Transfer"}
                      </Button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Status/Ban Modal */}
      <Transition appear show={isStatusModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !processing && setIsStatusModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title className="text-xl font-bold mb-2">Change Status</Dialog.Title>
                  <p className="text-sm text-gray-500 mb-6">Update {selectedEnrollment?.userName}'s access level for this course.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleStatusToggle('active')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group ${
                        selectedEnrollment?.status === 'active' ? 'border-green-600 bg-green-50' : 'border-gray-100 hover:border-green-500 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle2 className={`${selectedEnrollment?.status === 'active' ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'}`} size={24} />
                      <span className="text-sm font-bold">Active</span>
                    </button>
                    <button 
                      onClick={() => handleStatusToggle('completed')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group ${
                        selectedEnrollment?.status === 'completed' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-500 hover:bg-blue-50'
                      }`}
                    >
                      <GraduationCap className={`${selectedEnrollment?.status === 'completed' ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} size={24} />
                      <span className="text-sm font-bold">Completed</span>
                    </button>
                    <button 
                      onClick={() => handleStatusToggle('pending')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group ${
                        selectedEnrollment?.status === 'pending' ? 'border-amber-600 bg-amber-50' : 'border-gray-100 hover:border-amber-500 hover:bg-amber-50'
                      }`}
                    >
                      <Clock className={`${selectedEnrollment?.status === 'pending' ? 'text-amber-600' : 'text-gray-400 group-hover:text-amber-600'}`} size={24} />
                      <span className="text-sm font-bold">Pending</span>
                    </button>
                    <button 
                      onClick={() => handleStatusToggle('banned')}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group ${
                        selectedEnrollment?.status === 'banned' ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-red-500 hover:bg-red-50'
                      }`}
                    >
                      <ShieldX className={`${selectedEnrollment?.status === 'banned' ? 'text-red-600' : 'text-gray-400 group-hover:text-red-600'}`} size={24} />
                      <span className="text-sm font-bold">Ban Access</span>
                    </button>
                  </div>

                  <Button variant="ghost" fullWidth onClick={() => setIsStatusModalOpen(false)} className="mt-6" disabled={processing}>Cancel</Button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete/Remove Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !processing && setIsDeleteModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-3xl bg-white p-6 text-center align-middle shadow-xl transition-all">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserMinus size={32} />
                  </div>
                  <Dialog.Title className="text-xl font-bold mb-2">Remove student?</Dialog.Title>
                  <p className="text-sm text-gray-500 mb-6 px-4">
                    This will permanently delete the enrollment for <span className="font-bold text-gray-900">{selectedEnrollment?.userName}</span> from this course.
                  </p>
                  
                  <div className="flex gap-3">
                    <Button variant="ghost" fullWidth onClick={() => setIsDeleteModalOpen(false)} disabled={processing}>Cancel</Button>
                    <Button 
                      fullWidth 
                      variant="destructive" 
                      className="shadow-lg shadow-red-100" 
                      onClick={handleDeleteEnrollment} 
                      disabled={processing}
                    >
                      {processing ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
