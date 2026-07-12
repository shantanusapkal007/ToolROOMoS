'use client';

import React, { useEffect, useRef } from 'react';
import { useContextMenuStore } from '@/store/useContextMenuStore';
import { useToolbarStore } from '@/store/useToolbarStore';
import { Copy, Trash2, Printer, Download, Paperclip, Clock, GitCommit, Search, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UniversalContextMenu() {
  const { isOpen, x, y, row, closeContextMenu } = useContextMenuStore();
  const { capabilities, executeCommand, setSelection } = useToolbarStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeContextMenu]);

  if (!isOpen) return null;

  const handleAction = (e: React.MouseEvent, command: any) => {
    e.stopPropagation();
    // Temporarily force selection to the right-clicked row so the toolbar command executes on it
    if (row) {
      setSelection([row]);
    }
    executeCommand(command);
    closeContextMenu();
  };

  const isEnabled = (cmd: string) => (capabilities as any)[cmd]?.enabled;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] w-48 py-1.5 bg-[rgba(24,24,27,0.95)] backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl overflow-hidden"
      style={{ top: Math.min(y, window.innerHeight - 300), left: Math.min(x, window.innerWidth - 200) }}
    >
      <div className="px-3 py-1.5 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">
        Row Actions
      </div>

      {isEnabled('new') && (
        <ContextMenuItem icon={<Plus size={14} />} label="New Document" onClick={(e: React.MouseEvent) => handleAction(e, 'new')} />
      )}
      
      {isEnabled('duplicate') && (
        <ContextMenuItem icon={<Copy size={14} />} label="Duplicate" onClick={(e: React.MouseEvent) => handleAction(e, 'duplicate')} />
      )}

      {isEnabled('attachments') && (
        <ContextMenuItem icon={<Paperclip size={14} />} label="Attachments" onClick={(e: React.MouseEvent) => handleAction(e, 'attachments')} />
      )}

      {isEnabled('history') && (
        <ContextMenuItem icon={<Clock size={14} />} label="History" onClick={(e: React.MouseEvent) => handleAction(e, 'history')} />
      )}

      {isEnabled('revision') && (
        <ContextMenuItem icon={<GitCommit size={14} />} label="Revision" onClick={(e: React.MouseEvent) => handleAction(e, 'revision')} />
      )}
      
      <div className="h-px bg-white/5 my-1 mx-2" />

      {isEnabled('print') && (
        <ContextMenuItem icon={<Printer size={14} />} label="Print" onClick={(e: React.MouseEvent) => handleAction(e, 'print')} />
      )}

      {isEnabled('export') && (
        <ContextMenuItem icon={<Download size={14} />} label="Export" onClick={(e: React.MouseEvent) => handleAction(e, 'export')} />
      )}

      <div className="h-px bg-white/5 my-1 mx-2" />

      {isEnabled('delete') && (
        <ContextMenuItem icon={<Trash2 size={14} />} label="Delete" danger onClick={(e: React.MouseEvent) => handleAction(e, 'delete')} />
      )}
    </div>
  );
}

function ContextMenuItem({ icon, label, danger = false, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors text-left
        ${danger 
          ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
          : 'text-zinc-300 hover:bg-white/10 hover:text-white'
        }
      `}
    >
      <span className="opacity-70">{icon}</span>
      {label}
    </button>
  );
}
