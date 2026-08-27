'use client';

import React from 'react';
import { WifiOff, RefreshCw, Layers, Wrench, Package } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#14171d] border border-border-gray rounded-[16px] p-6 sm:p-8 shadow-subtle text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Badge Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-semantic-danger-subtle flex items-center justify-center text-semantic-danger-dark border border-semantic-danger/20">
          <WifiOff className="w-8 h-8" />
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-ink tracking-tight">
            Offline Mode
          </h1>
          <p className="text-sm text-cool-gray leading-relaxed">
            Your device is disconnected from the plant network. Cached views remain accessible, but live updates and mutations are queued.
          </p>
        </div>

        {/* Retry Button */}
        <div className="pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-[10px] shadow-sm transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>

        {/* Quick Cached Sections */}
        <div className="border-t border-border-gray pt-5 text-left space-y-3">
          <p className="text-xs font-semibold text-cool-gray uppercase tracking-wider">
            Cached Workspace Areas
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/projects"
              className="flex flex-col items-center justify-center p-3 rounded-[10px] bg-canvas border border-border-gray hover:border-primary/50 text-ink transition-colors text-center"
            >
              <Layers className="w-5 h-5 text-cool-gray mb-1" />
              <span className="text-[11px] font-medium">Projects</span>
            </Link>
            <Link
              href="/production"
              className="flex flex-col items-center justify-center p-3 rounded-[10px] bg-canvas border border-border-gray hover:border-primary/50 text-ink transition-colors text-center"
            >
              <Wrench className="w-5 h-5 text-cool-gray mb-1" />
              <span className="text-[11px] font-medium">Shop Floor</span>
            </Link>
            <Link
              href="/purchase-requisitions"
              className="flex flex-col items-center justify-center p-3 rounded-[10px] bg-canvas border border-border-gray hover:border-primary/50 text-ink transition-colors text-center"
            >
              <Package className="w-5 h-5 text-cool-gray mb-1" />
              <span className="text-[11px] font-medium">Inventory</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
