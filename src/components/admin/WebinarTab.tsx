"use client";

import { useState, useEffect } from "react";
import { Course, Enrollment } from "@/lib/types";
import { Search, Filter, Play, CheckCircle, XCircle, Users, ExternalLink, ShieldOff } from "lucide-react";
import { courseService } from "@/services/courseService";
import { Button } from "@/components/ui/Button";

interface WebinarTabProps {
  courses: Course[];
  onWebinarUpdated: () => void;
}

export function WebinarTab({ courses, onWebinarUpdated }: WebinarTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const webinars = courses.filter(course => 
    course.category?.toLowerCase() === 'webinar' || 
    course.title.toLowerCase().includes('webinar')
  );

  const filteredWebinars = webinars.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleRegistration = async (courseId: string, currentStatus?: string) => {
    try {
      setProcessingId(courseId);
      const newStatus = currentStatus === 'closed' ? 'open' : 'closed';
      await courseService.updateCourse(courseId, { enrollmentStatus: newStatus });
      onWebinarUpdated();
    } catch (error) {
      console.error("Failed to update webinar registration status:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold">Webinar Management</h2>
            <p className="text-sm text-gray-500">Manage specialized webinars and their registration status.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search webinars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
        </div>

        {filteredWebinars.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <Play className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No webinars found. Label a course as "Webinar" category to see it here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredWebinars.map((webinar) => (
              <div key={webinar.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                    <Play size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{webinar.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className={`flex items-center gap-1 ${webinar.enrollmentStatus === 'closed' ? 'text-red-500' : 'text-green-500 font-medium'}`}>
                        {webinar.enrollmentStatus === 'closed' ? <XCircle size={12} /> : <CheckCircle size={12} />}
                        Registration {webinar.enrollmentStatus === 'closed' ? 'Closed' : 'Open'}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{webinar.lessonsCount} Sessions Scheduled</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={webinar.enrollmentStatus === 'closed' ? 'outline' : 'secondary'}
                    size="sm"
                    onClick={() => handleToggleRegistration(webinar.id, webinar.enrollmentStatus)}
                    disabled={processingId === webinar.id}
                    className={webinar.enrollmentStatus === 'closed' ? 'border-green-200 text-green-600 hover:bg-green-50' : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100'}
                  >
                    {processingId === webinar.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : webinar.enrollmentStatus === 'closed' ? (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        Open Registration
                      </>
                    ) : (
                      <>
                        <ShieldOff size={16} className="mr-2" />
                        Close Registration
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`/courses/${webinar.id}`, '_blank')}
                    className="text-gray-500"
                  >
                    <ExternalLink size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg 
      className={`animate-spin ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
