import React from 'react';
import { Badge } from '../../../components/ui/badge';

type Status = 'uploaded' | 'processing' | 'ready' | 'failed' | string;

export function StatusBadge({ status }: { status: Status }) {
  const getBadgeVariant = (status: Status) => {
    switch (status) {
      case 'uploaded':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'ready':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getCustomClasses = (status: Status) => {
    switch (status) {
      case 'uploaded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900 border-transparent';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900 border-transparent animate-pulse';
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900 border-transparent';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900 border-transparent';
      default:
        return '';
    }
  };

  return (
    <Badge variant={getBadgeVariant(status)} className={getCustomClasses(status)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
