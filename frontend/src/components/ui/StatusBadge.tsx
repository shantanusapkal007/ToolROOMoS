import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'neutral'
  | 'purple'
  | 'info'
  | 'warning'
  | 'danger'
  | 'pending'
  | 'active'
  | 'completed'
  | 'cancelled';

interface StatusBadgeProps {
  status?: string;
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * StatusBadge component matching Design_System.md (Kraken theme):
 * - Success: rgba(20,158,97,0.16) bg, #026b3f text, 6px radius
 * - Neutral: rgba(104,107,130,0.12) bg, #484b5e text, 8px radius
 * - Purple / Info: rgba(133,91,251,0.16) bg, #7132f5 text, 8px radius
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  children,
  className = '',
  size = 'md',
}) => {
  const normalized = (variant || status || 'neutral').toLowerCase().replace(/\s+/g, '_');

  let variantClass = 'bg-[rgba(104,107,130,0.12)] text-[#484b5e] rounded-[8px]'; // default neutral

  if (
    normalized === 'success' ||
    normalized === 'completed' ||
    normalized === 'active' ||
    normalized === 'in_stock' ||
    normalized === 'paid' ||
    normalized === 'running'
  ) {
    variantClass = 'bg-[rgba(20,158,97,0.16)] text-[#026b3f] rounded-[6px]';
  } else if (
    normalized === 'purple' ||
    normalized === 'info' ||
    normalized === 'production' ||
    normalized === 'engineering'
  ) {
    variantClass = 'bg-[rgba(133,91,251,0.16)] text-[#7132f5] rounded-[8px]';
  } else if (
    normalized === 'warning' ||
    normalized === 'pending' ||
    normalized === 'maintenance' ||
    normalized === 'low_stock'
  ) {
    variantClass = 'bg-amber-50 text-amber-800 border border-amber-200 rounded-[8px]';
  } else if (
    normalized === 'danger' ||
    normalized === 'cancelled' ||
    normalized === 'breakdown' ||
    normalized === 'overdue' ||
    normalized === 'out_of_stock'
  ) {
    variantClass = 'bg-red-50 text-red-700 border border-red-200 rounded-[8px]';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium select-none ${variantClass} ${sizeClass} ${className}`}>
      {children || status}
    </span>
  );
};
