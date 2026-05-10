'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import HealthScoreCard from '@/components/report/HealthScoreCard';
import StatsGrid from '@/components/report/StatsGrid';
import PriorityFixes from '@/components/report/PriorityFixes';
import ErrorBreakdownChart from '@/components/report/ErrorBreakdownChart';
import ErrorSections from '@/components/report/ErrorSections';
import CleanQuestions from '@/components/report/CleanQuestions';
import ActionButtons from '@/components/report/ActionButtons';

export default function ReportPage() {
  const [expandedSections, setExpandedSections] = useState({
    language: true,
    structure: false,
    marks: false,
    syllabus: false,
    logical: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
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
            <HealthScoreCard />
            <div className="lg:col-span-2">
              <StatsGrid />
            </div>
          </div>

          {/* Priority Fixes */}
          <PriorityFixes />

          {/* Error Breakdown Chart */}
          <ErrorBreakdownChart />

          {/* Error Detail Sections */}
          <ErrorSections 
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />

          {/* Clean Questions */}
          <CleanQuestions />

          {/* Action Buttons */}
          <ActionButtons />
        </div>
      </main>
    </div>
  );
}
