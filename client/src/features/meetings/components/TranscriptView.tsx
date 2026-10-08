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
    return <div className="text-muted-foreground italic p-6 text-center h-full flex items-center justify-center">Transcript not available.</div>;
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {transcript.map((seg, idx) => (
          <div key={idx} className="group hover:bg-muted/50 p-2 rounded transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                Speaker {seg.speaker.replace('spk_', '')}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {formatTimestamp(seg.startTimestampMs)}
              </span>
            </div>
            <p className="text-foreground text-sm leading-relaxed pl-2 border-l-2 border-transparent group-hover:border-primary/30">
              {seg.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
