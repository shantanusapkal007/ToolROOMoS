import React, { useState } from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

export interface DocumentAction {
  id: string;
  label: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "danger" | "success";
  visible?: boolean;
  disabled?: boolean;
  confirmation?: string;
  permission?: string;
  onClick: () => Promise<void> | void;
}

interface DocumentActionsProps {
  actions: DocumentAction[];
}

export function DocumentActions({ actions }: DocumentActionsProps) {
  const visibleActions = actions.filter(a => a.visible !== false);

  if (visibleActions.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 ml-4 pl-4 border-l border-white/[0.06]">
      {visibleActions.map((action) => (
        <DocumentActionButton key={action.id} action={action} />
      ))}
    </div>
  );
}

function DocumentActionButton({ action }: { action: DocumentAction }) {
  const [isBusy, setIsBusy] = useState(false);

  const handleClick = async () => {
    if (action.disabled || isBusy) return;
    
    if (action.confirmation) {
      if (!window.confirm(action.confirmation)) {
        return;
      }
    }

    try {
      setIsBusy(true);
      await action.onClick();
    } catch (err) {
      console.error(`Error executing action ${action.id}:`, err);
    } finally {
      setIsBusy(false);
    }
  };

  const Icon = action.icon;
  const isPrimary = action.variant === 'primary';
  const isDanger = action.variant === 'danger';
  const isSuccess = action.variant === 'success';

  const base = "relative flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-medium transition-all duration-150 ease-out group/btn shrink-0";
  
  if (action.disabled || isBusy) {
    return (
      <button disabled className={`${base} text-zinc-600 cursor-not-allowed border border-transparent`} title={action.label}>
        {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
        <span>{action.label}</span>
      </button>
    );
  }

  if (isPrimary) {
    return (
      <button 
        onClick={handleClick} 
        className={`${base} bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40`} 
        title={action.label}
      >
        <Icon size={14} />
        <span>{action.label}</span>
      </button>
    );
  }

  if (isSuccess) {
    return (
      <button 
        onClick={handleClick} 
        className={`${base} bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40`} 
        title={action.label}
      >
        <Icon size={14} />
        <span>{action.label}</span>
      </button>
    );
  }

  if (isDanger) {
    return (
      <button 
        onClick={handleClick} 
        className={`${base} text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40`} 
        title={action.label}
      >
        <Icon size={14} />
        <span>{action.label}</span>
      </button>
    );
  }

  // Secondary / default
  return (
    <button 
      onClick={handleClick} 
      className={`${base} text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1]`} 
      title={action.label}
    >
      <Icon size={14} />
      <span>{action.label}</span>
    </button>
  );
}
