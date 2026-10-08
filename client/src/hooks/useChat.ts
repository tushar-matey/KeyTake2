import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from '@keytake/shared';
import { apiClient, getAuthToken, API_URL } from '../lib/api-client';

export function useChat(meetingId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load history initially
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await apiClient.get(`/api/meetings/${meetingId}/chat/history`);
        setMessages(response);
      } catch (err: any) {
        setError('Failed to load chat history');
      }
    };
    loadHistory();
  }, [meetingId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add optimistic user message
    const userMsg: ChatMessage = {
      role: 'user',
      content,
      meetingId,
      userId: 'temp', // will be replaced on refresh
    };
    
    // Add empty assistant message that will be populated
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: '',
      meetingId,
      userId: 'temp',
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const token = await getAuthToken();
      
      const baseUrl = API_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/meetings/${meetingId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: content }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process SSE lines
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // Keep the last incomplete chunk in the buffer

          for (const chunk of lines) {
            const eventMatch = chunk.match(/event: (.*)\n/);
            const dataMatch = chunk.match(/data: (.*)/);
            
            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1];
              const eventData = JSON.parse(dataMatch[1]);
              
              if (eventType === 'token') {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  newMessages[lastIndex] = {
                    ...newMessages[lastIndex],
                    content: newMessages[lastIndex].content + eventData.text
                  };
                  return newMessages;
                });
              } else if (eventType === 'error') {
                setError(eventData.message);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError('Failed to send message');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [meetingId]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { messages, loading, error, sendMessage, abort };
}
