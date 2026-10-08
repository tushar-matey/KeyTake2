import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMeeting, useMeetingSummary } from '../features/meetings/api';
import { SummaryPanel } from '../features/meetings/components/SummaryPanel';
import { TranscriptView } from '../features/meetings/components/TranscriptView';
import { ChatPanel } from '../components/ChatPanel';
import { StatusBadge } from '../features/meetings/components/StatusBadge';
import { FilesList } from '../features/meetings/components/FilesList';
import { DeleteMeetingDialog } from '../features/meetings/components/DeleteMeetingDialog';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Loader2, FileAudio } from 'lucide-react';
import { useStatusPolling } from '../features/meetings/hooks/useStatusPolling';

export const MeetingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  const { data: meeting, isLoading: isMeetingLoading } = useMeeting(id || '');
  
  // Use the new polling hook for this meeting
  useStatusPolling(id || '', meeting?.status || '');

  const isReady = meeting?.status === 'ready';
  
  const { data: summaryData, isLoading: isSummaryLoading, isError: isSummaryError } = useMeetingSummary(id || '', isReady);

  if (isMeetingLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <Card className="text-center py-12">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">Meeting not found</h2>
          <Button asChild variant="outline">
            <Link to="/meetings">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Meetings
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col space-y-2">
        <Link to="/meetings" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center w-fit">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Meetings
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{meeting.title}</h1>
          <div className="flex items-center gap-2">
            <StatusBadge status={meeting.status} />
            <DeleteMeetingDialog meetingId={meeting._id} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Created on {new Date(meeting.createdAt).toLocaleDateString()}
        </p>
      </div>

      {!isReady ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            {meeting.status === 'processing' ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            ) : (
              <FileAudio className="h-10 w-10 text-muted-foreground mb-4" />
            )}
            <h3 className="text-lg font-medium mb-2">Meeting is {meeting.status}</h3>
            <p className="text-muted-foreground max-w-md">
              Summary and transcript will be available once processing is complete. This page will update automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-6">
            {isSummaryLoading ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                  <p className="text-foreground font-medium">Generating intelligent summary...</p>
                  <p className="text-sm text-muted-foreground mt-2">This may take up to a minute for long meetings.</p>
                </CardContent>
              </Card>
            ) : isSummaryError ? (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="p-6 text-destructive font-medium text-center">
                  Failed to generate or load the meeting summary. Please try again later.
                </CardContent>
              </Card>
            ) : summaryData ? (
              <SummaryPanel summary={summaryData.summary} />
            ) : null}
          </div>
          
          <div className="lg:col-span-7 h-full min-h-[600px] flex flex-col">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="flex-1 mt-4 p-0 border rounded-lg bg-card overflow-hidden shadow-sm">
                <ChatPanel meetingId={id || ''} />
              </TabsContent>
              
              <TabsContent value="transcript" className="flex-1 mt-4 p-0 border rounded-lg bg-card overflow-hidden shadow-sm h-[600px]">
                <TranscriptView transcript={summaryData?.transcript || []} />
              </TabsContent>

              <TabsContent value="files" className="flex-1 mt-4 p-0 border rounded-lg bg-card overflow-hidden shadow-sm h-[600px]">
                <FilesList files={meeting.files} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};
