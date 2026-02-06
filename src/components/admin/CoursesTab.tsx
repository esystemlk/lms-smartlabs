"use client";

import { useState } from "react";
import { Course, Enrollment } from "@/lib/types";
import { Search, Filter, MoreVertical, Eye, Trash2, BookOpen, Edit, CheckCircle, XCircle, Users, Download } from "lucide-react";
import { courseService } from "@/services/courseService";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface CoursesTabProps {
  courses: Course[];
  enrollments?: Enrollment[];
  onCourseUpdated: () => void;
}

export function CoursesTab({ courses, enrollments = [], onCourseUpdated }: CoursesTabProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "published" ? course.published : !course.published);
    return matchesSearch && matchesStatus;
  });

  const handleExportStudents = (course: Course) => {
    const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
    if (courseEnrollments.length === 0) {
      alert("No students enrolled in this course to export.");
      return;
    }

    const data = courseEnrollments.map(e => ({
      "Student Name": e.userName,
      "Email": e.userEmail,
      "Batch": e.batchName || "N/A",
      "Enrolled Date": e.enrolledAt?.seconds ? new Date(e.enrolledAt.seconds * 1000).toLocaleDateString() : "N/A",
      "Status": e.status,
      "Progress (%)": e.progress || 0,
      "Payment Method": e.paymentMethod,
      "Amount Paid": e.amount || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    const filename = `${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_students.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      setProcessingId(course.id);
      await courseService.updateCourse(course.id, { published: !course.published });
      onCourseUpdated();
    } catch (error) {
      console.error("Failed to update course:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleEnrollment = async (course: Course) => {
    try {
      setProcessingId(course.id);
      // Default to 'open' if undefined. If currently 'closed', switch to 'open', else 'closed'.
      const newStatus = course.enrollmentStatus === 'closed' ? 'open' : 'closed';
      await courseService.updateCourse(course.id, { enrollmentStatus: newStatus });
      onCourseUpdated();
    } catch (error) {
      console.error("Failed to update course enrollment status:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    
    try {
      setProcessingId(courseId);
      await courseService.deleteCourse(courseId);
      onCourseUpdated();
    } catch (error) {
      console.error("Failed to delete course:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header / Controls */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Course Management</h2>
        
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 md:pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>
          
          <div className="relative w-full md:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto pl-9 md:pl-10 pr-8 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 md:px-6 md:py-4">Course</th>
              <th className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4">Instructor</th>
              <th className="hidden md:table-cell px-4 py-3 md:px-6 md:py-4">Stats</th>
              <th className="px-4 py-3 md:px-6 md:py-4">Status</th>
              <th className="px-4 py-3 md:px-6 md:py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCourses.map((course) => {
              const studentCount = enrollments.filter(e => e.courseId === course.id).length;
              const courseRevenue = enrollments
                .filter(e => e.courseId === course.id)
                .reduce((sum, e) => sum + (e.amount || 0), 0);
              return (
              <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 md:px-6 md:py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden">
                      {course.image ? (
                        <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen size={16} className="md:w-5 md:h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm md:text-base line-clamp-1 max-w-[150px] md:max-w-[200px]">{course.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1 max-w-[150px] md:max-w-[200px]">{course.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 md:px-6 md:py-4">
                  <div className="text-xs md:text-sm text-gray-900">{course.instructorName}</div>
                </td>
                <td className="px-4 py-3 md:px-6 md:py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs md:text-sm text-gray-500">{course.lessonsCount} Lessons</span>
                    <div className="flex items-center gap-2 text-[11px] md:text-xs text-gray-600">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full">
                        <Users size={12} className="text-gray-400" />
                        <span>{studentCount}</span>
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        <span>LKR {courseRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 md:px-6 md:py-4">
                  <div className="flex flex-col gap-2 items-start">
                    <button 
                        onClick={() => handleTogglePublish(course)}
                        disabled={processingId === course.id}
                        className={`inline-flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[10px] md:text-xs font-medium transition-colors ${
                        course.published 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        {course.published ? (
                        <><CheckCircle size={10} className="md:w-3 md:h-3" /> Published</>
                        ) : (
                        <><XCircle size={10} className="md:w-3 md:h-3" /> Draft</>
                        )}
                    </button>

                    <button 
                        onClick={() => handleToggleEnrollment(course)}
                        disabled={processingId === course.id}
                        className={`inline-flex items-center gap-1 md:gap-1.5 px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-[10px] md:text-xs font-medium transition-colors ${
                        course.enrollmentStatus === 'closed'
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                    >
                        {course.enrollmentStatus === 'closed' ? (
                        <><XCircle size={10} className="md:w-3 md:h-3" /> Enr. Closed</>
                        ) : (
                        <><CheckCircle size={10} className="md:w-3 md:h-3" /> Enr. Open</>
                        )}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleExportStudents(course)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Export Student Data (Excel)"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => router.push(`/courses/${course.id}`)}
                      className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Course"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => router.push(`/courses/${course.id}/edit`)}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Edit Course"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(course.id)}
                      disabled={processingId === course.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      {filteredCourses.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          No courses found matching your search.
        </div>
      )}
    </div>
  );
}
