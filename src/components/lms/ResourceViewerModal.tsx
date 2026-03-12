"use client";

import { useEffect, useState, useCallback } from "react";
import { Resource } from "@/lib/types";
import { X, FileText, AlertCircle, Loader2, RefreshCw, ExternalLink } from "lucide-react";

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
    // Resolve effective type: check URL extension for misclassified resources
    const getEffectiveType = (): string => {
      const storedType = resource.type;
      if (storedType && storedType !== 'other') return storedType;

      // Try to detect from URL
      try {
        const urlPath = new URL(resource.url).pathname.toLowerCase();
        if (urlPath.match(/\.(doc|docx|odt|rtf|ppt|pptx|xls|xlsx)(\?|$)/)) return 'document';
        if (urlPath.match(/\.(pdf)(\?|$)/)) return 'pdf';
        if (urlPath.match(/\.(txt|csv|md)(\?|$)/)) return 'text';
        if (urlPath.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)(\?|$)/)) return 'image';
        if (urlPath.match(/\.(mp4|webm|mov|avi|mkv)(\?|$)/)) return 'video';
        if (urlPath.match(/\.(mp3|wav|ogg|aac|m4a|flac)(\?|$)/)) return 'audio';
      } catch {
        // If URL parsing fails, also check the filename in the URL string
        const urlLower = resource.url.toLowerCase();
        if (urlLower.includes('.docx') || urlLower.includes('.doc') || urlLower.includes('.pptx') || urlLower.includes('.xlsx')) return 'document';
        if (urlLower.includes('.pdf')) return 'pdf';
      }
      return storedType;
    };

    const effectiveType = getEffectiveType();

    switch (effectiveType) {
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
        return <DocumentViewer url={resource.url} title={resource.title} />;

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

  function DocumentViewer({ url, title }: { url: string; title: string }) {
    const [viewerMode, setViewerMode] = useState<'office' | 'google' | 'failed'>('office');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

    const getCurrentUrl = useCallback(() => {
      if (viewerMode === 'office') return officeViewerUrl;
      if (viewerMode === 'google') return googleViewerUrl;
      return '';
    }, [viewerMode, officeViewerUrl, googleViewerUrl]);

    const handleIframeLoad = () => {
      setLoading(false);
      setLoadError(false);
    };

    const handleIframeError = () => {
      setLoading(false);
      if (viewerMode === 'office') {
        // Try Google Docs as fallback
        setViewerMode('google');
        setLoading(true);
        setLoadError(false);
      } else {
        setLoadError(true);
        setViewerMode('failed');
      }
    };

    // Auto fallback after timeout
    useEffect(() => {
      const timer = setTimeout(() => {
        if (loading && viewerMode === 'office') {
          setViewerMode('google');
          setLoading(true);
        } else if (loading && viewerMode === 'google') {
          setLoading(false);
          setLoadError(true);
          setViewerMode('failed');
        }
      }, 12000);

      return () => clearTimeout(timer);
    }, [viewerMode, loading, retryCount]);

    const handleRetry = () => {
      setViewerMode('office');
      setLoading(true);
      setLoadError(false);
      setRetryCount(prev => prev + 1);
    };

    if (viewerMode === 'failed') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 mb-6">
            <FileText size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            This document could not be previewed inline. You can open it externally or try again.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md active:scale-95"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <a
              href={officeViewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <ExternalLink size={16} />
              Open in Office Online
            </a>
            <a
              href={googleViewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <ExternalLink size={16} />
              Open in Google Docs
            </a>
          </div>
          <p className="text-[10px] text-gray-400 mt-6">View Only • No Download Available</p>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-lg">
            <Loader2 className="w-10 h-10 animate-spin text-brand-blue mb-4" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Loading document...
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Using {viewerMode === 'office' ? 'Microsoft Office Online' : 'Google Docs Viewer'}
            </p>
          </div>
        )}

        <iframe
          key={`${viewerMode}-${retryCount}`}
          src={getCurrentUrl()}
          className="w-full h-full rounded-lg bg-gray-100 border-none shadow-inner"
          title={title}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />

        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-[10px] text-gray-400">
            Powered by {viewerMode === 'office' ? 'Microsoft Office Online' : 'Google Docs Viewer'} • View Only
          </p>
          <div className="flex items-center gap-3">
            {viewerMode === 'office' && (
              <button
                onClick={() => { setViewerMode('google'); setLoading(true); }}
                className="text-[10px] text-gray-400 hover:text-brand-blue transition-colors cursor-pointer"
              >
                Switch to Google Viewer
              </button>
            )}
            {viewerMode === 'google' && (
              <button
                onClick={() => { setViewerMode('office'); setLoading(true); }}
                className="text-[10px] text-gray-400 hover:text-brand-blue transition-colors cursor-pointer"
              >
                Switch to Office Viewer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
