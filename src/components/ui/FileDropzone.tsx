"use client";

import { useState } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface FileDropzoneProps {
    onFilesSelected: (files: File[]) => void;
    maxFiles?: number;
    accept?: Record<string, string[]>; // e.g., { 'image/*': ['.png', '.jpg'] }
    className?: string;
}

export function FileDropzone({ onFilesSelected, maxFiles = 1, accept, className }: FileDropzoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        setError(null);

        const droppedFiles = Array.from(e.dataTransfer.files);
        validateAndAddFiles(droppedFiles);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setError(null);
            const selectedFiles = Array.from(e.target.files);
            validateAndAddFiles(selectedFiles);
        }
    };

    const validateAndAddFiles = (newFiles: File[]) => {
        if (files.length + newFiles.length > maxFiles) {
            setError(`You can only upload up to ${maxFiles} file(s).`);
            return;
        }

        // Basic type validation logic could go here based on 'accept' prop

        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        onFilesSelected(updatedFiles);
    };

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onFilesSelected(updatedFiles);
    };

    return (
        <div className={clsx("w-full space-y-4", className)}>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={clsx(
                    "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-200 ease-in-out text-center cursor-pointer group",
                    isDragActive
                        ? "border-brand-blue bg-brand-blue/5 scale-[1.01]"
                        : "border-gray-200 dark:border-gray-700 hover:border-brand-blue/50 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                    multiple={maxFiles > 1}
                    accept={Object.keys(accept || {}).join(",")}
                />

                <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                    <div className={clsx(
                        "p-3 rounded-xl transition-colors",
                        isDragActive ? "bg-brand-blue/10 text-brand-blue" : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:bg-brand-blue/10 group-hover:text-brand-blue"
                    )}>
                        <Upload size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            <span className="text-brand-blue">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            SVG, PNG, JPG or GIF (max. 5MB)
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                >
                    <AlertCircle size={16} />
                    {error}
                </motion.div>
            )}

            <AnimatePresence>
                {files.length > 0 && (
                    <div className="space-y-2">
                        {files.map((file, index) => (
                            <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 text-gray-500">
                                        {file.type.startsWith("image/") ? (
                                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <FileText size={20} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-green-500" />
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
