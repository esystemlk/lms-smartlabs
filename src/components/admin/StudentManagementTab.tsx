"use client";

import { useState, useEffect, useMemo } from "react";
import { UserData, Enrollment, Course, Batch } from "@/lib/types";
import { userService } from "@/services/userService";
import { enrollmentService } from "@/services/enrollmentService";
import { courseService } from "@/services/courseService";
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

  const fetchBatches = async (courseId: string) => {
    try {
      const data = await courseService.getBatches(courseId);
      setBatches(data);
    } catch (error) {
      console.error("Error fetching batches:", error);
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
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {enrollment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-brand-blue hover:bg-brand-blue/10">
                      <ChevronRight size={18} />
                    </Button>
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
    </div>
  );
}
