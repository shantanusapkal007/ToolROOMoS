'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    // Initial check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !showReconnected) {
    return null;
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-200">
      {isOffline ? (
        <div className="flex items-center gap-2 bg-[#1b1e24] border border-semantic-danger/40 text-white px-3.5 py-1.5 rounded-full shadow-lg text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-danger opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-semantic-danger"></span>
          </span>
          <WifiOff className="w-3.5 h-3.5 text-semantic-danger" />
          <span>Plant Network Offline (Cached Mode)</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-[#1b1e24] border border-semantic-success/40 text-white px-3.5 py-1.5 rounded-full shadow-lg text-xs font-medium animate-out fade-out duration-1000">
          <Wifi className="w-3.5 h-3.5 text-semantic-success" />
          <span>Connected to Plant Network</span>
        </div>
      )}
    </div>
  );
}
