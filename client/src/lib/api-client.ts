import { userPool } from './cognito';

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

export const apiClient = {
  get: async (url: string) => {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  },
  post: async (url: string, body: any) => {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { 
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  },
  delete: async (url: string) => {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { 
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  }
};
