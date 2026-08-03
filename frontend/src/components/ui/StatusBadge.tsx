import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const normalized = status ? status.toUpperCase() : '';
  
  const getStatusColor = (s: string) => {
    if (['ACTIVE', 'COMPLETED', 'PASS', 'APPROVED'].includes(s)) return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs';
    if (['INACTIVE', 'REJECTED', 'CANCELLED', 'SCRAP', 'CRITICAL', 'OVERDUE'].includes(s)) return 'bg-red-50 text-red-700 border border-red-200/80 shadow-xs';
    if (['DRAFT', 'PENDING', 'CREATED', 'OPEN'].includes(s)) return 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs';
    if (['IN_PROGRESS', 'ENGINEERING', 'PROCUREMENT', 'PRODUCTION', 'RUNNING'].includes(s)) return 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs';
    return 'bg-zinc-100 text-zinc-700 border border-zinc-200/80 shadow-xs';
  };

  const isLive = ['IN_PROGRESS', 'ENGINEERING', 'PRODUCTION', 'RUNNING', 'ACTIVE'].includes(normalized);

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full backdrop-blur-xs transition-all duration-300 ${sizes[size]} ${getStatusColor(normalized)}`}>
      <span className="relative flex h-2 w-2 mr-1.5 items-center justify-center">
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
      </span>
      {status ? status.replace(/_/g, ' ') : '-'}
    </span>
  );
};
