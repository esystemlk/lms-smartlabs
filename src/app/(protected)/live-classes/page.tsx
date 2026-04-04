"use client";

import { useEffect, useState, Fragment } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { courseService } from "@/services/courseService";
import { Lesson, Course } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Loader2, Video, Calendar, Clock, Play, ExternalLink, Plus, Settings, Users, Zap, X, CloudUpload, RefreshCw, MoreVertical, Trash2, CheckCircle, BookOpen } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import ManualUploadModal from "@/components/admin/ManualUploadModal";
import ScheduleClassModal from "@/components/admin/ScheduleClassModal";

export default function LiveClassManagementPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<Lesson[]>([]);
  const [pastClasses, setPastClasses] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedLessonForUpload, setSelectedLessonForUpload] = useState<Lesson | null>(null);

  // Schedule Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Instant Meeting State
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [instantMeetingData, setInstantMeetingData] = useState({
    topic: "Instant Live Class",
    courseId: "",
    batchIds: [] as string[]
  });
  const [instantLoading, setInstantLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourseId, setFilterCourseId] = useState("");

  // Schedule Details Modal State
  const [selectedScheduleDetails, setSelectedScheduleDetails] = useState<Lesson | null>(null);
  const [scheduleDetailsLoading, setScheduleDetailsLoading] = useState(false);
  const [scheduleBatchesData, setScheduleBatchesData] = useState<{ courseName: string, batchName: string, timeSlotLabel: string }[]>([]);

  useEffect(() => {
    if (selectedScheduleDetails) {
      const fetchDetails = async () => {
        setScheduleDetailsLoading(true);
        try {
          const results = [];
          const courseIds = Array.from(new Set([selectedScheduleDetails.courseId, ...(selectedScheduleDetails.bindedCourseIds || [])]));
          
          for (const cid of courseIds) {
            const courseName = courses.find((c: Course) => c.id === cid)?.title || "Unknown Course";
            const batchesList = await courseService.getBatches(cid);
            
            for (const bid of selectedScheduleDetails.batchIds || []) {
              const batch = batchesList.find((b: any) => b.id === bid);
              if (batch) {
                let timeSlotLabel = "Any Time Slot";
                if (selectedScheduleDetails.timeSlotId && batch.timeSlots) {
                  const ts = batch.timeSlots.find((t: any) => t.id === selectedScheduleDetails.timeSlotId);
                  if (ts) timeSlotLabel = ts.label;
                }
                results.push({ courseName, batchName: batch.name || `Batch ${bid}`, timeSlotLabel });
              }
            }
          }
          setScheduleBatchesData(results);
        } catch (err) {
          console.error(err);
        } finally {
          setScheduleDetailsLoading(false);
        }
      };
      // Prevent fetching if we already have the state and courses is populated
      if (courses.length > 0) fetchDetails();
    } else {
      setScheduleBatchesData([]);
    }
  }, [selectedScheduleDetails, courses]);

  const handleSyncRecordings = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/cron/process-recordings');
      const data = await res.json();
      if (data.processed > 0) {
        alert(`Sync complete! Processed ${data.processed} recordings.`);
        fetchClasses(); // Refresh list
      } else {
        alert("Sync complete. No new recordings found.");
      }
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Failed to sync recordings.");
    } finally {
      setSyncing(false);
    }
  };

  const handleCancelClass = async (lesson: Lesson) => {
    if (!confirm("Are you sure you want to cancel this scheduled class? This action cannot be undone.")) return;
    
    try {
      if (lesson.courseId) {
        await courseService.deleteLesson(lesson.courseId, lesson.id);
        fetchClasses();
      }
    } catch (error) {
      console.error("Failed to cancel class:", error);
      alert("Failed to cancel class.");
    }
  };

  const handleMarkComplete = async (lesson: Lesson) => {
    if (!confirm("Mark this class as completed? It will be moved to past classes.")) return;

    try {
      if (lesson.courseId) {
        await courseService.updateLesson(lesson.courseId, lesson.id, {
            status: 'completed'
        });
        fetchClasses();
      }
    } catch (error) {
      console.error("Failed to mark complete:", error);
      alert("Failed to update class status.");
    }
  };

  useEffect(() => {
    // Only allow lecturer, admin, superadmin, developer
    if (userData && !["lecturer", "admin", "superadmin", "developer"].includes(userData.role)) {
      router.push("/lms/live"); 
      return;
    }
    fetchClasses();
    fetchCourses();
  }, [userData]);

  useEffect(() => {
    if (instantMeetingData.courseId) {
      fetchBatches(instantMeetingData.courseId);
    } else {
      setBatches([]);
    }
  }, [instantMeetingData.courseId]);

  const fetchClasses = async () => {
    try {
      const isAdmin = ["admin", "superadmin", "developer"].includes(userData?.role || '');
      
      const upcoming = await courseService.getUpcomingLiveClasses();
      const past = await courseService.getPastLiveClasses();

      if (isAdmin || userData?.role === 'lecturer') {
        setClasses(upcoming);
        setPastClasses(past);
      }
    } catch (error) {
      console.error("Error fetching live classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await courseService.getAllCourses();
      const isAdmin = ["admin", "superadmin", "developer"].includes(userData?.role || '');
      
      if (isAdmin || userData?.role === 'lecturer') {
        setCourses(data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchBatches = async (courseId: string) => {
    try {
      const data = await courseService.getBatches(courseId);
      setBatches(data);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const handleStartInstantMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instantMeetingData.courseId) {
      alert("Please select a course to attach this meeting to.");
      return;
    }
    if (instantMeetingData.batchIds.length === 0) {
      alert("Please select at least one batch.");
      return;
    }

    setInstantLoading(true);
    try {
      // 1. Create Instant Meeting on Zoom (Type 1)
      const response = await fetch('/api/zoom/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: instantMeetingData.topic,
          type: 1, // Instant Meeting
          startTime: new Date().toISOString(),
          duration: 60, // Default 60 mins
          auto_recording: "cloud" // Ensure recording is enabled
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // 2. Save as Lesson in Firestore
      const newLesson: Partial<Lesson> = {
        title: instantMeetingData.topic,
        type: 'live_class',
        order: 999, // Push to end or handle ordering
        published: true, // Auto-publish so students see it
        zoomMeetingId: data.id,
        zoomStartUrl: data.start_url,
        zoomJoinUrl: data.join_url,
        zoomPassword: data.password,
        startTime: new Date().toISOString(),
        duration: 60,
        batchIds: instantMeetingData.batchIds
      };

      await courseService.addLesson(instantMeetingData.courseId, newLesson);

      // 3. Redirect Lecturer to Start URL
      window.open(data.start_url, '_blank');
      
      // 4. Close and Refresh
      setShowInstantModal(false);
      fetchClasses();
      alert("Instant meeting started! Students in selected batches can now join.");

    } catch (error: any) {
      console.error("Error creating instant meeting:", error);
      alert("Failed to start instant meeting: " + error.message);
    } finally {
      setInstantLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 pt-4 px-4 md:px-0 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Class Manager</h1>
          <p className="text-gray-500 mt-1">Schedule classes, manage Zoom settings, and start sessions.</p>
        </div>
        <div className="flex gap-3">
            <Button 
                onClick={() => setShowInstantModal(true)}
                className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 border-0"
            >
                <Zap size={16} className="fill-white" />
                Instant Class
            </Button>
            <Link href="/lms/live">
                <Button variant="outline" className="gap-2">
                    <Users size={16} />
                    Student View
                </Button>
            </Link>
            <Button 
                onClick={() => setScheduleModalOpen(true)}
                className="gap-2 shadow-lg shadow-blue-500/20"
            >
                <Plus size={16} />
                Schedule New Class
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Scheduled Classes */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="text-brand-blue" size={20} />
                    Upcoming Schedule
                </h2>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Input
                            placeholder="Search class topic..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 rounded-xl"
                        />
                        <MoreVertical size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
                    </div>
                    <select
                        value={filterCourseId}
                        onChange={(e) => setFilterCourseId(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none flex-1 sm:w-48 bg-white"
                    >
                        <option value="">All Courses</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                    <tr>
                        <th className="px-6 py-4 font-medium">Class Details</th>
                        <th className="px-6 py-4 font-medium">Schedule</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {(() => {
                        const filtered = classes.filter(cls => {
                            const matchSearch = cls.title?.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchCourse = !filterCourseId || cls.courseId === filterCourseId || (cls.bindedCourseIds && cls.bindedCourseIds.includes(filterCourseId));
                            return matchSearch && matchCourse;
                        });
                        if (filtered.length === 0) {
                            return (
                                <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                    <Video size={32} className="text-gray-300" />
                                    <p>{searchTerm || filterCourseId ? "No matching classes found." : "No upcoming classes found."}</p>
                                    <Button variant="ghost" onClick={() => setScheduleModalOpen(true)} className="text-blue-600 hover:underline">
                                        Schedule one now
                                    </Button>
                                    </div>
                                </td>
                                </tr>
                            );
                        }
                        return filtered.map((cls) => {
                        const startDate = cls.startTime ? new Date(cls.startTime) : null;
                        const isHappeningNow = startDate 
                            ? (new Date() >= startDate && new Date() <= new Date(startDate.getTime() + (cls.duration || 60) * 60000))
                            : false;

                        return (
                            <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900 text-base">{cls.title}</div>
                                {isHappeningNow && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1 animate-pulse">
                                    Happening Now
                                </span>
                                )}
                                {cls.batchIds && cls.batchIds.length > 0 && (
                                  <button 
                                    onClick={() => setSelectedScheduleDetails(cls)}
                                    className="mt-2 text-xs text-brand-blue hover:underline flex items-center gap-1 font-medium"
                                  >
                                    <ExternalLink size={12} />
                                    View Details
                                  </button>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{startDate?.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>{startDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({cls.duration}m)</span>
                                </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                {cls.zoomStartUrl ? (
                                <a 
                                    href={cls.zoomStartUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-block"
                                >
                                    <Button size="sm" className="bg-brand-blue hover:bg-blue-700 text-white gap-2 shadow-md shadow-blue-500/20">
                                    <Play size={14} />
                                    Start
                                    </Button>
                                </a>
                                ) : (
                                <span className="text-gray-400 text-xs">No Link</span>
                                )}

                                <Menu as="div" className="relative inline-block text-left">
                                  <div>
                                    <Menu.Button className="inline-flex justify-center w-full px-2 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                                      <MoreVertical size={18} />
                                    </Menu.Button>
                                  </div>
                                  <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                  >
                                    <Menu.Items className="absolute right-0 w-48 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                      <div className="px-1 py-1">
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              onClick={() => handleMarkComplete(cls)}
                                              className={`${
                                                active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                              } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                            >
                                              <CheckCircle className="w-4 h-4 mr-2" />
                                              Mark as Done
                                            </button>
                                          )}
                                        </Menu.Item>
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              onClick={() => handleCancelClass(cls)}
                                              className={`${
                                                active ? 'bg-red-50 text-red-700' : 'text-gray-700'
                                              } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Cancel Schedule
                                            </button>
                                          )}
                                        </Menu.Item>
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </Menu>
                                </div>
                            </td>
                            </tr>
                        );
                        })
                    })()}
                    </tbody>
                </table>
                </div>
            </div>
        </div>

        {/* Recent History / Past Classes */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="text-gray-400" size={20} />
                    Recent History
                </h2>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSyncRecordings} 
                    disabled={syncing}
                    className="gap-2"
                >
                    {syncing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                    Sync Zoom Recordings
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                    <tr>
                        <th className="px-6 py-4 font-medium">Class Details</th>
                        <th className="px-6 py-4 font-medium">Date & Time</th>
                        <th className="px-6 py-4 font-medium text-right">Recording</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {pastClasses.length === 0 ? (
                        <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                            <p>No past classes found.</p>
                        </td>
                        </tr>
                    ) : (
                        pastClasses.map((cls) => {
                        const startDate = cls.startTime ? new Date(cls.startTime) : null;
                        const hasRecording = !!cls.recordingUrl || !!cls.bunnyVideoId;

                        return (
                            <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-medium text-gray-900 text-base">{cls.title}</div>
                                <button 
                                    onClick={() => setSelectedScheduleDetails(cls)}
                                    className="mt-2 text-xs text-brand-blue hover:underline flex items-center gap-1 font-medium"
                                >
                                    <ExternalLink size={12} />
                                    View Details
                                </button>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>{startDate?.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>{startDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                {hasRecording ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Recorded
                                    </span>
                                ) : (
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedLessonForUpload(cls);
                                            setUploadModalOpen(true);
                                        }}
                                        className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                                    >
                                        <CloudUpload size={14} />
                                        Upload
                                    </Button>
                                )}
                            </td>
                            </tr>
                        );
                        })
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>

        {/* Sidebar: Settings & Tools */}
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="text-gray-400" size={20} />
                Settings & Tools
            </h2>

            {/* Zoom Integration Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Video size={18} className="text-blue-500" />
                    Zoom Integration
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Status</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">Active</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Account</span>
                        <span className="text-gray-900 font-medium">Connected</span>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                        <Button variant="outline" className="w-full text-xs h-8">
                            Configure Credentials
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-2">Host Tips</h3>
                <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
                    <li>Start class 5 mins early.</li>
                    <li>Check your microphone input.</li>
                    <li>Recordings save automatically.</li>
                </ul>
            </div>
        </div>
      </div>
      {/* Instant Meeting Modal */}
      {showInstantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Zap size={20} className="text-purple-600 fill-purple-600" />
                Start Instant Class
              </h3>
              <button 
                onClick={() => setShowInstantModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleStartInstantMeeting} className="p-6 space-y-4">
              <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-100">
                <p>This will immediately start a Zoom meeting and notify students in the selected course.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Course</label>
                <select
                  value={instantMeetingData.courseId}
                  onChange={(e) => setInstantMeetingData({ ...instantMeetingData, courseId: e.target.value, batchIds: [] })}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all bg-white"
                  required
                >
                  <option value="">Select a Course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {instantMeetingData.courseId && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Batches (Select at least one)</label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-2 bg-gray-50">
                    {batches.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">No batches found for this course.</p>
                    ) : (
                      batches.map(batch => (
                        <label key={batch.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                          <input 
                            type="checkbox"
                            checked={instantMeetingData.batchIds.includes(batch.id)}
                            onChange={(e) => {
                              const newIds = e.target.checked
                                ? [...instantMeetingData.batchIds, batch.id]
                                : instantMeetingData.batchIds.filter(id => id !== batch.id);
                              setInstantMeetingData({ ...instantMeetingData, batchIds: newIds });
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{batch.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <Input
                label="Class Topic"
                value={instantMeetingData.topic}
                onChange={(e) => setInstantMeetingData({ ...instantMeetingData, topic: e.target.value })}
                placeholder="e.g. Quick Doubt Clearing Session"
                required
              />

              <div className="pt-4 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setShowInstantModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                    type="submit" 
                    disabled={instantLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {instantLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2 fill-current" />
                      Start Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ManualUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={fetchClasses}
        courseId={selectedLessonForUpload?.courseId}
        lessonId={selectedLessonForUpload?.id}
      />
      
      <ScheduleClassModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={fetchClasses}
      />
        {/* Schedule Details Modal */}
        {selectedScheduleDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedScheduleDetails.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">Schedule details & bound courses</p>
                            </div>
                            <button 
                                onClick={() => setSelectedScheduleDetails(null)}
                                className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {scheduleDetailsLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-brand-blue mb-4" />
                                <p className="text-gray-500 text-sm">Loading details...</p>
                            </div>
                        ) : scheduleBatchesData.length > 0 ? (
                            <div className="space-y-4">
                                {scheduleBatchesData.map((data, i) => (
                                    <div key={i} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-200 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                <BookOpen size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{data.courseName}</h4>
                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                                    <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md font-medium text-xs">
                                                        <Users size={12} />
                                                        {data.batchName}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md font-medium text-xs shrink-0">
                                                        <Clock size={12} />
                                                        {data.timeSlotLabel}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No bound batches found.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto flex justify-end">
                        <Button 
                            variant="primary" 
                            onClick={() => setSelectedScheduleDetails(null)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
