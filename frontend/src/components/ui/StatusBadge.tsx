import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  
  const getStatusColor = (s: string) => {
    const normalized = s.toUpperCase();
    if (['ACTIVE', 'COMPLETED', 'PASS', 'APPROVED'].includes(normalized)) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (['INACTIVE', 'REJECTED', 'CANCELLED', 'SCRAP'].includes(normalized)) return 'bg-red-500/10 text-red-400 border border-red-500/20';
    if (['DRAFT', 'PENDING', 'CREATED', 'OPEN'].includes(normalized)) return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    if (['IN_PROGRESS', 'ENGINEERING', 'PROCUREMENT', 'PRODUCTION'].includes(normalized)) return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-full ${sizes[size]} ${getStatusColor(status)}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
