import React from 'react';
import { MeetingsList } from '../features/meetings/components/MeetingsList';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';

export const MeetingsPage = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
        <Button asChild>
          <Link to="/meetings/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New Meeting
          </Link>
        </Button>
      </div>
      <MeetingsList />
    </div>
  );
};
