'use client';

import React, { useState } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post<any>('/auth/login', { email, password });
      const authData = (response as any)?.data?.access_token ? (response as any).data : (response as any);
      if (authData && authData.access_token) {
        login(authData.access_token, authData.refresh_token, authData.user);
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-canvas text-ink select-none">
      <div className="w-full max-w-[420px] p-8 sm:p-10 bg-white dark:bg-canvas border border-border-gray dark:border-hairline rounded-[16px] shadow-subtle relative z-10">
        
        {/* Header with Official Logo & Wordmark */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-[14px] bg-white border border-border-gray shadow-micro flex items-center justify-center mb-4 p-2.5">
            <img 
              src="/short_logo.png" 
              alt="ToolRoomOS Official Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-heading-xl font-bold mb-1.5 tracking-tight">
            <span className="text-[#7d849b]">ToolRoom</span><span className="text-primary">OS</span>
          </h1>
          <p className="text-body-sm text-cool-gray font-medium">Sign in to your account</p>
        </div>

        {/* Semantic Status Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-[10px] bg-semantic-danger-subtle border border-semantic-danger/20 flex items-start space-x-3 text-semantic-danger-dark text-caption font-medium shadow-micro">
            <AlertCircle className="w-5 h-5 shrink-0 text-semantic-danger" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              leftIcon={<Mail className="h-5 w-5" />}
            />
          </div>

          <div className="space-y-1">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-silver-blue hover:text-ink transition-colors cursor-pointer p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold"
              isLoading={isLoading}
              rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
            >
              Sign In
            </Button>
          </div>
        </form>
        
        {/* Security Caption */}
        <div className="mt-8 text-center text-eyebrow-uppercase-sm text-silver-blue tracking-widest">
          Authorized Personnel Only
        </div>
      </div>
    </div>
  );
}


