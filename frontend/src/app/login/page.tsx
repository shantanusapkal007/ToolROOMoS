'use client';

import React, { useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Lock, Mail, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@toolroom.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post<any>('/auth/login', { email, password });
      const data = response as any;
      if (data && data.access_token) {
        login(data.access_token, data.refresh_token, data.user);
      } else {
        setError('Invalid response from server.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      {/* Background is handled by layout.tsx (Premium orbs) */}

      <div className="w-full max-w-[420px] p-10 glass-panel relative z-10">
        
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 rounded-[1.25rem] bg-white border border-hairline/60 shadow-[0_8px_16px_rgba(15,15,20,0.04)] flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-ink" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-ink mb-2 tracking-tight">ToolRoomOS</h1>
          <p className="text-zinc-600 font-medium text-sm">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-100 flex items-start space-x-3 text-red-600 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@toolroom.com"
              required
              leftIcon={<Mail className="h-5 w-5" />}
            />
          </div>

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={<Lock className="h-5 w-5" />}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-black text-white rounded-md font-semibold text-sm transition-all shadow-[0_4px_14px_rgba(10,10,12,0.15)] hover:shadow-[0_6px_20px_rgba(10,10,12,0.2)] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-center text-[11px] font-medium text-mute uppercase tracking-widest">
          Authorized Personnel Only
        </div>
      </div>
    </div>
  );
}

