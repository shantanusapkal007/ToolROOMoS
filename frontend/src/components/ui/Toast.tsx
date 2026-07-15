"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => toast('success', title, message), [toast]);
  const error = useCallback((title: string, message?: string) => toast('error', title, message), [toast]);
  const info = useCallback((title: string, message?: string) => toast('info', title, message), [toast]);
  const warning = useCallback((title: string, message?: string) => toast('warning', title, message), [toast]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBgClass = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-white/95 border-emerald-200';
      case 'error': return 'bg-white/95 border-red-200';
      case 'warning': return 'bg-white/95 border-amber-200';
      case 'info': return 'bg-white/95 border-blue-200';
    }
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-0 right-0 p-6 z-[100] flex flex-col items-end space-y-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-up pointer-events-auto flex items-start p-4 rounded-xl border backdrop-blur-md shadow-2xl w-80 max-w-[calc(100vw-2rem)] ${getBgClass(t.type)}`}
          >
            <div className="shrink-0 mr-3 mt-0.5">
              {getIcon(t.type)}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-zinc-900 leading-5">{t.title}</h4>
              {t.message && (
                <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 ml-4 text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
