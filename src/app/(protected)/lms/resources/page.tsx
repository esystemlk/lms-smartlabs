"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { resourceService } from "@/services/resourceService";
import { courseService } from "@/services/courseService";
import { enrollmentService } from "@/services/enrollmentService";
import { Resource, ResourceFolder, Course } from "@/lib/types";
import { Loader2, Download, FileText, Video, Link as LinkIcon, Folder, Music, Image as ImageIcon, ChevronRight, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ResourceViewerModal } from "@/components/lms/ResourceViewerModal";

export default function ResourcesPage() {
  const { userData } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);

  // Load Enrolled Courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (userData?.uid) {
        try {
          // Fetch active enrollments to ensure access control
          // We rely on enrollments rather than userData.enrolledCourses to check for 'active' status
          const enrollments = await enrollmentService.getUserEnrollments(userData.uid);
          
          // Filter for active or completed enrollments AND check expiry
          const activeEnrollments = enrollments.filter(e => {
            // 1. Check Status
            const isActive = e.status === 'active' || e.status === 'completed';
            if (!isActive) return false;

            // 2. Check Expiry (if set)
            if (e.validUntil) {
              const now = new Date();
              // Handle Firestore Timestamp
              const expiryDate = (e.validUntil as any).toDate ? (e.validUntil as any).toDate() : new Date(e.validUntil);
              
              if (now > expiryDate) {
                return false; // Enrollment has expired
              }
            }
            
            return true;
          });

          // Get unique course IDs
          const courseIds = Array.from(new Set(activeEnrollments.map(e => e.courseId)));

          if (courseIds.length > 0) {
            const coursePromises = courseIds.map(id => courseService.getCourse(id));
            const coursesData = await Promise.all(coursePromises);
            const validCourses = coursesData.filter(c => c !== null) as Course[];
            setCourses(validCourses);
            
            // Auto-select first course if only one
            if (validCourses.length === 1) {
              setSelectedCourseId(validCourses[0].id);
            } else if (validCourses.length > 0) {
              setSelectedCourseId(validCourses[0].id); // Default to first one
            }
          } else {
            setCourses([]);
          }
        } catch (error) {
          console.error("Failed to load courses", error);
        }
      }
      setLoading(false);
    };

    if (userData) {
      fetchCourses();
    }
  }, [userData]);

  // Load Resources when Course Changes
  useEffect(() => {
    if (selectedCourseId) {
      loadCourseContent(selectedCourseId);
      setCurrentFolderId(null); // Reset to root
    }
  }, [selectedCourseId]);

  const loadCourseContent = async (courseId: string) => {
    setContentLoading(true);
    try {
      const [foldersData, resourcesData] = await Promise.all([
        resourceService.getFoldersByCourse(courseId),
        resourceService.getResourcesByCourse(courseId)
      ]);
      setFolders(foldersData);
      setResources(resourcesData);
    } catch (error) {
      console.error("Failed to load content", error);
    } finally {
      setContentLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-500" />;
      case 'image': return <ImageIcon className="text-blue-500" />;
      case 'video': return <Video className="text-purple-500" />;
      case 'audio': return <Music className="text-yellow-500" />;
      default: return <FileText className="text-gray-400" />;
    }
  };

  // Filter items for current view
  const currentFolders = folders.filter(f => (f.parentId || null) === currentFolderId);
  const currentResources = resources.filter(r => (r.folderId || null) === currentFolderId);

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs = [{ id: null, name: 'Root' }];
    let curr = currentFolderId;
    const path = [];
    while (curr) {
        const folder = folders.find(f => f.id === curr);
        if (folder) {
            path.unshift({ id: folder.id, name: folder.name });
            curr = folder.parentId || null;
        } else {
            break;
        }
    }
    return [...crumbs, ...path];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-brand-blue" size={32} />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
        <div className="max-w-5xl mx-auto pb-12 text-center pt-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder size={40} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No Resources Available</h2>
            <p className="text-gray-500 mt-2">You haven't enrolled in any courses yet.</p>
            <Button className="mt-6" onClick={() => window.location.href = '/courses'}>Browse Courses</Button>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Resources</h1>
        <p className="text-gray-500">Study materials, references, and downloads.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Course Selector */}
        <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-gray-900 px-2">Your Courses</h3>
            <div className="space-y-2">
                {courses.map(course => (
                    <button
                        key={course.id}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                            selectedCourseId === course.id 
                            ? 'bg-brand-blue text-white shadow-md shadow-blue-500/20' 
                            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-100'
                        }`}
                    >
                        <BookOpen size={18} className={selectedCourseId === course.id ? 'text-white/80' : 'text-gray-400'} />
                        <span className="font-medium truncate">{course.title}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
            {contentLoading ? (
                <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-gray-100">
                    <Loader2 className="animate-spin text-brand-blue" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 min-h-[500px] flex flex-col">
                    {/* Toolbar / Breadcrumbs */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex items-center overflow-x-auto">
                        {getBreadcrumbs().map((crumb, i, arr) => (
                            <div key={crumb.id || 'root'} className="flex items-center shrink-0">
                                <span 
                                    className={`cursor-pointer hover:text-brand-blue text-sm px-2 py-1 rounded transition-colors ${i === arr.length - 1 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}
                                    onClick={() => setCurrentFolderId(crumb.id as string | null)}
                                >
                                    {crumb.name}
                                </span>
                                {i < arr.length - 1 && <ChevronRight size={14} className="text-gray-400 mx-1" />}
                            </div>
                        ))}
                    </div>

                    {/* Files Area */}
                    <div className="p-6 flex-1">
                        {currentFolders.length === 0 && currentResources.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                                <Folder size={48} className="mb-4 opacity-20" />
                                <p>No resources found in this folder.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Folders */}
                                {currentFolders.map(folder => (
                                    <div 
                                        key={folder.id}
                                        onClick={() => setCurrentFolderId(folder.id)}
                                        className="group p-4 bg-blue-50/30 border border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3"
                                    >
                                        <Folder className="w-10 h-10 text-brand-blue shrink-0" fill="currentColor" fillOpacity={0.2} />
                                        <div className="overflow-hidden">
                                            <h4 className="font-medium text-gray-900 truncate group-hover:text-brand-blue transition-colors">{folder.name}</h4>
                                            <p className="text-xs text-gray-500">Folder</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Files */}
                                {currentResources.map(resource => (
                                    <div 
                                        key={resource.id}
                                        onClick={() => setViewingResource(resource)}
                                        className="group p-4 bg-white border border-gray-100 rounded-xl hover:border-brand-blue/30 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            {getFileIcon(resource.type)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-medium text-gray-900 truncate group-hover:text-brand-blue transition-colors" title={resource.title}>{resource.title}</h4>
                                            <p className="text-xs text-gray-500 uppercase">{resource.type}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Viewer Modal */}
      {viewingResource && (
        <ResourceViewerModal 
            resource={viewingResource} 
            onClose={() => setViewingResource(null)} 
        />
      )}
    </div>
  );
}
