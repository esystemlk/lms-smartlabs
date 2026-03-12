"use client";

import { useEffect, useState } from "react";
import { Resource } from "@/lib/types";
import { X, FileText, AlertCircle, Loader2 } from "lucide-react";

interface ResourceViewerModalProps {
  resource: Resource | null;
  onClose: () => void;
}

export function ResourceViewerModal({ resource, onClose }: ResourceViewerModalProps) {
  if (!resource) return null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      if (
        (ctrl && (key === "s" || key === "p" || key === "o")) ||
        (ctrl && e.shiftKey && (key === "i" || key === "j" || key === "c"))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", handler, { capture: true });
    return () => document.removeEventListener("keydown", handler, { capture: true } as any);
  }, []);

  const renderContent = () => {
    switch (resource.type) {
      case 'pdf':
        return (
          <div className="w-full h-full flex flex-col">
            <iframe
              src={`${resource.url}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full rounded-lg bg-gray-100 border-none shadow-inner"
              title={resource.title}
              onContextMenu={(e) => e.preventDefault()}
            />
            <div className="mt-2 text-center">
              <p className="text-[10px] text-gray-400">Secure Preview Mode</p>
            </div>
          </div>
        );

      case 'document':
        // Use Google Docs Viewer for Word documents
        return (
          <div className="w-full h-full flex flex-col">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`}
              className="w-full h-full rounded-lg bg-gray-100 border-none shadow-inner"
              title={resource.title}
            />
            <div className="mt-2 flex justify-center gap-4">
              <p className="text-[10px] text-gray-400 self-center">Powered by Google Docs Viewer • View Only</p>
            </div>
          </div>
        );

      case 'text':
        return <TextFileViewer url={resource.url} />;

      case 'video':
        return (
          <div className="flex flex-col h-full bg-black rounded-lg overflow-hidden border border-gray-800">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <video
                src={resource.url}
                controls
                controlsList="nodownload"
                className="max-h-full max-w-full"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-black/20 rounded-lg overflow-auto border border-gray-100 dark:border-gray-800">
            <img
              src={resource.url}
              alt={resource.title}
              className="max-w-full max-h-full object-contain shadow-lg"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
            />
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-lg p-10 border border-gray-100 dark:border-gray-800">
            <div className="w-20 h-20 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue mb-6">
              <AlertCircle size={40} />
            </div>
            <audio
              src={resource.url}
              controls
              controlsList="nodownload"
              className="w-full max-w-md shadow-sm"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{resource.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">This file type ({resource.type}) cannot be previewed directly.</p>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl border border-amber-100 dark:border-amber-800/30">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Download restricted. Please view within the LMS.</span>
              </div>
            </div>
          </div>
        );
    }
  };

  function TextFileViewer({ url }: { url: string }) {
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
      fetch(url)
        .then(res => res.text())
        .then(text => {
          setContent(text);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }, [url]);

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-brand-blue" /></div>;
    if (error) return <div className="h-full flex items-center justify-center text-red-500">Failed to load text content.</div>;

    return (
      <div className="h-full w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-auto p-6 font-mono text-sm whitespace-pre-wrap select-text">
        {content}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
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
