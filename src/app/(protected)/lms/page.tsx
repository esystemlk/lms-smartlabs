"use client";

import { Button } from "@/components/ui/Button";
import { BookOpen, Calendar, FileText, Download, PlayCircle } from "lucide-react";

export default function LMSPage() {
  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Learning Management System</h1>
          <p className="text-xs md:text-base text-gray-500">Access your classes, assignments, and learning resources.</p>
        </div>
      </div>

      {/* Main LMS Sections */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
        
        {/* Live Classes */}
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-soft hover:shadow-lg transition-all border border-transparent hover:border-brand-blue/10">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-lg md:rounded-xl flex items-center justify-center text-blue-600 mb-2 md:mb-4">
            <PlayCircle className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <h3 className="text-xs md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Live Classes</h3>
          <p className="text-[10px] md:text-sm text-gray-500 mb-2 md:mb-4 line-clamp-2 leading-tight">Join scheduled live sessions with your lecturers.</p>
          <Button variant="outline" className="w-full text-[10px] md:text-sm h-7 md:h-10 px-2">View Schedule</Button>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-soft hover:shadow-lg transition-all border border-transparent hover:border-brand-blue/10">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-orange-100 rounded-lg md:rounded-xl flex items-center justify-center text-orange-600 mb-2 md:mb-4">
            <FileText className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <h3 className="text-xs md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Assignments</h3>
          <p className="text-[10px] md:text-sm text-gray-500 mb-2 md:mb-4 line-clamp-2 leading-tight">Submit your work and view grades.</p>
          <Button variant="outline" className="w-full text-[10px] md:text-sm h-7 md:h-10 px-2">View Pending</Button>
        </div>

        {/* Resources */}
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-soft hover:shadow-lg transition-all border border-transparent hover:border-brand-blue/10">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-100 rounded-lg md:rounded-xl flex items-center justify-center text-purple-600 mb-2 md:mb-4">
            <Download className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <h3 className="text-xs md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Resources</h3>
          <p className="text-[10px] md:text-sm text-gray-500 mb-2 md:mb-4 line-clamp-2 leading-tight">Download course materials and study guides.</p>
          <Button variant="outline" className="w-full text-[10px] md:text-sm h-7 md:h-10 px-2">Browse Library</Button>
        </div>

        {/* Exam Portal */}
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-soft hover:shadow-lg transition-all border border-transparent hover:border-brand-blue/10">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-red-100 rounded-lg md:rounded-xl flex items-center justify-center text-red-600 mb-2 md:mb-4">
            <BookOpen className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <h3 className="text-xs md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Exams</h3>
          <p className="text-[10px] md:text-sm text-gray-500 mb-2 md:mb-4 line-clamp-2 leading-tight">Take scheduled online exams and quizzes.</p>
          <Button variant="outline" className="w-full text-[10px] md:text-sm h-7 md:h-10 px-2">Go to Exam Portal</Button>
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-soft hover:shadow-lg transition-all border border-transparent hover:border-brand-blue/10">
          <div className="w-8 h-8 md:w-12 md:h-12 bg-green-100 rounded-lg md:rounded-xl flex items-center justify-center text-green-600 mb-2 md:mb-4">
            <Calendar className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <h3 className="text-xs md:text-lg font-bold text-gray-900 mb-1 md:mb-2">Timetable</h3>
          <p className="text-[10px] md:text-sm text-gray-500 mb-2 md:mb-4 line-clamp-2 leading-tight">Check your weekly class schedule.</p>
          <Button variant="outline" className="w-full text-[10px] md:text-sm h-7 md:h-10 px-2">View Timetable</Button>
        </div>

      </div>
    </div>
  );
}