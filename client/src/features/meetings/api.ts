import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { Meeting } from '@keytake/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useMeetings = () => {
  return useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => apiClient.get(`/api/meetings`),
  });
};

export const useMeeting = (id: string) => {
  return useQuery<Meeting>({
    queryKey: ['meetings', id],
    queryFn: () => apiClient.get(`/api/meetings/${id}`),
    enabled: !!id,
  });
};

export const useMeetingStatus = (id: string, currentStatus?: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['meetings', id, 'status'],
    queryFn: async () => {
      const res = await apiClient.get(`/api/meetings/${id}/status`);
      // If status changed to ready or failed, invalidate the main meeting query
      if (res.status === 'ready' || res.status === 'failed') {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
      }
      return res;
    },
    enabled: !!id && (currentStatus === 'uploaded' || currentStatus === 'processing'),
    refetchInterval: (query) => {
      const status = query.state?.data?.status || currentStatus;
      return (status === 'uploaded' || status === 'processing') ? 5000 : false;
    }
  });
};

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (title: string) => apiClient.post(`/api/meetings`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
};

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/meetings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    }
  });
};

import { SummaryResponse } from '@keytake/shared';

export const useMeetingSummary = (id: string, enabled = true) => {
  return useQuery<SummaryResponse>({
    queryKey: ['meetings', id, 'summary'],
    queryFn: () => apiClient.get(`/api/meetings/${id}/summary`),
    enabled: !!id && enabled,
    // The summary might take a long time to generate on the first request, so give it a larger timeout or just rely on fetch defaults.
    // Also, it is cached, so staleTime can be Infinity.
    staleTime: Infinity,
  });
};
