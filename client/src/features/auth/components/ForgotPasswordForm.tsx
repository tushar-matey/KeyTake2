import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export const ForgotPasswordForm = () => {
  const { forgotPassword, confirmResetPassword } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await forgotPassword(email);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to request reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await confirmResetPassword(email, code, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center p-4">
        <p className="text-green-600 mb-4">Password has been reset successfully!</p>
        <p className="text-sm">You can now sign in with your new password.</p>
      </div>
    );
  }

  return step === 1 ? (
    <form onSubmit={handleRequestCode} className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? 'Requesting...' : 'Request Reset Code'}
      </button>
    </form>
  ) : (
    <form onSubmit={handleReset} className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Reset Code</label>
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">New Password (min 8 chars)</label>
        <input 
          type="password" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
          minLength={8}
        />
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
};
