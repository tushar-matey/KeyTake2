import React, { useState } from 'react';
import { FileDropzone } from './FileDropzone';
import { useCreateMeeting } from '../api';
import { useFileUpload } from '../hooks/useFileUpload';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent } from '../../../components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

const computeHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
      URL.revokeObjectURL(objectUrl);
    });
    audio.addEventListener('error', () => {
      resolve(0);
      URL.revokeObjectURL(objectUrl);
    });
  });
};

export const NewMeetingForm = () => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const createMeetingMutation = useCreateMeeting();
  const { uploadFile, progress, isUploading, error } = useFileUpload();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRemoveDoc = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;

    // Check duration for files > 30 minutes
    const durationSeconds = await getAudioDuration(file);
    const estimatedDurationMinutes = durationSeconds / 60;
    
    if (estimatedDurationMinutes > 30) {
      const estimatedCost = (estimatedDurationMinutes * 0.012).toFixed(2);
      if (!window.confirm(`This audio file appears to be over 30 minutes long. Estimated processing cost: ~$${estimatedCost}.\nAre you sure you want to continue?`)) {
        return;
      }
    }

    setIsProcessing(true);
    try {
      // 1. Create Meeting DB Record
      const meeting = await createMeetingMutation.mutateAsync(title);
      
      // 2. Upload Audio File
      const audioHash = await computeHash(file);
      await uploadFile(meeting._id, file, audioHash);
      
      // 3. Upload Document Files
      for (const doc of documents) {
        const docHash = await computeHash(doc);
        await uploadFile(meeting._id, doc, docHash);
      }
      
      toast({
        title: "Meeting uploaded",
        description: "Your meeting and files are now processing in the background.",
      });
      
      // 4. Redirect
      navigate('/meetings');
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || 'Failed to create meeting and upload files.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-none shadow-none md:border md:shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="E.g., Weekly Sync"
            />
          </div>

          <div className="space-y-2">
            <Label>Audio Recording</Label>
            {!file ? (
              <FileDropzone onFileSelect={setFile} fileType="audio" />
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                <span className="truncate text-sm font-medium">{file.name} <span className="text-muted-foreground font-normal">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                {!isProcessing && (
                  <Button 
                    type="button" 
                    variant="ghost"
                    onClick={() => setFile(null)}
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-8 px-2"
                  >
                    Remove
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Supporting Documents (Optional)</Label>
            <div className="space-y-2">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-md bg-muted/50">
                  <span className="truncate text-sm font-medium">{doc.name} <span className="text-muted-foreground font-normal">({(doc.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                  {!isProcessing && (
                    <Button 
                      type="button" 
                      variant="ghost"
                      onClick={() => handleRemoveDoc(i)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-8 px-2"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {!isProcessing && documents.length < 5 && (
              <FileDropzone onFileSelect={(file) => setDocuments(prev => [...prev, file])} fileType="document" />
            )}
          </div>
          
          {error && (
            <div className="text-destructive bg-destructive/10 p-3 rounded-md text-sm font-medium">{error}</div>
          )}

          {isProcessing && (
            <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
              <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              <p className="text-xs text-muted-foreground text-center mt-2">Uploading... {progress}%</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!title || !file || isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Processing...' : 'Create Meeting'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
