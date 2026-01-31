"use client";

import { Button } from "@/components/ui/Button";
import { BookOpen, Calendar, FileText, Download, PlayCircle } from "lucide-react";

export default function LMSPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Management System</h1>
          <p className="text-gray-500">Access your classes, assignments, and learning resources.</p>
        </div>
      </div>

      {/* Main LMS Sections */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        
        {/* Live Classes */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-lg transition-all border border-transparent hover:border-brand-blue/10">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-3 md:mb-4">
            <PlayCircle className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Live Classes</h3>
          <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">Join scheduled live sessions with your lecturers.</p>
          <Button variant="outline" className="w-full text-xs md:text-sm h-8 md:h-10">View Schedule</Button>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-lg transition-all border border-transparent hover:border-brand-blue/10">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-3 md:mb-4">
            <FileText className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Assignments</h3>
          <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">Submit your work and view grades.</p>
          <Button variant="outline" className="w-full text-xs md:text-sm h-8 md:h-10">View Pending</Button>
        </div>

        {/* Resources */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-lg transition-all border border-transparent hover:border-brand-blue/10">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-3 md:mb-4">
            <Download className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Resources</h3>
          <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">Download course materials and study guides.</p>
          <Button variant="outline" className="w-full text-xs md:text-sm h-8 md:h-10">Browse Library</Button>
        </div>

        {/* Exam Portal */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-lg transition-all border border-transparent hover:border-brand-blue/10">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-3 md:mb-4">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Exams</h3>
          <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">Take scheduled online exams and quizzes.</p>
          <Button variant="outline" className="w-full text-xs md:text-sm h-8 md:h-10">Go to Exam Portal</Button>
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-lg transition-all border border-transparent hover:border-brand-blue/10">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-3 md:mb-4">
            <Calendar className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Timetable</h3>
          <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 line-clamp-2">Check your weekly class schedule.</p>
          <Button variant="outline" className="w-full text-xs md:text-sm h-8 md:h-10">View Timetable</Button>
        </div>

      </div>
    </div>
  );
}