'use client';

import React from 'react';
import { 
  Plus, Save, Copy, FileUp, FileDown, 
  Printer, Paperclip, History, 
  GitBranch, Trash2, MoreHorizontal, Loader2,
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
          icon={isBusy && cmd === 'save' ? <Loader2 size={14} className="animate-spin" /> : icon} 
          label={isBusy && cmd === 'save' ? 'Saving...' : label} 
          primary={primary} 
          disabled={disabled}
          onClick={() => handleCommand(cmd)} 
          danger={cmd === 'delete'}
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
    <div className="h-[var(--size-toolbar)] flex items-center justify-between px-4 bg-zinc-50 border border-zinc-200 rounded-md mb-4 hide-on-print shadow-xs">
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
        {renderButton('new', <Plus size={14} />, 'New', props.onNew, true)}
        {renderButton('save', <Save size={14} />, 'Save', props.onSave)}
        
        {activeFeature && isDirty && (
          <span className="flex items-center text-micro font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-1">
            Modified
          </span>
        )}

        <Divider />
        
        {renderButton('duplicate', <Copy size={14} />, 'Duplicate', props.onDuplicate, false, true)}
        {renderButton('revision', <GitBranch size={14} />, 'Revision', props.onRevision)}
        
        <Divider />
        
        {renderButton('import', <FileUp size={14} />, 'Import', props.onImport)}
        {renderButton('export', <FileDown size={14} />, 'Export', props.onExport)}
        
        <Divider />
        
        {renderButton('print', <Printer size={14} />, 'Print', props.onPrint)}
        {renderButton('attachments', <Paperclip size={14} />, 'Attach', props.onAttach)}
        {renderButton('history', <History size={14} />, 'History', props.onHistory)}
        
        <Divider />
        
        {renderButton('refresh', <RefreshCw size={14} />, 'Refresh', props.onRefresh)}
        {renderButton('search', <Search size={14} />, 'Search', props.onSearch)}

        <Divider />

        {renderButton('delete', <Trash2 size={14} />, 'Delete', props.onDelete, false, true)}
        {renderButton('more', <MoreHorizontal size={14} />, 'More', props.onMore)}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-zinc-200 mx-1 shrink-0" />;
}

function ToolbarButton({ 
  icon, label, primary, disabled, danger, onClick 
}: { 
  icon: React.ReactNode; label: string; primary?: boolean; disabled?: boolean; danger?: boolean; onClick?: () => void;
}) {
  const base = "relative flex items-center gap-1.5 h-7 px-2.5 rounded-md text-caption font-medium transition-colors shrink-0 cursor-pointer";
  
  if (disabled) {
    return (
      <button disabled className={`${base} text-zinc-400 bg-transparent cursor-not-allowed`} title={label}>
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  if (primary) {
    return (
      <button onClick={onClick} className={`${base} bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs font-semibold`} title={label}>
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  if (danger) {
    return (
      <button onClick={onClick} className={`${base} text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent`} title={label}>
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button onClick={onClick} className={`${base} text-zinc-700 hover:bg-zinc-200/60 hover:text-zinc-900 border border-zinc-200 bg-white`} title={label}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
