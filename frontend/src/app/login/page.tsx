'use client';

import React, { useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

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
      const response = await api.post('/auth/login', { email, password });
      if (response && response.access_token) {
        login(response.access_token, response.user);
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
    <div className="min-h-screen flex items-center justify-center bg-[#050A14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050A14] to-[#050A14]">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 glass-panel rounded-2xl relative z-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-400 p-px mb-4">
            <div className="w-full h-full bg-[#050A14] rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400" strokeWidth={2.5} color="url(#grad1)" />
              <svg width="0" height="0">
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop stopColor="#60A5FA" offset="0%" />
                  <stop stopColor="#34D399" offset="100%" />
                </linearGradient>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ToolRoomOS</h1>
          <p className="text-slate-400 text-sm">Sign in to the Mission Control</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@toolroom.com"
            required
            leftIcon={<Mail className="h-5 w-5" />}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            leftIcon={<Lock className="h-5 w-5" />}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-slate-500">
          For demo purposes, use <strong className="text-slate-300">admin@toolroom.com</strong> / <strong className="text-slate-300">admin123</strong>
        </div>
      </div>
    </div>
  );
}
