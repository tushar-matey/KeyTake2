import React from 'react';
import { TranscriptSegment } from '@keytake/shared';

interface TranscriptViewProps {
  transcript: TranscriptSegment[];
}

function formatTimestamp(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ transcript }) => {
  if (!transcript || transcript.length === 0) {
    return <div className="text-gray-500 italic p-6 text-center border rounded-lg bg-gray-50">Transcript not available.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col h-full max-h-[600px]">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 sticky top-0 bg-white pb-2 border-b">Transcript</h3>
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {transcript.map((seg, idx) => (
          <div key={idx} className="group hover:bg-gray-50 p-2 rounded transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Speaker {seg.speaker.replace('spk_', '')}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {formatTimestamp(seg.startTimestampMs)}
              </span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed pl-2 border-l-2 border-transparent group-hover:border-blue-200">
              {seg.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
