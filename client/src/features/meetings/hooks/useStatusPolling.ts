import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useStatusPolling(meetingId: string, currentStatus: string) {
  const queryClient = useQueryClient();
  const isTerminal = currentStatus === 'ready' || currentStatus === 'failed';
  const [startTime] = useState(Date.now());
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return useQuery({
    queryKey: ['meeting-status', meetingId],
    queryFn: async () => {
      const res = await apiClient.get(`${API_URL}/meetings/${meetingId}/status`);
      if (res.status === 'ready' || res.status === 'failed') {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
      }
      return res;
    },
    refetchInterval: (query) => {
      const status = query.state?.data?.status || currentStatus;
      const isNowTerminal = status === 'ready' || status === 'failed';
      if (isNowTerminal || !isVisible) return false;

      const elapsed = Date.now() - startTime;
      // Maximum polling duration: 10 minutes
      if (elapsed > 10 * 60 * 1000) return false;
      
      // Start at 5s, increase to 10s after 1 minute
      return elapsed < 60000 ? 5000 : 10000;
    },
    enabled: !isTerminal && isVisible,
    refetchOnWindowFocus: false,
  });
}
