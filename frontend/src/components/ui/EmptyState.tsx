import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = <PackageOpen className="h-12 w-12 text-slate-500" />, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full max-w-2xl mx-auto">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full"></div>
        <div className="relative bg-white/[0.03] p-6 rounded-[2rem] border border-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_0_10px_40px_rgba(0,0,0,0.5)]">
          {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'h-16 w-16 text-indigo-400 opacity-80' })}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-body text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
