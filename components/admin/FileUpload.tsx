'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = '.csv',
  maxSize = 10,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (accept && !accept.includes(`.${extension}`)) {
      return `Please upload a ${accept} file`;
    }
    
    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (maxSize && sizeMB > maxSize) {
      return `File size must be less than ${maxSize}MB`;
    }
    
    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, handleFile]);

  const handleClick = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      <motion.div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all duration-200',
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : selectedFile
            ? 'border-green-500/50 bg-green-500/5'
            : error
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        whileHover={!disabled ? { scale: 1.01 } : undefined}
        whileTap={!disabled ? { scale: 0.99 } : undefined}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <div className="mb-4 rounded-full bg-green-500/20 p-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-zinc-400" />
                  <span className="font-medium text-zinc-200">{selectedFile.name}</span>
                  <button
                    onClick={handleRemove}
                    className="rounded-full p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <span className="mt-1 text-sm text-zinc-500">
                  {formatFileSize(selectedFile.size)}
                </span>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <div className="mb-4 rounded-full bg-red-500/20 p-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <span className="font-medium text-red-400">{error}</span>
                <span className="mt-2 text-sm text-zinc-500">Click to try again</span>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <div className="mb-4 rounded-full bg-zinc-800 p-4">
                  <Upload className="h-8 w-8 text-zinc-400" />
                </div>
                <span className="font-medium text-zinc-200">
                  {isDragging ? 'Drop your file here' : 'Drag & drop your CSV file'}
                </span>
                <span className="mt-2 text-sm text-zinc-500">
                  or click to browse (max {maxSize}MB)
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default FileUpload;
