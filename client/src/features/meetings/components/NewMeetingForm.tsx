import React, { useState } from 'react';

import { FileDropzone } from './FileDropzone';
import { useCreateMeeting } from '../api';
import { useFileUpload } from '../hooks/useFileUpload';
import { useNavigate } from 'react-router-dom';

const computeHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const NewMeetingForm = () => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const createMeetingMutation = useCreateMeeting();
  const { uploadFile, progress, isUploading, error } = useFileUpload();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;

    setIsProcessing(true);
    try {
      // 1. Compute Hash
      const hash = await computeHash(file);
      
      // 2. Create Meeting DB Record
      const meeting = await createMeetingMutation.mutateAsync(title);
      
      // 3. Upload File
      await uploadFile(meeting._id, file, hash);
      
      // 4. Redirect
      navigate('/meetings');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create meeting and upload file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
          placeholder="E.g., Weekly Sync"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Audio Recording</label>
        {!file ? (
          <FileDropzone onFileSelect={setFile} />
        ) : (
          <div className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
            <span className="truncate">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            {!isUploading && (
              <button 
                type="button" 
                onClick={() => setFile(null)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-md text-sm">{error}</div>
      )}

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          <p className="text-xs text-gray-500 text-center mt-1">Uploading... {progress}%</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!title || !file || isProcessing}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Create Meeting'}
      </button>
    </form>
  );
};
