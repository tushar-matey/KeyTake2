import React, { useCallback } from 'react';
import { ALLOWED_AUDIO_EXTS, MAX_AUDIO_SIZE_BYTES, ALLOWED_DOC_EXTS, MAX_DOC_SIZE_BYTES } from '@keytake/shared';
import { UploadCloud, FileText } from 'lucide-react';

interface Props {
  onFileSelect: (file: File) => void;
  fileType: 'audio' | 'document';
}

export const FileDropzone: React.FC<Props> = ({ onFileSelect, fileType }) => {
  const allowedExts = fileType === 'audio' ? ALLOWED_AUDIO_EXTS : ALLOWED_DOC_EXTS;
  const maxSize = fileType === 'audio' ? MAX_AUDIO_SIZE_BYTES : MAX_DOC_SIZE_BYTES;
  const maxMb = maxSize / 1024 / 1024;

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
    if (!allowedExts.includes(ext as any)) {
      alert(`Invalid file type. Allowed: ${allowedExts.join(', ')}`);
      return;
    }
    if (file.size > maxSize) {
      alert(`File is too large. Max ${maxMb}MB.`);
      return;
    }
    onFileSelect(file);
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => document.getElementById(`fileInput-${fileType}`)?.click()}
    >
      {fileType === 'audio' ? (
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      ) : (
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      )}
      <p className="text-foreground font-medium">Click or drag file to this area to upload</p>
      <p className="text-sm text-muted-foreground mt-2">
        Support for a single {fileType} file upload. {allowedExts.join(', ')}
      </p>
      <input 
        id={`fileInput-${fileType}`}
        type="file" 
        className="hidden" 
        accept={allowedExts.join(',')} 
        onChange={handleChange}
      />
    </div>
  );
};
