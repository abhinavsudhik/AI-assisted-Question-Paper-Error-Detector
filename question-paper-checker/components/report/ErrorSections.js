'use client';

import { useState } from 'react';
import ErrorCategory from './ErrorCategory';

const CATEGORY_TITLES = {
  language: 'Language & Grammar',
  structure: 'Structure & Formatting',
  marks: 'Marks Allocation',
  syllabus: 'Syllabus Alignment',
  logical: 'Logical & Fact Errors',
};

export default function ErrorSections({ errorCategories, expandedSections, toggleSection }) {
  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-foreground mb-6">Error Details</h2>
      <div className="space-y-4">
        {Object.entries(errorCategories).map(([key, data]) => (
          <ErrorCategory
            key={key}
            id={key}
            title={data.title || CATEGORY_TITLES[key] || (key.charAt(0).toUpperCase() + key.slice(1))}
            count={data.count}
            severity={data.severity}
            items={data.items}
            isExpanded={expandedSections[key]}
            onToggle={() => toggleSection(key)}
          />
        ))}
      </div>
    </div>
  );
}
