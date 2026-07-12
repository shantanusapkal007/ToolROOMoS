import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  
  const getStatusColor = (s: string) => {
    const normalized = s.toUpperCase();
    if (['ACTIVE', 'COMPLETED', 'PASS', 'APPROVED'].includes(normalized)) return 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20';
    if (['INACTIVE', 'REJECTED', 'CANCELLED', 'SCRAP'].includes(normalized)) return 'bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20';
    if (['DRAFT', 'PENDING', 'CREATED', 'OPEN'].includes(normalized)) return 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-500)]';
    if (['IN_PROGRESS', 'ENGINEERING', 'PROCUREMENT', 'PRODUCTION'].includes(normalized)) return 'bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/20';
    return 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-500)]';
  };

  const sizes = {
    sm: 'text-micro px-[var(--space-1)] py-[var(--space-05)] rounded-[var(--radius-pill)]',
    md: 'text-caption px-[var(--space-1-5)] py-[var(--space-1)] rounded-[var(--radius-pill)]',
  };

  return (
    <span className={`inline-flex items-center font-semibold uppercase tracking-wider ${sizes[size]} ${getStatusColor(status)}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
