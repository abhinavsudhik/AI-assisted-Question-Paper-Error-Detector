'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadBox from './UploadBox';
import SyllabusTabs from './SyllabusTabs';
import QuestionPatternInput from './QuestionPatternInput';

export default function InputForm() {
  const router = useRouter();
  const [questionPaperFile, setQuestionPaperFile] = useState(null);
  const [syllabusValue, setSyllabusValue] = useState(null);
  const [patternValue, setPatternValue] = useState(null);
  const [totalMarks, setTotalMarks] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyse = async () => {
    if (!questionPaperFile) {
      alert('Please upload a question paper');
      return;
    }
    if (!totalMarks) {
      alert('Please enter total marks');
      return;
    }
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

      const response = await fetch('/api/analyse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result = await response.json();
      localStorage.setItem('reportData', JSON.stringify(result.data));
      router.push('/report');
    } catch (error) {
      alert('Something went wrong. Please try again.');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
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
          <label className="block text-sm font-semibold text-foreground mb-4">
            Syllabus
          </label>
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
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all ${isAnalyzing
              ? 'bg-primary/80 opacity-80 cursor-not-allowed'
              : 'bg-primary hover:bg-opacity-90 active:scale-95'
            }`}
        >
          {isAnalyzing ? 'Analysing...' : 'Analyse Paper'}
        </button>
      </div>
    </div>
  );
}