'use client';

import React from 'react';
import { 
  Plus, Save, Copy, FileUp, FileDown, 
  Printer, Paperclip, History, 
  GitBranch, Trash2, MoreHorizontal, Loader2, CheckCircle,
  RefreshCw, Search
} from 'lucide-react';
import { useToolbarStore, ToolbarCommand } from '@/store/useToolbarStore';
import { usePathname, useRouter } from 'next/navigation';

interface UniversalToolbarProps {
  onNew?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRevision?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onAttach?: () => void;
  onHistory?: () => void;
  onMore?: () => void;
  onRefresh?: () => void;
  onSearch?: () => void;
}

export function UniversalToolbar(props: UniversalToolbarProps) {
  const { activeFeature, capabilities, isDirty, isBusy, executeCommand, selection } = useToolbarStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleCommand = (cmd: ToolbarCommand, legacyHandler?: () => void) => {
    if (activeFeature) {
      executeCommand(cmd);
    } else if (legacyHandler) {
      legacyHandler();
    } else {
      if (cmd === 'new') {
        if (!pathname.endsWith('/new')) {
          router.push(`${pathname}/new`);
        }
      }
      else if (cmd === 'print') window.print();
    }
  };

  const renderButton = (
    cmd: ToolbarCommand, 
    icon: React.ReactNode, 
    defaultLabel: string, 
    legacyHandler?: () => void, 
    primary = false, 
    requiresSelection = false
  ) => {
    if (activeFeature) {
      const cap = capabilities[cmd];
      if (!cap) return null;

      const isEnabled = typeof cap === 'object' ? cap.enabled : cap;
      const label = (typeof cap === 'object' && cap.label) ? cap.label : defaultLabel;
      let disabled = !isEnabled || isBusy;

      if (cmd === 'save' && !isDirty) disabled = true;
      if (requiresSelection && selection.length === 0) disabled = true;

      return (
        <ToolbarButton 
          icon={isBusy && cmd === 'save' ? <Loader2 size={15} className="animate-spin" /> : icon} 
          label={isBusy && cmd === 'save' ? 'Saving...' : label} 
          primary={primary} 
          disabled={disabled}
          onClick={() => handleCommand(cmd)} 
          danger={cmd === 'delete'}
          glowing={cmd === 'save' && isDirty && !disabled}
        />
      );
    }

    return (
      <ToolbarButton 
        icon={icon} 
        label={defaultLabel} 
        primary={primary} 
        onClick={() => handleCommand(cmd, legacyHandler)} 
        danger={cmd === 'delete'}
      />
    );
  };

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto hide-scrollbar hide-on-print">
      {renderButton('new', <Plus size={15} />, 'New', props.onNew, true)}
      {renderButton('save', <Save size={15} />, 'Save', props.onSave)}
      
      {activeFeature && isDirty && (
        <span className="flex items-center text-micro font-bold text-[var(--color-warning)] uppercase tracking-widest mx-1.5 animate-pulse">
          <span className="w-1 h-1 bg-[var(--color-warning)] rounded-full mr-1 shadow-[var(--shadow-glow)]" />
          Modified
        </span>
      )}

      <Divider />
      
      {renderButton('duplicate', <Copy size={15} />, 'Duplicate', props.onDuplicate, false, true)}
      {renderButton('revision', <GitBranch size={15} />, 'Revision', props.onRevision)}
      
      <Divider />
      
      {renderButton('import', <FileUp size={15} />, 'Import', props.onImport)}
      {renderButton('export', <FileDown size={15} />, 'Export', props.onExport)}
      
      <Divider />
      
      {renderButton('print', <Printer size={15} />, 'Print', props.onPrint)}
      {renderButton('attachments', <Paperclip size={15} />, 'Attach', props.onAttach)}
      {renderButton('history', <History size={15} />, 'History', props.onHistory)}
      
      <Divider />
      
      {renderButton('refresh', <RefreshCw size={15} />, 'Refresh', props.onRefresh)}
      {renderButton('search', <Search size={15} />, 'Search', props.onSearch)}

      <Divider />

      {renderButton('delete', <Trash2 size={15} />, 'Delete', props.onDelete, false, true)}
      {renderButton('more', <MoreHorizontal size={15} />, 'More', props.onMore)}
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-[var(--border-500)] mx-0.5 shrink-0" />;
}

function ToolbarButton({ 
  icon, label, primary, disabled, danger, glowing, onClick 
}: { 
  icon: React.ReactNode; label: string; primary?: boolean; disabled?: boolean; danger?: boolean; glowing?: boolean; onClick?: () => void;
}) {
  const base = "relative flex items-center justify-center w-8 h-8 rounded-lg text-xs transition-all duration-300 ease-out group/btn shrink-0 backdrop-blur-md";
  
  if (disabled) {
    return (
      <button disabled className={`${base} text-[var(--text-tertiary)] cursor-not-allowed`} title={label} aria-label={label}>
        {icon}
      </button>
    );
  }

  if (primary) {
    return (
      <button onClick={onClick} className={`${base} bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-white border border-indigo-500/20 hover:border-indigo-500/40 hover:shadow-elevation`} title={label} aria-label={label}>
        {icon}
        {/* Tooltip */}
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/10 backdrop-blur-md text-zinc-900 text-[10px] uppercase tracking-wider rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none border border-black/10 shadow-xl z-50">
          {label}
        </span>
      </button>
    );
  }

  if (danger) {
    return (
      <button onClick={onClick} className={`${base} text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:shadow-elevation`} title={label} aria-label={label}>
        {icon}
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/10 backdrop-blur-md text-zinc-900 text-[10px] uppercase tracking-wider rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none border border-black/10 shadow-xl z-50">
          {label}
        </span>
      </button>
    );
  }

  return (
    <button onClick={onClick} className={`${base} text-zinc-500 hover:text-white hover:bg-white/[0.05] hover:border hover:border-black/10 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${glowing ? 'text-indigo-400 shadow-elevation bg-indigo-500/10' : ''}`} title={label} aria-label={label}>
      {icon}
      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/10 backdrop-blur-md text-zinc-900 text-[10px] uppercase tracking-wider rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none border border-black/10 shadow-xl z-50">
        {label}
      </span>
    </button>
  );
}
