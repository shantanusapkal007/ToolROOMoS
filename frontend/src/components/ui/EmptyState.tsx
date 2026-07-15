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
        <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full"></div>
        <div className="relative bg-white p-6 rounded-[2rem] border border-black/5 shadow-elevation">
          {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'h-16 w-16 text-indigo-600 opacity-80' })}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-zinc-900 mb-3 tracking-tight">{title}</h3>
      <p className="text-body text-zinc-500 max-w-md mx-auto mb-8 leading-relaxed">
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
