import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMeeting, useMeetingSummary } from '../features/meetings/api';
import { SummaryPanel } from '../features/meetings/components/SummaryPanel';
import { TranscriptView } from '../features/meetings/components/TranscriptView';

export const MeetingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: meeting, isLoading: isMeetingLoading } = useMeeting(id || '');
  
  // We only enable the summary query if the meeting is ready.
  // The summary API endpoint will actually trigger the generation if it doesn't exist,
  // but it's safe to call since our backend caches it.
  const isReady = meeting?.status === 'ready';
  
  const { data: summaryData, isLoading: isSummaryLoading, isError: isSummaryError } = useMeetingSummary(id || '', isReady);

  if (isMeetingLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Meeting not found</h2>
        <Link to="/meetings" className="text-blue-600 hover:underline mt-4 inline-block">Back to Meetings</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link to="/meetings" className="text-sm text-blue-600 hover:underline mb-2 inline-block">&larr; Back to Meetings</Link>
          <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <span>{new Date(meeting.createdAt).toLocaleDateString()}</span>
            <span>&bull;</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              meeting.status === 'ready' ? 'bg-green-100 text-green-800' :
              meeting.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {meeting.status}
            </span>
          </div>
        </div>
      </div>

      {!isReady ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            This meeting is currently {meeting.status}. Summary and transcript will be available once processing is complete.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            {isSummaryLoading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500">Generating intelligent summary with Claude...</p>
                <p className="text-xs text-gray-400 mt-2">This may take up to a minute for long meetings.</p>
              </div>
            ) : isSummaryError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
                Failed to generate or load the meeting summary. Please try again later.
              </div>
            ) : summaryData ? (
              <SummaryPanel summary={summaryData.summary} />
            ) : null}
          </div>
          
          <div className="h-full">
            <TranscriptView transcript={summaryData?.transcript || []} />
          </div>
        </div>
      )}
    </div>
  );
};
