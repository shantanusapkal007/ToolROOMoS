'use client';

import React, { ReactNode, useState } from 'react';
import { CommandPalette } from '../search/CommandPalette';
import { Sidebar } from './Sidebar';
import { UniversalContextMenu } from './UniversalContextMenu';
import { UniversalHistory } from './UniversalHistory';
import { UniversalAttachments } from './UniversalAttachments';
import { UniversalImport } from './UniversalImport';
import { useUniversalKeyboard } from '@/hooks/useUniversalKeyboard';
import { useToolbarStore } from '@/store/useToolbarStore';

interface UniversalLayoutProps {
  children: ReactNode;
  breadcrumb?: ReactNode;
  toolbar?: ReactNode;
  documentTabs?: ReactNode;
  sidePanel?: ReactNode;
}

export function UniversalLayout({
  children,
  breadcrumb,
  toolbar,
  documentTabs,
  sidePanel,
}: UniversalLayoutProps) {
  useUniversalKeyboard();
  const { isHistoryOpen, setHistoryOpen, isAttachmentsOpen, setAttachmentsOpen, isImportOpen, setImportOpen } = useToolbarStore();
  const [statusHovered, setStatusHovered] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden relative mission-control-bg">

      {/* Main Structure: Sidebar + Workspace */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Sidebar */}
        <Sidebar />

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Integrated Top Bar — breadcrumb + toolbar merged */}
          <div className="shrink-0 flex items-center justify-between px-[var(--space-3)] pt-[var(--space-2-5)] pb-[var(--space-1-5)] relative z-20 animate-fade-in-soft">
            <div className="flex items-center gap-3">
              {breadcrumb}
            </div>
            <div className="flex items-center gap-1">
              {toolbar}
            </div>
          </div>

          {/* Document Tabs */}
          {documentTabs && (
            <div className="shrink-0 px-[var(--space-3)] border-b border-[var(--border-500)]">
              {documentTabs}
            </div>
          )}

          {/* Scrollable Content Body */}
          <div className="flex-1 flex overflow-hidden px-[var(--space-2-5)] pt-[var(--space-1-5)] pb-[var(--space-1)] animate-fade-in">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {children}
            </div>

            {/* Right Inspector Panel */}
            {sidePanel && (
              <aside className="w-[280px] shrink-0 ml-[var(--space-2)] border-l border-[var(--border-500)] pl-[var(--space-2)] overflow-y-auto custom-scrollbar">
                {sidePanel}
              </aside>
            )}
          </div>

          {/* Floating Status Bar — appears on hover */}
          <div 
            onMouseEnter={() => setStatusHovered(true)}
            onMouseLeave={() => setStatusHovered(false)}
            className={`h-[28px] shrink-0 flex items-center px-[var(--space-3)] justify-between text-micro tracking-wider uppercase transition-all duration-500 ${
              statusHovered ? 'text-[var(--text-secondary)] bg-[var(--hover-600)]' : 'text-[var(--text-tertiary)]'
            }`}
          >
            <div className="flex items-center gap-[var(--space-1-5)]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] shadow-[var(--shadow-glow)]" />
                Ready
              </span>
            </div>
            <div className="font-mono">ToolRoomOS v1.0</div>
          </div>
        </main>
      </div>

      {/* Persistent Search */}
      <CommandPalette />

      {/* Global Context Menu */}
      <UniversalContextMenu />

      {/* Global Modals */}
      {isHistoryOpen && <UniversalHistory onClose={() => setHistoryOpen(false)} />}
      {isAttachmentsOpen && <UniversalAttachments onClose={() => setAttachmentsOpen(false)} />}
      {isImportOpen && <UniversalImport onClose={() => setImportOpen(false)} />}
    </div>
  );
}
