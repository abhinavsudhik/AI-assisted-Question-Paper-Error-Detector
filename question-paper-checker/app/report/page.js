'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HealthScoreCard from '@/components/report/HealthScoreCard';
import StatsGrid from '@/components/report/StatsGrid';
import PriorityFixes from '@/components/report/PriorityFixes';
import ErrorBreakdownChart from '@/components/report/ErrorBreakdownChart';
import ErrorSections from '@/components/report/ErrorSections';
import CleanQuestions from '@/components/report/CleanQuestions';
import ActionButtons from '@/components/report/ActionButtons';

export default function ReportPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    language: true,
    structure: false,
    marks: false,
    syllabus: false,
    logical: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem('reportData');
    if (!stored) {
      router.push('/');
      return;
    }
    setReportData(JSON.parse(stored));
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!reportData) return null;

  return (
    <main className="flex-1">
      <div className="max-w-6xl mx-auto px-6 py-12">
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
              <StatsGrid totalErrors={reportData.totalErrors}
                critical={reportData.critical}
                warnings={reportData.warnings}
                suggestions={reportData.suggestions} />
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
          <ActionButtons />
        </div>
      </main>
  );
}
