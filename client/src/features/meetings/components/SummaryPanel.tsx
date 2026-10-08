import React from 'react';
import ReactMarkdown from 'react-markdown';

interface SummaryPanelProps {
  summary: string;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ summary }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-900">Meeting Summary</h3>
      <div className="prose max-w-none prose-sm sm:prose-base prose-blue">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  );
};
