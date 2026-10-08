import React from 'react';
import ReactMarkdown from 'react-markdown';

interface SummaryPanelProps {
  summary: string;
}

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ summary }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Meeting Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-primary">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};
