import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  
  const getStatusColor = (s: string) => {
    const normalized = s.toUpperCase();
    if (['ACTIVE', 'COMPLETED', 'PASS', 'APPROVED'].includes(normalized)) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.1),_0_0_10px_rgba(16,185,129,0.1)]';
    if (['INACTIVE', 'REJECTED', 'CANCELLED', 'SCRAP'].includes(normalized)) return 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.1),_0_0_10px_rgba(239,68,68,0.1)]';
    if (['DRAFT', 'PENDING', 'CREATED', 'OPEN'].includes(normalized)) return 'bg-slate-500/10 text-slate-400 border border-slate-500/20 shadow-[inset_0_0_10px_rgba(148,163,184,0.1),_0_0_10px_rgba(148,163,184,0.1)]';
    if (['IN_PROGRESS', 'ENGINEERING', 'PROCUREMENT', 'PRODUCTION'].includes(normalized)) return 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.1),_0_0_10px_rgba(59,130,246,0.1)]';
    return 'bg-slate-500/10 text-slate-400 border border-slate-500/20 shadow-[inset_0_0_10px_rgba(148,163,184,0.1)]';
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-semibold uppercase tracking-wider rounded-md backdrop-blur-md ${sizes[size]} ${getStatusColor(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current shadow-[0_0_5px_currentColor]"></span>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
