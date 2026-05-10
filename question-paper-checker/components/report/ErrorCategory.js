'use client';

import { useState } from 'react';

export default function ErrorCategory({
  id,
  title,
  count,
  severity,
  items,
  isExpanded,
  onToggle,
}) {
  const severityColor = severity === 'critical' ? 'bg-error text-white' : 'bg-amber-500 text-white';
  const borderColor = severity === 'critical' ? 'border-l-error' : 'border-l-amber-500';

  return (
    <div className={`bg-card rounded-xl shadow-sm border border-border overflow-hidden`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className={`${severityColor} px-3 py-1 rounded-full text-sm font-semibold`}>
            {count} found
          </span>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border">
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-6 border-l-4 ${borderColor} bg-gray-50`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm font-semibold">
                      {item.question}
                    </span>
                    <span className="font-semibold text-foreground">{item.type}</span>
                  </div>
                </div>
                <p className="text-gray-600 ml-20">{item.issue}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
