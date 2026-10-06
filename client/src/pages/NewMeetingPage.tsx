import React from 'react';
import { NewMeetingForm } from '../features/meetings/components/NewMeetingForm';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NewMeetingPage = () => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/meetings" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Meetings
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Upload New Meeting</h1>
      <NewMeetingForm />
    </div>
  );
};
