'use client';

import { useState } from 'react';
import CloudUploadIcon from './icons/CloudUploadIcon';

export default function UploadBox({ title, formats = ['PDF', 'JPG', 'PNG', 'DOCX'], onFilesSelected, isLarge = true }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    setUploadedFiles(fileArray);
    if (onFilesSelected) onFilesSelected(files);
  };

  const handleRemoveFile = (indexToRemove) => {
    const updated = uploadedFiles.filter((_, i) => i !== indexToRemove);
    setUploadedFiles(updated);
    // Convert back to FileList-like object for the parent
    if (onFilesSelected) onFilesSelected(updated);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    if (e.target.files.length > 0) handleFiles(e.target.files);
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed border-border rounded-xl transition-colors cursor-pointer
          ${isDragging ? 'bg-primary/5 border-primary' : 'bg-white hover:bg-gray-50'}
          ${isLarge ? 'p-12' : 'p-8'}`}
      >
        <input
          type="file"
          id={`upload-${title}`}
          className="hidden"
          onChange={handleFileInput}
          multiple
        />
        <label htmlFor={`upload-${title}`} className="flex flex-col items-center gap-3 cursor-pointer">
          <CloudUploadIcon className={isLarge ? 'w-12 h-12' : 'w-8 h-8'} />
          <div className="text-center">
            <p className={`font-semibold ${isLarge ? 'text-lg' : 'text-base'} text-foreground`}>
              {title}
            </p>
            <p className="text-sm text-gray-600 mt-1">Drag and drop or click to browse</p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center mt-2">
            {formats.map((format) => (
              <span key={format} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                {format}
              </span>
            ))}
          </div>
        </label>
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-3 bg-success/10 border border-success rounded-xl">
              {/* Check icon */}
              <svg className="w-4 h-4 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>

              {/* File name */}
              <span className="text-sm font-medium text-success truncate flex-1">{file.name}</span>

              {/* File size */}
              <span className="text-xs text-gray-500 shrink-0">
                {(file.size / 1024).toFixed(1)} KB
              </span>

              {/* Remove button */}
              <button
                onClick={() => handleRemoveFile(index)}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-error/10 transition-colors"
                title="Remove file"
              >
                <svg className="w-3 h-3 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}