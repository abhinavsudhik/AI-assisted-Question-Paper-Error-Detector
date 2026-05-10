'use client';

import { useState } from 'react';
import UploadBox from './UploadBox';
import SyllabusTabs from './SyllabusTabs';
import QuestionPatternInput from './QuestionPatternInput';

export default function InputForm() {
  const [totalMarks, setTotalMarks] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleQuestionPaperUpload = (files) => {
    // Handle question paper file upload
  };

  const handleAnalyse = async () => {
    if (!totalMarks) {
      alert('Please enter total marks');
      return;
    }
    setIsAnalyzing(true);
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false);
      alert('Analysis started! Results will be displayed shortly.');
    }, 1000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      <div className="space-y-8">
        {/* Question Paper Upload */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-4">
            Question Paper <span className="text-error">*</span>
          </label>
          <UploadBox
            title="Upload Question Paper"
            formats={['PDF', 'JPG', 'PNG', 'DOCX']}
            onFilesSelected={handleQuestionPaperUpload}
            isLarge={true}
          />
        </div>

        {/* Syllabus Input */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-4">
            Syllabus <span className="text-error">*</span>
          </label>
          <SyllabusTabs />
        </div>

        {/* Total Marks */}
        <div>
          <label htmlFor="totalMarks" className="block text-sm font-semibold text-foreground mb-2">
            Total Marks <span className="text-error">*</span>
          </label>
          <input
            id="totalMarks"
            type="number"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
            placeholder="Enter total marks"
            min="1"
            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
          />
        </div>

        {/* Question Pattern */}
        <div>
          <QuestionPatternInput />
        </div>

        {/* Analyse Button */}
        <button
          onClick={handleAnalyse}
          disabled={isAnalyzing}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all ${
            isAnalyzing
              ? 'bg-primary/80 opacity-80 cursor-not-allowed'
              : 'bg-primary hover:bg-opacity-90 active:scale-95'
          }`}
        >
          {isAnalyzing ? 'Analysing...' : 'Analyse Paper'}
        </button>
      </div>
    
  );
}
