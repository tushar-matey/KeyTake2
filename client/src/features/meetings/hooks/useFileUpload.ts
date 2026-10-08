import { useState } from 'react';
import { apiClient } from '../../../lib/api-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useFileUpload = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (meetingId: string, file: File, hash: string) => {
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // 1. Get presigned URLs
      const urlResponse = await apiClient.post(`/api/meetings/${meetingId}/upload-url`, {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        hash,
      });

      const { uploadId, parts } = urlResponse;
      const uploadedParts: { PartNumber: number; ETag: string }[] = [];
      const partSize = 5 * 1024 * 1024; // Must match server calculation

      let uploadedBytes = 0;

      // 2. Upload parts sequentially (or in parallel if desired, but sequentially is safer for progress)
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        const response = await fetch(part.Url, {
          method: 'PUT',
          body: chunk,
          headers: {
            // S3 presigned URLs might fail if Content-Type doesn't exactly match what was presigned,
            // but for part uploads, we generally don't set Content-Type on the part request unless it was in the presigner.
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to upload part ${part.PartNumber}`);
        }

        const etag = response.headers.get('ETag');
        if (!etag) {
          throw new Error(`No ETag returned for part ${part.PartNumber}`);
        }

        uploadedParts.push({
          PartNumber: part.PartNumber,
          ETag: etag.replace(/"/g, ''), // S3 returns ETags with quotes
        });

        uploadedBytes += chunk.size;
        setProgress(Math.round((uploadedBytes / file.size) * 100));
      }

      // 3. Complete multipart upload
      await apiClient.post(`/api/meetings/${meetingId}/complete-upload`, {
        uploadId,
        parts: uploadedParts,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        hash,
      });

      setIsUploading(false);
      setProgress(100);
      return true;

    } catch (err: any) {
      console.error('Upload failed', err);
      setError(err.message || 'File upload failed');
      setIsUploading(false);
      throw err;
    }
  };

  return { uploadFile, progress, isUploading, error };
};
