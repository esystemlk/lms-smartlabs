"use client";

import { useState, useEffect, useMemo } from "react";
import { Course, Resource, ResourceFolder } from "@/lib/types";
import { courseService } from "@/services/courseService";
import { resourceService } from "@/services/resourceService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  MoreVertical, 
  Trash2, 
  FolderPlus, 
  Upload, 
  ChevronRight, 
  Home,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner"; // Using sonner as seen in other files, or useToast if preferred. 
// Wait, I just replaced sonner with useToast in ProfileCompletionModal. I should use useToast here too for consistency.
import { useToast } from "@/components/ui/Toast";

// Helper to get icon by type
const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="text-red-500" />;
    case 'image': return <ImageIcon className="text-blue-500" />;
    case 'video': return <Video className="text-purple-500" />;
    case 'audio': return <Music className="text-yellow-500" />;
    case 'archive': return <Folder className="text-gray-500" />;
    default: return <FileText className="text-gray-400" />;
  }
};

export function ResourceManager() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Resource Data
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Actions
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<Resource['type']>('other');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseData(selectedCourseId);
    } else {
      setFolders([]);
      setResources([]);
      setCurrentFolderId(null);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error("Failed to load courses", error);
      toast("Failed to load courses", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCourseData = async (courseId: string) => {
    try {
      setDataLoading(true);
      const [foldersData, resourcesData] = await Promise.all([
        resourceService.getFoldersByCourse(courseId),
        resourceService.getResourcesByCourse(courseId)
      ]);
      setFolders(foldersData);
      setResources(resourcesData);
    } catch (error) {
      console.error("Failed to load resources", error);
      toast("Failed to load resources", "error");
    } finally {
      setDataLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!selectedCourseId || !newFolderName.trim()) return;
    try {
      await resourceService.createFolder({
        courseId: selectedCourseId,
        name: newFolderName,
        parentId: currentFolderId || undefined,
      });
      toast("Folder created successfully", "success");
      setNewFolderName("");
      setIsCreatingFolder(false);
      loadCourseData(selectedCourseId);
    } catch (error) {
      console.error("Failed to create folder", error);
      toast("Failed to create folder", "error");
    }
  };

  const handleUpload = async () => {
    if (!selectedCourseId || !uploadFile || !uploadTitle) return;
    
    setIsUploading(true);
    try {
        const path = `resources/${selectedCourseId}/${Date.now()}_${uploadFile.name}`;
        const url = await resourceService.uploadFile(uploadFile, path);
        
        await resourceService.createResource({
            courseId: selectedCourseId,
            folderId: currentFolderId || undefined,
            title: uploadTitle,
            type: uploadType,
            url: url,
        });
        toast("Resource added successfully", "success");
        setUploadFile(null);
        setUploadTitle("");
        setIsUploading(false);
        loadCourseData(selectedCourseId);
    } catch (error) {
        console.error("Upload failed:", error);
        toast("Failed to add resource", "error");
        setIsUploading(false);
    }
  };
  
  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure? Contents might be lost.")) return;
    try {
        await resourceService.deleteFolder(folderId);
        toast("Folder deleted", "success");
        loadCourseData(selectedCourseId!);
    } catch (error) {
        toast("Failed to delete folder", "error");
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
        await resourceService.deleteResource(resourceId);
        toast("Resource deleted", "success");
        loadCourseData(selectedCourseId!);
    } catch (error) {
        toast("Failed to delete resource", "error");
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

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  if (!selectedCourseId) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Select a Course to Manage Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => (
                    <div 
                        key={course.id} 
                        onClick={() => setSelectedCourseId(course.id)}
                        className="p-6 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-brand-blue hover:shadow-md transition-all group"
                    >
                        <h3 className="font-semibold text-lg group-hover:text-brand-blue">{course.title}</h3>
                        <p className="text-sm text-gray-500">{course.lessonsCount} Lessons • {course.enrollmentStatus || 'Open'}</p>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4 border-b pb-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedCourseId(null)}>
                <ArrowLeft size={16} className="mr-2" /> Back to Courses
            </Button>
            <h2 className="text-xl font-bold">{selectedCourse?.title} / Resources</h2>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                {getBreadcrumbs().map((crumb, i, arr) => (
                    <div key={crumb.id || 'root'} className="flex items-center">
                        <span 
                            className={`cursor-pointer hover:text-brand-blue ${i === arr.length - 1 ? 'font-semibold text-gray-900' : ''}`}
                            onClick={() => setCurrentFolderId(crumb.id as string | null)}
                        >
                            {crumb.name}
                        </span>
                        {i < arr.length - 1 && <ChevronRight size={14} className="mx-1 text-gray-400" />}
                    </div>
                ))}
            </div>
            
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsCreatingFolder(true)}>
                    <FolderPlus size={16} className="mr-2" /> New Folder
                </Button>
                <Button onClick={() => setIsUploading(true)}>
                    <Upload size={16} className="mr-2" /> Upload Resource
                </Button>
            </div>
        </div>

        {/* Content Area */}
        {dataLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Folders */}
                {currentFolders.map(folder => (
                    <div 
                        key={folder.id}
                        className="group relative p-4 bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer"
                        onClick={() => setCurrentFolderId(folder.id)}
                    >
                        <div className="flex items-start justify-between">
                            <Folder className="w-10 h-10 text-brand-blue mb-3" fill="currentColor" fillOpacity={0.2} />
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-500 rounded transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
                        <p className="text-xs text-gray-500">{new Date(folder.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                ))}

                {/* Resources */}
                {currentResources.map(resource => (
                    <div key={resource.id} className="group relative p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between">
                            {getFileIcon(resource.type)}
                            <button 
                                onClick={() => handleDeleteResource(resource.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 text-red-500 rounded transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <h3 className="font-medium text-gray-900 mt-3 truncate" title={resource.title}>{resource.title}</h3>
                        <p className="text-xs text-gray-500 uppercase mt-1">{resource.type}</p>
                    </div>
                ))}

                {currentFolders.length === 0 && currentResources.length === 0 && (
                    <div className="col-span-full py-10 text-center text-gray-400">
                        <FolderPlus size={48} className="mx-auto mb-3 opacity-20" />
                        <p>This folder is empty</p>
                    </div>
                )}
            </div>
        )}

        {/* Create Folder Modal */}
        {isCreatingFolder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm">
                    <h3 className="text-lg font-bold mb-4">Create New Folder</h3>
                    <Input 
                        placeholder="Folder Name" 
                        value={newFolderName} 
                        onChange={(e) => setNewFolderName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsCreatingFolder(false)}>Cancel</Button>
                        <Button onClick={handleCreateFolder}>Create</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Upload Modal */}
        {isUploading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">Upload Resource</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                            <Input 
                                placeholder="Resource Title" 
                                value={uploadTitle} 
                                onChange={(e) => setUploadTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                            <select 
                                className="w-full rounded-xl border border-gray-200 px-4 py-2"
                                value={uploadType}
                                onChange={(e) => setUploadType(e.target.value as any)}
                            >
                                <option value="pdf">PDF Document</option>
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                                <option value="audio">Audio</option>
                                <option value="archive">Archive (Zip/Rar)</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">File</label>
                            <input 
                                type="file" 
                                className="w-full"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setUploadFile(file);
                                        if (!uploadTitle) setUploadTitle(file.name.split('.')[0]);
                                    }
                                }}
                            />
                            {/* Note: A real FileDropzone would be better but simple input works for now */}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setIsUploading(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!uploadFile || !uploadTitle}>Upload</Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
