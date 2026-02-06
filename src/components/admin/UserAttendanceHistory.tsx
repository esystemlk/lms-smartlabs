"use client";

import { useState, useEffect } from "react";
import { AttendanceRecord, Course } from "@/lib/types";
import { attendanceService } from "@/services/attendanceService";
import { courseService } from "@/services/courseService";
import { Loader2, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface UserAttendanceHistoryProps {
  userId: string;
}

export function UserAttendanceHistory({ userId }: UserAttendanceHistoryProps) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Record<string, string>>({}); // id -> title

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [attendanceData, coursesData] = await Promise.all([
          attendanceService.getUserAttendance(userId),
          courseService.getAllCourses()
        ]);
        
        setRecords(attendanceData);
        
        const courseMap: Record<string, string> = {};
        coursesData.forEach(c => courseMap[c.id] = c.title);
        setCourses(courseMap);
        
      } catch (error) {
        console.error("Failed to load user attendance:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No attendance records found for this user.
      </div>
    );
  }

  // Group by Course
  const groupedRecords: Record<string, AttendanceRecord[]> = {};
  records.forEach(r => {
    if (!groupedRecords[r.courseId]) {
      groupedRecords[r.courseId] = [];
    }
    groupedRecords[r.courseId].push(r);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedRecords).map(([courseId, courseRecords]) => (
        <div key={courseId} className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-blue" />
            {courses[courseId] || "Unknown Course"}
            <span className="text-xs font-normal text-gray-500 ml-2">
              ({courseRecords.filter(r => r.status === 'present').length}/{courseRecords.length} Present)
            </span>
          </h3>
          
          <div className="space-y-2">
            {courseRecords.map(record => (
              <div key={record.id} className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {record.status === 'present' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {record.status === 'absent' && <XCircle className="w-4 h-4 text-red-500" />}
                  {record.status === 'late' && <Clock className="w-4 h-4 text-yellow-500" />}
                  {record.status === 'excused' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                  
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {record.date?.seconds 
                        ? format(new Date(record.date.seconds * 1000), "MMMM d, yyyy") 
                        : "Unknown Date"}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {record.method === 'zoom_auto' ? 'Zoom Auto-Join' : 'Manual Entry'}
                    </div>
                  </div>
                </div>
                
                <span className={`text-xs px-2 py-1 rounded-full capitalize
                  ${record.status === 'present' ? 'bg-green-100 text-green-700' : 
                    record.status === 'absent' ? 'bg-red-100 text-red-700' :
                    record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'}`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
