"use client";

import React, { useEffect, useState } from 'react';
import { examService, Exam } from '@/services/examService';
import { Calendar, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await examService.getUpcomingExams();
      setExams(data);
    } catch (error) {
      console.error("Failed to load exams", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Exams</h1>
        <div className="flex gap-2">
          {/* Filter options could go here */}
        </div>
      </div>
      
      {exams.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Upcoming Exams</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            You're all caught up! Check back later for new exam schedules or review your past results.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-blue-50 text-brand-blue rounded-full text-xs font-bold uppercase tracking-wider">
                  {exam.subject}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded
                  ${exam.status === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {exam.status}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">{exam.title}</h3>
              
              <div className="space-y-3 mt-4">
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-brand-blue" />
                  {exam.date && format(exam.date.toDate(), 'EEEE, MMM d, yyyy')}
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="w-4 h-4 mr-2 text-brand-blue" />
                  {exam.date && format(exam.date.toDate(), 'h:mm a')} • {exam.durationMinutes} mins
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Total Marks: {exam.totalMarks}
                </span>
                <button className="text-sm font-bold text-brand-blue hover:text-blue-700 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
