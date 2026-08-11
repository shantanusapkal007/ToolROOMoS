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

/**
 * Toast Component matching Design System tokens:
 * - bg canvas, 1px hairline border, radius md (8px), level-2 shadow
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string, onUndo?: () => void) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    setToasts((prev) => [...prev, { id, type, title, message, onUndo }]);
    
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
      case 'success': return <CheckCircle2 className="h-4.5 w-4.5 text-accent-green" />;
      case 'error': return <AlertCircle className="h-4.5 w-4.5 text-accent-red" />;
      case 'warning': return <AlertTriangle className="h-4.5 w-4.5 text-accent-orange" />;
      case 'info': return <Info className="h-4.5 w-4.5 text-accent-blue-info" />;
    }
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end space-y-3 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto relative overflow-hidden flex flex-col p-4 rounded-[12px] border border-border-gray bg-canvas shadow-subtle w-full transition-all duration-200"
          >
            <div className="flex items-start">
              <div className="shrink-0 mr-3 mt-0.5">
                {getIcon(t.type)}
              </div>
              <div className="flex-1">
                <h4 className="text-body-sm-strong text-ink">{t.title}</h4>
                {t.message && (
                  <p className="text-caption text-mute mt-0.5">{t.message}</p>
                )}
              </div>
              {t.onUndo && (
                <button
                  onClick={() => {
                    t.onUndo?.();
                    removeToast(t.id);
                  }}
                  className="shrink-0 ml-3 text-caption font-medium text-ink bg-canvas border border-border-gray px-2 py-1 rounded-[10px] hover:bg-hairline/20 transition-colors"
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 ml-3 text-mute hover:text-ink transition-colors p-1 rounded-[10px] hover:bg-hairline/20"
              >
                <X className="h-4 w-4" />
              </button>
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
