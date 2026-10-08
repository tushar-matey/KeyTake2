import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { FileAudio, FileText } from 'lucide-react';
import { Meeting } from '@keytake/shared';

interface Props {
  files: Meeting['files'];
}

export const FilesList: React.FC<Props> = ({ files }) => {
  if (!files || files.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center border-none shadow-none text-muted-foreground">
        <p>No files uploaded for this meeting.</p>
      </Card>
    );
  }

  return (
    <Card className="h-full border-none shadow-none bg-transparent overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-lg">Uploaded Files</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {files.map((file, i) => (
            <li key={i} className="flex items-center p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
              {file.type === 'audio' ? (
                <FileAudio className="h-8 w-8 text-primary flex-shrink-0 mr-4" />
              ) : (
                <FileText className="h-8 w-8 text-primary flex-shrink-0 mr-4" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.originalName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB • {file.type.toUpperCase()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
