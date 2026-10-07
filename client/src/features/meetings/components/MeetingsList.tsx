import React from 'react';
import { useMeetings, useDeleteMeeting, useMeetingStatus } from '../api';
import { Link } from 'react-router-dom';
import { FileAudio, Trash2 } from 'lucide-react';

const MeetingStatusPoller = ({ meetingId, currentStatus }: { meetingId: string, currentStatus: string }) => {
  useMeetingStatus(meetingId, currentStatus);
  return null;
};

export const MeetingsList = () => {
  const { data: meetings, isLoading, error } = useMeetings();
  const deleteMutation = useDeleteMeeting();

  if (isLoading) return <div className="text-center p-8">Loading meetings...</div>;
  if (error) return <div className="text-red-500 p-8">Error loading meetings.</div>;
  if (!meetings || meetings.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-lg shadow border border-gray-200">
        <FileAudio className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No meetings found</h3>
        <p className="text-gray-500 mt-1 mb-4">Get started by creating a new meeting.</p>
        <Link to="/meetings/new" className="text-blue-600 hover:text-blue-800 font-medium">
          Create New Meeting
        </Link>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {meetings.map((meeting) => (
          <li key={meeting._id}>
            { (meeting.status === 'uploaded' || meeting.status === 'processing') && (
              <MeetingStatusPoller meetingId={meeting._id} currentStatus={meeting.status} />
            )}
            <div className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-blue-600 truncate">{meeting.title}</p>
                <p className="flex items-center text-sm text-gray-500 mt-1">
                  {new Date(meeting.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                  {meeting.status}
                </span>
                <button 
                  onClick={() => handleDelete(meeting._id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Delete Meeting"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
