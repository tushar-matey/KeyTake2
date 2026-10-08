import React from 'react';
import { useMeetings, useDeleteMeeting } from '../api';
import { useStatusPolling } from '../hooks/useStatusPolling';
import { Link } from 'react-router-dom';
import { FileAudio, Trash2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';

const MeetingStatusPoller = ({ meetingId, currentStatus }: { meetingId: string, currentStatus: string }) => {
  useStatusPolling(meetingId, currentStatus);
  return null;
};

export const MeetingsList = () => {
  const { data: meetings, isLoading, error } = useMeetings();
  const deleteMutation = useDeleteMeeting();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="py-4">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) return <div className="text-destructive p-8 text-center font-medium">Error loading meetings.</div>;
  
  if (!meetings || meetings.length === 0) {
    return (
      <Card className="text-center p-12 border-dashed border-2">
        <CardContent className="pt-6">
          <FileAudio className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No meetings found</h3>
          <p className="text-muted-foreground mt-1 mb-6">Get started by creating a new meeting.</p>
          <Button asChild>
            <Link to="/meetings/new">Create New Meeting</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {meetings.map((meeting) => (
        <Card key={meeting._id} className="hover:shadow-md transition-shadow flex flex-col">
          { (meeting.status === 'uploaded' || meeting.status === 'processing') && (
            <MeetingStatusPoller meetingId={meeting._id} currentStatus={meeting.status} />
          )}
          <CardHeader className="pb-3 flex-1">
            <div className="flex justify-between items-start mb-2">
              <StatusBadge status={meeting.status} />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2 -mt-2"
                onClick={() => handleDelete(meeting._id)}
                title="Delete Meeting"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="text-lg font-semibold line-clamp-2">
              <Link to={`/meetings/${meeting._id}`} className="hover:underline">
                {meeting.title}
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              {new Date(meeting.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
             <Button variant="outline" className="w-full" asChild>
                <Link to={`/meetings/${meeting._id}`}>View Details</Link>
             </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
