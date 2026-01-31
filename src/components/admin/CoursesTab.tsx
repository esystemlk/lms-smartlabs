"use client";

import { useState } from "react";
import { Course } from "@/lib/types";
import { Search, Filter, MoreVertical, Eye, Trash2, BookOpen, Edit, CheckCircle, XCircle } from "lucide-react";
import { courseService } from "@/services/courseService";
import { useRouter } from "next/navigation";

interface CoursesTabProps {
  courses: Course[];
  onCourseUpdated: () => void;
}

export function CoursesTab({ courses, onCourseUpdated }: CoursesTabProps) {
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
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Course Management</h2>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all appearance-none bg-white"
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
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Instructor</th>
              <th className="px-6 py-4">Stats</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCourses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden">
                      {course.image ? (
                        <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{course.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{course.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{course.instructorName}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{course.lessonsCount} Lessons</span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleTogglePublish(course)}
                    disabled={processingId === course.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      course.published 
                        ? "bg-green-100 text-green-700 hover:bg-green-200" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {course.published ? (
                      <><CheckCircle size={12} /> Published</>
                    ) : (
                      <><XCircle size={12} /> Draft</>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
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
            ))}
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
