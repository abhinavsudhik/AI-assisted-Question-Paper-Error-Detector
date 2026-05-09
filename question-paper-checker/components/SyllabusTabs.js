'use client';

import { useState } from 'react';
import UploadBox from './UploadBox';

export default function SyllabusTabs() {
  const [activeTab, setActiveTab] = useState('upload');
  const [syllabusText, setSyllabusText] = useState('');

  const handleFileUpload = (files) => {
    // Handle syllabus file upload
  };

  return (
    <div>
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'upload'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-foreground'
          }`}
        >
          Upload Syllabus
        </button>
        <button
          onClick={() => setActiveTab('type')}
          className={`px-4 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'type'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-foreground'
          }`}
        >
          Type Syllabus
        </button>
      </div>

      {activeTab === 'upload' ? (
        <UploadBox
          title="Upload Syllabus"
          formats={['PDF', 'DOCX', 'TXT']}
          onFilesSelected={handleFileUpload}
          isLarge={false}
        />
      ) : (
        <textarea
          value={syllabusText}
          onChange={(e) => setSyllabusText(e.target.value)}
          placeholder="Paste your syllabus content here..."
          className="w-full h-48 p-4 border border-border rounded-xl font-sans resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      )}
    </div>
  );
}
