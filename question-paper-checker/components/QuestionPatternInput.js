'use client';

import { useState } from 'react';
import UploadBox from './UploadBox';

export default function QuestionPatternInput() {
  const [inputMode, setInputMode] = useState('upload');
  const [sections, setSections] = useState(1);
  const [sectionData, setSectionData] = useState([
    { questionType: 'MCQ', marks: 1 }
  ]);

  const handleFileUpload = (files) => {
    // Handle pattern file upload
  };

  const addSection = () => {
    setSections(sections + 1);
    setSectionData([...sectionData, { questionType: 'MCQ', marks: 1 }]);
  };

  const removeSection = (index) => {
    if (sections > 1) {
      setSections(sections - 1);
      setSectionData(sectionData.filter((_, i) => i !== index));
    }
  };

  const updateSectionData = (index, field, value) => {
    const updated = [...sectionData];
    updated[index] = { ...updated[index], [field]: value };
    setSectionData(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-foreground">Question Paper Pattern</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="text-sm text-gray-600">Use structured form</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={inputMode === 'form'}
              onChange={(e) => setInputMode(e.target.checked ? 'form' : 'upload')}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              inputMode === 'form' ? 'bg-primary' : 'bg-gray-300'
            }`}></div>
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              inputMode === 'form' ? 'translate-x-5' : ''
            }`}></div>
          </div>
        </label>
      </div>

      {inputMode === 'upload' ? (
        <UploadBox
          title="Upload Pattern File"
          formats={['PDF', 'DOCX']}
          onFilesSelected={handleFileUpload}
          isLarge={false}
        />
      ) : (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="space-y-4">
            {/* Number of Sections */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Number of Sections
              </label>
              <input
                type="number"
                value={sections}
                onChange={(e) => {
                  const newSections = Math.max(1, parseInt(e.target.value) || 1);
                  setSections(newSections);
                  if (newSections > sectionData.length) {
                    setSectionData([
                      ...sectionData,
                      ...Array(newSections - sectionData.length).fill({ questionType: 'MCQ', marks: 1 })
                    ]);
                  } else {
                    setSectionData(sectionData.slice(0, newSections));
                  }
                }}
                min="1"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Sections Details */}
            <div className="space-y-3">
              {sectionData.map((section, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Section {index + 1} Type
                    </label>
                    <select
                      value={section.questionType}
                      onChange={(e) => updateSectionData(index, 'questionType', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    >
                      <option value="MCQ">MCQ</option>
                      <option value="Short answer">Short answer</option>
                      <option value="Long answer">Long answer</option>
                      <option value="Fill in the blanks">Fill in the blanks</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Marks per question
                    </label>
                    <input
                      type="number"
                      value={section.marks}
                      onChange={(e) => updateSectionData(index, 'marks', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                  {sections > 1 && (
                    <button
                      onClick={() => removeSection(index)}
                      className="px-3 py-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Section Button */}
            <button
              onClick={addSection}
              className="mt-4 text-sm font-medium text-primary hover:text-opacity-80 transition-colors"
            >
              + Add Section
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
