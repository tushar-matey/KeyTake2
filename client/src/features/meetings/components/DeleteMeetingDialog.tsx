import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface DeleteMeetingDialogProps {
  meetingId: string;
}

export function DeleteMeetingDialog({ meetingId }: DeleteMeetingDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await apiClient.delete(`/api/meetings/${meetingId}`);
      navigate('/meetings');
    } catch (err: any) {
      setError(err.message || 'Failed to delete meeting');
      setIsDeleting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="ml-4">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Meeting</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this meeting? This will permanently remove the audio, transcripts, and chat history.
          </DialogDescription>
        </DialogHeader>
        
        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <DialogFooter>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
