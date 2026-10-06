import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginForm, SignUpForm, ConfirmEmailForm, ForgotPasswordForm } from '../features/auth';

type Tab = 'signin' | 'signup' | 'confirm' | 'forgot';

export const LoginPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('signin');
  const [signUpEmail, setSignUpEmail] = useState('');

  if (isLoading) return <div>Loading...</div>;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSignUpSuccess = (email: string) => {
    setSignUpEmail(email);
    setActiveTab('confirm');
  };

  const handleConfirmSuccess = () => {
    setActiveTab('signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">keytake</h1>
        
        <div className="flex gap-4 border-b mb-6 pb-2">
          <button 
            className={`pb-2 ${activeTab === 'signin' ? 'border-b-2 border-blue-600 font-bold' : ''}`}
            onClick={() => setActiveTab('signin')}
          >
            Sign In
          </button>
          <button 
            className={`pb-2 ${activeTab === 'signup' ? 'border-b-2 border-blue-600 font-bold' : ''}`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {activeTab === 'signin' && (
          <div>
            <LoginForm />
            <div className="mt-4 text-center">
              <button 
                onClick={() => setActiveTab('forgot')}
                className="text-sm text-blue-600"
              >
                Forgot your password?
              </button>
            </div>
          </div>
        )}

        {activeTab === 'signup' && (
          <SignUpForm onSuccess={handleSignUpSuccess} />
        )}

        {activeTab === 'confirm' && (
          <ConfirmEmailForm email={signUpEmail} onSuccess={handleConfirmSuccess} />
        )}

        {activeTab === 'forgot' && (
          <div>
            <ForgotPasswordForm />
            <div className="mt-4 text-center">
              <button 
                onClick={() => setActiveTab('signin')}
                className="text-sm text-blue-600"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
