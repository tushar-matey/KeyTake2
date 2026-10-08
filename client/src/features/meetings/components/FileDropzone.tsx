import React, { useCallback } from 'react';
import { ALLOWED_AUDIO_EXTS, MAX_AUDIO_SIZE_BYTES } from '@keytake/shared';
import { UploadCloud } from 'lucide-react';

interface Props {
  onFileSelect: (file: File) => void;
}

export const FileDropzone: React.FC<Props> = ({ onFileSelect }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_AUDIO_EXTS.includes(ext as any)) {
      alert(`Invalid file type. Allowed: ${ALLOWED_AUDIO_EXTS.join(', ')}`);
      return;
    }
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      alert(`File is too large. Max 500MB.`);
      return;
    }
    onFileSelect(file);
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-foreground font-medium">Click or drag file to this area to upload</p>
      <p className="text-sm text-muted-foreground mt-2">Support for a single audio file upload. {ALLOWED_AUDIO_EXTS.join(', ')}</p>
      <input 
        id="fileInput" 
        type="file" 
        className="hidden" 
        accept={ALLOWED_AUDIO_EXTS.join(',')} 
        onChange={handleChange}
      />
    </div>
  );
};
