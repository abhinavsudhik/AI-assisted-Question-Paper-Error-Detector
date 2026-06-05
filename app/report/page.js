'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HealthScoreCard from '@/components/report/HealthScoreCard';
import StatsGrid from '@/components/report/StatsGrid';
import PriorityFixes from '@/components/report/PriorityFixes';
import ErrorBreakdownChart from '@/components/report/ErrorBreakdownChart';
import ErrorSections from '@/components/report/ErrorSections';
import CleanQuestions from '@/components/report/CleanQuestions';
import ActionButtons from '@/components/report/ActionButtons';

export default function ReportPage() {
  return (
    <Suspense fallback={<LoadingScreen status="pending" />}>
      <ReportContent />
    </Suspense>
  );
}

function LoadingScreen({ status }) {
  const isProcessing = status === 'processing';
  
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] bg-background">
      <div className="max-w-md w-full mx-6 p-8 bg-white/80 backdrop-blur-md rounded-3xl border border-border shadow-lg text-center relative overflow-hidden">
        {/* Top subtle decorative gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40 animate-pulse"></div>

        {/* Loading Spinner Container */}
        <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          {/* Animated concentric rings */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          
          <svg className="w-10 h-10 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-3 text-balance">
          {isProcessing ? 'Analyzing Question Paper' : 'Initializing Analysis'}
        </h2>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Our advanced AI is auditing your paper for logical, structure, syllabus, and marking errors. This will take a moment.
        </p>

        {/* Checklist */}
        <div className="space-y-4 text-left max-w-xs mx-auto mb-6">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-success/10 border border-success/30 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">Question paper uploaded</span>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            {isProcessing ? (
              <div className="w-6 h-6 rounded-full bg-success/10 border border-success/30 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
            )}
            <span className={`text-sm font-medium ${isProcessing ? 'text-gray-700 font-semibold' : 'text-primary font-semibold'}`}>
              {isProcessing ? 'Document parsed' : 'Parsing paper & syllabus...'}
            </span>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            {isProcessing ? (
              <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 animate-spin border-t-transparent border-t-2">
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
              </div>
            )}
            <span className={`text-sm font-medium ${isProcessing ? 'text-primary font-semibold' : 'text-gray-400'}`}>
              Auditing with Gemini AI...
            </span>
          </div>

          {/* Step 4 */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
            </div>
            <span className="text-sm font-medium text-gray-400">
              Generating final report
            </span>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-400 mt-6 animate-pulse">
          Please keep this tab open.
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] bg-background">
      <div className="max-w-md w-full mx-6 p-8 bg-white rounded-3xl border border-border shadow-lg text-center relative overflow-hidden">
        {/* Top decorative error line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-error"></div>

        {/* Icon */}
        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Details */}
        <h2 className="text-2xl font-bold text-foreground mb-3">Analysis Failed</h2>
        <p className="text-gray-600 text-sm mb-8 leading-relaxed text-balance">
          {error || 'An unexpected error occurred while analyzing the question paper.'}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Try Again
          </button>
          <a
            href="/"
            className="w-full py-3 px-4 bg-gray-50 border border-border text-gray-700 font-semibold rounded-xl hover:bg-gray-100 active:scale-95 transition-all inline-block cursor-pointer"
          >
            Go Back Home
          </a>
        </div>
      </div>
    </div>
  );
}

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState(null);
  const [status, setStatus] = useState('pending'); // pending, processing, done, failed
  const [error, setError] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    language: true,
    structure: false,
    marks: false,
    syllabus: false,
    logical: false,
  });

  useEffect(() => {
    const id = searchParams.get('id');
    if (!id) {
      router.push('/');
      return;
    }

    let intervalId;
    let isMounted = true;

    async function fetchReport() {
      try {
        const res = await fetch(`/api/status/${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch status');
        }
        const data = await res.json();
        
        if (!isMounted) return;

        setStatus(data.status);

        if (data.status === 'done' && data.report) {
          setReportData(data.report);
          clearInterval(intervalId);
        } else if (data.status === 'failed') {
          setError(data.report?.error || 'Analysis failed.');
          clearInterval(intervalId);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Fetch status error:', err);
      }
    }

    // Run immediately
    fetchReport();

    // Poll every 2.5 seconds
    intervalId = setInterval(fetchReport, 2500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [searchParams, router]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDownloadPDF = async () => {
    const id = searchParams.get('id');
    if (!id || !reportData) return;

    setIsGeneratingPDF(true);

    // 1. Save current collapse/expanded state
    const originalExpanded = { ...expandedSections };

    // 2. Expand all sections so all details are visible for printing
    setExpandedSections({
      language: true,
      structure: true,
      marks: true,
      syllabus: true,
      logical: true,
    });

    // 3. Wait for React to re-render the expanded details
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // 4. Inject a print-specific stylesheet to hide non-report UI
      const style = document.createElement('style');
      style.id = 'pdf-print-style';
      style.textContent = `
        @media print {
          /* Hide everything except the report content */
          body > * { visibility: hidden !important; }
          #report-content, #report-content * { visibility: visible !important; }
          #report-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 20px !important;
          }
          /* Hide navigation, footer, action buttons during print */
          nav, footer, header, [data-hide-print] { display: none !important; }
          /* Ensure good page breaks */
          .break-inside-avoid { break-inside: avoid; }
          /* Remove shadows & decorative elements for clean print */
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `;
      document.head.appendChild(style);

      // 5. Set the document title to control the default PDF filename
      const originalTitle = document.title;
      document.title = `Question-Paper-Analysis-Report-${id.slice(0, 8)}`;

      // 6. Trigger the browser's native print dialog (Save as PDF)
      window.print();

      // 7. Restore original title
      document.title = originalTitle;

      // 8. Clean up the injected print stylesheet
      const injectedStyle = document.getElementById('pdf-print-style');
      if (injectedStyle) injectedStyle.remove();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // 9. Restore original collapse/expanded states
      setExpandedSections(originalExpanded);
      setIsGeneratingPDF(false);
    }
  };

  if (status === 'failed') {
    return <ErrorScreen error={error} onRetry={() => router.push('/')} />;
  }

  if (status !== 'done' || !reportData) {
    return <LoadingScreen status={status} />;
  }

  return (
    <main className="flex-1">
      <div id="report-content" className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
            Error Analysis Report
          </h1>
          <p className="text-gray-600">
            Comprehensive analysis of your question paper with AI-powered insights
          </p>
        </div>

        {/* Top Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <HealthScoreCard score={reportData.healthScore} verdict={reportData.verdict} />
          <div className="lg:col-span-2">
            <StatsGrid 
              totalErrors={reportData.totalErrors}
              critical={reportData.critical}
              warnings={reportData.warnings}
              suggestions={reportData.suggestions} 
            />
          </div>
        </div>

        {/* Priority Fixes */}
        <PriorityFixes fixes={reportData.priorityFixes} />

        {/* Error Breakdown Chart */}
        <ErrorBreakdownChart categories={reportData.errorBreakdown} />

        {/* Error Detail Sections */}
        <ErrorSections
          errorCategories={reportData.errorCategories}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        />

        {/* Clean Questions */}
        <CleanQuestions cleanQuestions={reportData.cleanQuestions} />

        {/* Action Buttons */}
        <ActionButtons onDownloadPDF={handleDownloadPDF} isGeneratingPDF={isGeneratingPDF} />
      </div>
    </main>
  );
}
