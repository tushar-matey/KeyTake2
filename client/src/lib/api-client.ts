import { userPool } from './cognito';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getAuthToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      resolve(null);
      return;
    }
    user.getSession((err: any, session: any) => {
      if (err || !session.isValid()) {
        resolve(null);
      } else {
        resolve(session.getAccessToken().getJwtToken());
      }
    });
  });
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = 'Network response was not ok';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // Ignore if not json
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

export const apiClient = {
  get: async (url: string) => {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    const response = await fetch(fullUrl, { headers });
    return handleResponse(response);
  },
  post: async (url: string, body: any) => {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    const response = await fetch(fullUrl, { 
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    return handleResponse(response);
  },
  delete: async (url: string) => {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    const response = await fetch(fullUrl, { 
      method: 'DELETE',
      headers
    });
    return handleResponse(response);
  }
};
