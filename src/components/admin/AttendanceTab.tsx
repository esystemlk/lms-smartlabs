"use client";

import { useState, useEffect } from "react";
import { Course, Batch, Enrollment, AttendanceRecord, UserData } from "@/lib/types";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { attendanceService } from "@/services/attendanceService";
import { format } from "date-fns";
import { Loader2, Calendar, Check, Save, Filter, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import * as XLSX from "xlsx";

export function AttendanceTab() {
  const { userData } = useAuth();
  const { toast } = useToast();
  
  // Data State
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  
  // Selection State
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceRecord['status']>>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Load Courses on Mount
  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await courseService.getAllCourses();
        setCourses(data);
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  // Load Batches when Course Changes
  useEffect(() => {
    if (!selectedCourseId) {
      setBatches([]);
      setEnrollments([]);
      return;
    }

    async function loadBatchesAndEnrollments() {
      setLoading(true);
      try {
        const [batchesData, enrollmentsData] = await Promise.all([
          courseService.getBatches(selectedCourseId),
          enrollmentService.getCourseEnrollments(selectedCourseId)
        ]);
        setBatches(batchesData);
        setEnrollments(enrollmentsData);
        
        // Reset batch selection if not in new list
        if (selectedBatchId && !batchesData.find(b => b.id === selectedBatchId)) {
          setSelectedBatchId("");
        }
      } catch (error) {
        console.error("Failed to load course data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadBatchesAndEnrollments();
  }, [selectedCourseId]);

  // Load Attendance when Context Changes
  useEffect(() => {
    if (!selectedCourseId || !selectedDate) return;

    async function loadAttendance() {
      setLoading(true);
      try {
        // Create date range for the selected day
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const records = await attendanceService.getAttendance(
          selectedCourseId, 
          selectedBatchId || undefined, 
          startOfDay, 
          endOfDay
        );
        
        setExistingRecords(records);
        
        // Initialize status map
        const initialStatus: Record<string, AttendanceRecord['status']> = {};
        records.forEach(record => {
          const key = record.batchId ? `${record.userId}_${record.batchId}` : record.userId;
          initialStatus[key] = record.status;
        });
        setStatusMap(initialStatus);
      } catch (error) {
        console.error("Failed to load attendance:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, [selectedCourseId, selectedBatchId, selectedDate]);

  // Filter students based on batch and search
  const filteredStudents = enrollments.filter(enrollment => {
    // Filter by Batch (if selected)
    if (selectedBatchId && enrollment.batchId !== selectedBatchId) return false;
    
    // Filter by Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        enrollment.userName.toLowerCase().includes(term) ||
        enrollment.userEmail.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  const handleStatusChange = (userId: string, batchId: string, status: AttendanceRecord['status']) => {
    const key = batchId ? `${userId}_${batchId}` : userId;
    setStatusMap(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const handleSave = async () => {
    if (!selectedCourseId || !selectedDate) return;
    
    setSaving(true);
    try {
      const promises: Promise<any>[] = [];
      const dateObj = new Date(selectedDate);
      
      // Iterate through all filtered students
      for (const student of filteredStudents) {
        const key = student.batchId ? `${student.userId}_${student.batchId}` : student.userId;
        const newStatus = statusMap[key];
        const existingRecord = existingRecords.find(r => r.userId === student.userId && r.batchId === student.batchId);
        
        if (newStatus) {
          if (existingRecord) {
            // Update if changed
            if (existingRecord.status !== newStatus) {
              promises.push(attendanceService.updateAttendanceRecord(existingRecord.id!, {
                status: newStatus
              }));
            }
          } else {
            // Create new record
            promises.push(attendanceService.markAttendance({
              userId: student.userId,
              userEmail: student.userEmail,
              userName: student.userName,
              courseId: selectedCourseId,
              batchId: student.batchId, // Use student's actual batch ID
              date: Timestamp.fromDate(dateObj),
              status: newStatus,
              method: 'manual',
              recordedBy: userData?.uid
            }));
          }
        } else if (existingRecord) {
          // Optional: If status is cleared (not implemented in UI but logic-wise), delete record?
          // For now, we only assume setting status. 
          // If we want to support "unmarking", we'd check if newStatus is undefined/null and delete.
        }
      }
      
      await Promise.all(promises);
      
      // Reload attendance to confirm
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const records = await attendanceService.getAttendance(
        selectedCourseId, 
        selectedBatchId || undefined, 
        startOfDay, 
        endOfDay
      );
      setExistingRecords(records);
      
      toast("Attendance saved successfully!", "success");
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast("Failed to save attendance. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status: AttendanceRecord['status']) => {
    const newMap = { ...statusMap };
    filteredStudents.forEach(student => {
      const key = student.batchId ? `${student.userId}_${student.batchId}` : student.userId;
      newMap[key] = status;
    });
    setStatusMap(newMap);
  };

  const handleExportAttendance = async () => {
    if (!selectedCourseId) return;
    setExporting(true);
    
    try {
      // 1. Fetch ALL attendance records for this course/batch (no date limit)
      // We need a new service method or just use existing with wide range?
      // Let's assume we want "All time" history for the current students.
      // Fetching everything might be heavy but manageable for < 1000 records.
      
      const allRecords = await attendanceService.getAttendance(
        selectedCourseId, 
        selectedBatchId || undefined
      );

      // 2. Prepare Data Matrix
      // Rows: Students
      // Columns: Dates
      
      // Get all unique dates
      const dates = Array.from(new Set(allRecords.map(r => 
        r.date?.seconds ? format(new Date(r.date.seconds * 1000), "yyyy-MM-dd") : "Unknown"
      ))).sort();

      // Map filtered students to rows
      const data = filteredStudents.map(student => {
        const studentRecords = allRecords.filter(r => r.userId === student.userId);
        const row: any = {
          "Student Name": student.userName,
          "Email": student.userEmail,
          "Batch": student.batchName || "N/A"
        };

        // Fill attendance for each date
        dates.forEach(date => {
          const record = studentRecords.find(r => {
             const rDate = r.date?.seconds ? format(new Date(r.date.seconds * 1000), "yyyy-MM-dd") : "";
             return rDate === date;
          });
          row[date] = record ? record.status : "-";
        });
        
        // Add Summary Stats
        const presentCount = studentRecords.filter(r => r.status === 'present').length;
        const totalMarked = studentRecords.length;
        row["Total Present"] = presentCount;
        row["Attendance %"] = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) + "%" : "0%";

        return row;
      });

      // 3. Generate Excel
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
      
      const courseTitle = courses.find(c => c.id === selectedCourseId)?.title || "Course";
      const filename = `${courseTitle.replace(/[^a-z0-9]/gi, '_')}_Attendance_Report.xlsx`;
      
      XLSX.writeFile(wb, filename);
      toast("Attendance report downloaded!", "success");

    } catch (error) {
      console.error("Failed to export attendance:", error);
      toast("Failed to export attendance report.", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-brand-blue" />
          Attendance Filters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Course Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none"
            >
              <option value="">-- Select Course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          {/* Batch Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch (Optional)</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={!selectedCourseId}
              className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">-- All Batches --</option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none"
              />
            </div>
          </div>

          {/* Export Button */}
          <div className="flex items-end">
             <Button 
              onClick={handleExportAttendance}
              disabled={!selectedCourseId || exporting}
              variant="outline"
              className="w-full flex items-center gap-2 justify-center rounded-xl h-[42px]"
            >
              {exporting ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {selectedCourseId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 p-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue/20 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => markAll('present')}>Mark All Present</Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="min-w-[100px]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Batch</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No students found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{student.userName}</div>
                        <div className="text-xs text-gray-500">{student.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {student.batchName || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(student.userId, student.batchId, status)}
                              className={`
                                px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border
                                ${statusMap[student.batchId ? `${student.userId}_${student.batchId}` : student.userId] === status
                                  ? status === 'present' ? 'bg-green-100 text-green-700 border-green-200'
                                  : status === 'absent' ? 'bg-red-100 text-red-700 border-red-200'
                                  : status === 'late' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                  : 'bg-blue-100 text-blue-700 border-blue-200'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }
                              `}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
