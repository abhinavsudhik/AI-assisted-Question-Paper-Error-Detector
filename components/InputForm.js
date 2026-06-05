'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UploadBox from './UploadBox';
import SyllabusTabs from './SyllabusTabs';
import QuestionPatternInput from './QuestionPatternInput';
import Link from 'next/link';

export default function InputForm() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [questionPaperFile, setQuestionPaperFile] = useState(null);
  const [syllabusValue, setSyllabusValue] = useState(null);
  const [patternValue, setPatternValue] = useState(null);
  const [totalMarks, setTotalMarks] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleAnalyse = async () => {
    if (!questionPaperFile) { alert('Please upload a question paper'); return; }
    if (!totalMarks) { alert('Please enter total marks'); return; }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('questionPaper', questionPaperFile);
      formData.append('totalMarks', totalMarks);

      if (syllabusValue instanceof File) {
        formData.append('syllabus', syllabusValue);
      } else {
        formData.append('syllabus', syllabusValue ?? '');
      }

      if (patternValue instanceof File) {
        formData.append('pattern', patternValue);
      } else if (patternValue) {
        formData.append('pattern', JSON.stringify(patternValue));
      }

      const response = await fetch('/api/analyse', { method: 'POST', body: formData });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      router.push(`/report?id=${result.jobId}`);
    } catch (error) {
      alert(error.message || 'Something went wrong. Please try again.');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      {!user && (
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Sign in</span> to save your analyses and access history
            </p>
          </div>
          <Link href="/auth" className="text-sm font-semibold text-primary hover:underline shrink-0">
            Sign in →
          </Link>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-4">
            Question Paper <span className="text-error">*</span>
          </label>
          <UploadBox
            title="Upload Question Paper"
            formats={['PDF', 'JPG', 'PNG', 'DOCX']}
            onFilesSelected={(files) => setQuestionPaperFile(files[0])}
            isLarge={true}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-4">Syllabus</label>
          <SyllabusTabs onSyllabusChange={setSyllabusValue} />
        </div>
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
        <div>
          <QuestionPatternInput onPatternChange={setPatternValue} />
        </div>
        <button
          onClick={handleAnalyse}
          disabled={isAnalyzing}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all ${isAnalyzing ? 'bg-primary/80 opacity-80 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90 active:scale-95'
            }`}
        >
          {isAnalyzing ? 'Analysing...' : 'Analyse Paper'}
        </button>
      </div>
    </div>
  );
}