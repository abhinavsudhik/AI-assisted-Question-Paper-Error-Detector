'use client';

import { useState } from 'react';
import ErrorCategory from './ErrorCategory';

export default function ErrorSections({ expandedSections, toggleSection }) {
  const errorData = {
    language: {
      title: 'Language Errors',
      count: 4,
      severity: 'critical',
      items: [
        {
          id: 1,
          question: 'Q2',
          type: 'Spelling mistake',
          issue: '"Photosinthesis" should be "Photosynthesis"',
          severity: 'critical'
        },
        {
          id: 2,
          question: 'Q5',
          type: 'Grammar mistake',
          issue: '"Explain the reason of" should be "Explain the reason for"',
          severity: 'critical'
        },
        {
          id: 3,
          question: 'Q7',
          type: 'Ambiguous question',
          issue: '"Explain it" is unclear, specify what needs to be explained',
          severity: 'critical'
        },
        {
          id: 4,
          question: 'Q11',
          type: 'Repeated word',
          issue: '"Find the find the value of x"',
          severity: 'critical'
        }
      ]
    },
    structure: {
      title: 'Structure Errors',
      count: 2,
      severity: 'warning',
      items: [
        {
          id: 1,
          question: 'Q6',
          type: 'Missing question',
          issue: 'Question numbering jumps from Q5 to Q7',
          severity: 'warning'
        },
        {
          id: 2,
          question: 'Section B',
          type: 'Inconsistent marks',
          issue: 'Label says "2 marks each" but Q8 and Q9 are worth 5 marks',
          severity: 'warning'
        }
      ]
    },
    marks: {
      title: 'Marks Errors',
      count: 3,
      severity: 'critical',
      items: [
        {
          id: 1,
          question: 'Total',
          type: 'Tally error',
          issue: 'Paper adds up to 95 but total says 100',
          severity: 'critical'
        },
        {
          id: 2,
          question: 'Q4',
          type: 'No marks mentioned',
          issue: 'No marks mentioned next to the question',
          severity: 'critical'
        },
        {
          id: 3,
          question: 'Q9',
          type: 'Part marks mismatch',
          issue: 'Part marks (2+2+2=6) don\'t match question total of 8 marks',
          severity: 'critical'
        }
      ]
    },
    syllabus: {
      title: 'Syllabus Errors',
      count: 2,
      severity: 'warning',
      items: [
        {
          id: 1,
          question: 'Q3',
          type: 'Topic not in syllabus',
          issue: '"Krebs Cycle" not found in uploaded syllabus',
          severity: 'warning'
        },
        {
          id: 2,
          question: 'Q10',
          type: 'Difficulty mismatch',
          issue: 'Difficulty level too high for the syllabus level',
          severity: 'warning'
        }
      ]
    },
    logical: {
      title: 'Logical Errors',
      count: 1,
      severity: 'critical',
      items: [
        {
          id: 1,
          question: 'Q6',
          type: 'Multiple correct answers',
          issue: 'MCQ has two correct options (B and D are both correct)',
          severity: 'critical'
        }
      ]
    }
  };

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-foreground mb-6">Error Details</h2>
      <div className="space-y-4">
        {Object.entries(errorData).map(([key, data]) => (
          <ErrorCategory
            key={key}
            id={key}
            title={data.title}
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
