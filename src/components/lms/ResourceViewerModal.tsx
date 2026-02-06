"use client";

import { useState } from "react";
import { Resource } from "@/lib/types";
import { X, FileText, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ResourceViewerModalProps {
  resource: Resource | null;
  onClose: () => void;
}

export function ResourceViewerModal({ resource, onClose }: ResourceViewerModalProps) {
  if (!resource) return null;

  const renderContent = () => {
    switch (resource.type) {
      case 'pdf':
        return (
          <iframe 
            src={`${resource.url}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full rounded-lg bg-gray-100"
            title={resource.title}
          />
        );
      
      case 'video':
        return (
          <div className="flex items-center justify-center h-full bg-black rounded-lg overflow-hidden">
            <video 
              src={resource.url} 
              controls 
              controlsList="nodownload" 
              className="max-h-full max-w-full"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg p-10">
            <audio 
              src={resource.url} 
              controls 
              controlsList="nodownload" 
              className="w-full max-w-md"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center h-full bg-black/50 rounded-lg overflow-auto">
            <img 
              src={resource.url} 
              alt={resource.title} 
              className="max-w-full max-h-full object-contain"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <FileText size={64} className="text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">{resource.title}</h3>
            <p className="text-gray-500 mb-6">This file type cannot be previewed directly.</p>
            {/* We explicitly hide download option as requested, so just show a message */}
            <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
              <AlertCircle size={16} />
              <span className="text-sm">Preview not available for this format.</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate pr-4">
            {resource.title}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 bg-gray-50 dark:bg-black/50 overflow-hidden relative">
            {renderContent()}
        </div>
        
        {/* Footer (Optional info) */}
        {resource.description && (
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500">
                {resource.description}
            </div>
        )}
      </div>
    </div>
  );
}
