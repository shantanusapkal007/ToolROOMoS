import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  
  const getStatusColor = (s: string) => {
    const normalized = s.toUpperCase();
    if (['ACTIVE', 'COMPLETED', 'PASS', 'APPROVED'].includes(normalized)) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (['INACTIVE', 'REJECTED', 'CANCELLED', 'SCRAP'].includes(normalized)) return 'bg-red-50 text-red-700 border border-red-200';
    if (['DRAFT', 'PENDING', 'CREATED', 'OPEN'].includes(normalized)) return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    if (['IN_PROGRESS', 'ENGINEERING', 'PROCUREMENT', 'PRODUCTION'].includes(normalized)) return 'bg-blue-50 text-blue-700 border border-blue-200';
    return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-black uppercase tracking-widest rounded-full ${sizes[size]} ${getStatusColor(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current"></span>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
