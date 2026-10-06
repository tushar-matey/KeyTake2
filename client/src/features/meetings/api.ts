import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { Meeting } from '@keytake/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useMeetings = () => {
  return useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => apiClient.get(`${API_URL}/meetings`),
  });
};

export const useMeeting = (id: string) => {
  return useQuery<Meeting>({
    queryKey: ['meetings', id],
    queryFn: () => apiClient.get(`${API_URL}/meetings/${id}`),
    enabled: !!id,
    refetchInterval: (data) => {
      // Keep polling if processing, otherwise stop
      return data?.state?.data?.status === 'uploaded' || data?.state?.data?.status === 'processing' ? 5000 : false;
    }
  });
};

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (title: string) => apiClient.post(`${API_URL}/meetings`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
};

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`${API_URL}/meetings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    }
  });
};
