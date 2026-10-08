import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api-client';
import { Link } from 'react-router-dom';

export const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiClient.get('http://localhost:3001/api/auth/me');
        setProfile(data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Link to="/meetings" className="bg-blue-500 text-white px-4 py-2 rounded font-medium hover:bg-blue-600">
            Go to Meetings
          </Link>
          <button 
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded font-medium hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="bg-card border text-card-foreground p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-4">Auth Info</h2>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>User ID:</strong> {user?.userId}</p>
      </div>

      {profile && (
        <div className="bg-card border text-card-foreground p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Server Profile Data</h2>
          <pre className="bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
