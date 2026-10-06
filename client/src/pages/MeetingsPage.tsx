import React from 'react';
import { MeetingsList } from '../features/meetings/components/MeetingsList';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export const MeetingsPage = () => {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
        <Link 
          to="/meetings/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Meeting
        </Link>
      </div>
      <MeetingsList />
    </div>
  );
};
