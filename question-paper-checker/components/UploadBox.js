'use client';

import { useState } from 'react';
import CloudUploadIcon from './icons/CloudUploadIcon';

export default function UploadBox({ title, formats = ['PDF', 'JPG', 'PNG', 'DOCX'], onFilesSelected, isLarge = true }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && onFilesSelected) {
      onFilesSelected(files);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0 && onFilesSelected) {
      onFilesSelected(files);
    }
  };

  return (
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
  );
}
