"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  onUndo?: () => void;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, onUndo?: () => void) => void;
  success: (title: string, message?: string, onUndo?: () => void) => void;
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

  const toast = useCallback((type: ToastType, title: string, message?: string, onUndo?: () => void) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    setToasts((prev) => [...prev, { id, type, title, message, onUndo }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string, onUndo?: () => void) => toast('success', title, message, onUndo), [toast]);
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
      case 'success': return 'bg-white/95 border-emerald-500/20 shadow-emerald-500/5';
      case 'error': return 'bg-white/95 border-red-500/20 shadow-red-500/5';
      case 'warning': return 'bg-white/95 border-amber-500/20 shadow-amber-500/5';
      case 'info': return 'bg-white/95 border-blue-500/20 shadow-blue-500/5';
    }
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end space-y-3 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-up pointer-events-auto relative overflow-hidden flex flex-col p-4 rounded-2xl border backdrop-blur-2xl shadow-floating w-full transition-all duration-300 ${getBgClass(t.type)}`}
          >
            <div className="flex items-start">
              <div className="shrink-0 mr-3 mt-0.5">
                {getIcon(t.type)}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-zinc-900 leading-5">{t.title}</h4>
                {t.message && (
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{t.message}</p>
                )}
              </div>
              {t.onUndo && (
                <button
                  onClick={() => {
                    t.onUndo?.();
                    removeToast(t.id);
                  }}
                  className="shrink-0 ml-3 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 ml-3 text-zinc-400 hover:text-zinc-700 transition-colors p-0.5 rounded-md hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Ambient Progress Countdown Line */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5">
              <div className="h-full bg-blue-500/40 animate-[shrink_5s_linear_forwards]" style={{ width: '100%' }} />
            </div>
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
