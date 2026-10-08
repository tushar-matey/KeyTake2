import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

interface Props {
  email: string;
  onSuccess: () => void;
}

export const ConfirmEmailForm: React.FC<Props> = ({ email, onSuccess }) => {
  const { confirmEmail } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await confirmEmail(email, code);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm">Enter the 6-digit code sent to {email}</div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Confirmation Code</label>
        <input 
          type="text" 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-2 border rounded bg-background text-foreground"
          required
        />
      </div>
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? 'Confirming...' : 'Confirm'}
      </button>
    </form>
  );
};
