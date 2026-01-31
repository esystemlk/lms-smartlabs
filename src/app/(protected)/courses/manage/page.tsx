"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { courseService } from "@/services/courseService";
import { Course } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Users,
  MoreVertical,
  Search,
  Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CourseManagementPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && userData) {
      if (!["lecturer", "admin", "superadmin", "developer"].includes(userData.role)) {
        router.push("/dashboard");
        return;
      }
      fetchCourses();
    }
  }, [userData, authLoading, router]);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      try {
        await courseService.deleteCourse(courseId);
        setCourses(courses.filter(c => c.id !== courseId));
      } catch (error) {
        console.error("Error deleting course:", error);
        alert("Failed to delete course");
      }
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-500">Create and manage your courses</p>
        </div>
        <Link href="/courses/manage/new">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create New Course
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
        />
      </div>

      {/* Course List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
            <div className="relative aspect-video rounded-xl bg-gray-100 mb-4 overflow-hidden">
              {course.image ? (
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                  <BookOpen className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/courses/manage/${course.id}`}>
                  <button className="p-2 bg-white/90 rounded-lg hover:bg-white text-gray-700 hover:text-brand-blue transition-colors shadow-sm">
                    <Edit className="w-4 h-4" />
                  </button>
                </Link>
                <button 
                  onClick={() => handleDelete(course.id)}
                  className="p-2 bg-white/90 rounded-lg hover:bg-white text-gray-700 hover:text-red-600 transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-gray-900 line-clamp-1" title={course.title}>
                  {course.title}
                </h3>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  course.published 
                    ? "bg-green-100 text-green-700" 
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {course.published ? "Published" : "Draft"}
                </span>
              </div>
              
              <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                {course.description || "No description provided."}
              </p>

              <div className="flex items-center justify-between pt-2 text-sm text-gray-500 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{course.instructorName}</span>
                </div>
                <div>
                  {course.lessonsCount || 0} Lessons
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredCourses.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <p>No courses found</p>
          </div>
        )}
      </div>
    </div>
  );
}
