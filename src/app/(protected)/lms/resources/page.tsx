"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { resourceService } from "@/services/resourceService";
import { Resource } from "@/lib/types";
import { Loader2, Download, FileText, Video, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function ResourcesPage() {
  const { userData } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      if (userData?.enrolledCourses) {
        try {
          const promises = userData.enrolledCourses.map(courseId => 
            resourceService.getResourcesByCourse(courseId)
          );
          const results = await Promise.all(promises);
          setResources(results.flat());
        } catch (error) {
          console.error("Failed to load resources", error);
        }
      }
      setLoading(false);
    };

    if (userData) {
      fetchResources();
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-brand-blue" size={32} />
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={24} />;
      case 'video': return <Video size={24} />;
      case 'link': return <LinkIcon size={24} />;
      default: return <Download size={24} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'bg-red-50 text-red-600';
      case 'video': return 'bg-purple-50 text-purple-600';
      case 'link': return 'bg-blue-50 text-blue-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Resources</h1>
        <p className="text-gray-500">Supplementary materials for your courses.</p>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <Download className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Resources Found</h3>
          <p className="text-gray-500">Additional materials will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColor(resource.type)}`}>
                  {getIcon(resource.type)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{resource.title}</h3>
                  {resource.description && <p className="text-sm text-gray-500">{resource.description}</p>}
                </div>
              </div>
              
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink size={16} />
                  Open
                </Button>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
