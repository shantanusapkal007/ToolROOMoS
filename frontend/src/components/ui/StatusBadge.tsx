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
 * StatusBadge Component matching ToolRoomOS Design System:
 * - Semantic Success: bg-semantic-success-subtle, text-semantic-success-dark, 6px radius
 * - Semantic Warning: bg-semantic-warning-subtle, text-semantic-warning-dark, 6px radius
 * - Semantic Danger: bg-semantic-danger-subtle, text-semantic-danger-dark, 6px radius
 * - Semantic Info / Purple: bg-primary-subtle, text-primary, 6px radius
 * - Neutral: bg-neutral-100/80, text-cool-gray, 6px radius
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  children,
  className = '',
  size = 'md',
}) => {
  const normalized = (variant || status || 'neutral').toLowerCase().replace(/\s+/g, '_');

  let variantClass = 'bg-neutral-100/80 text-cool-gray border border-border-gray rounded-[6px]'; // default neutral

  if (
    normalized === 'success' ||
    normalized === 'completed' ||
    normalized === 'active' ||
    normalized === 'in_stock' ||
    normalized === 'paid' ||
    normalized === 'running' ||
    normalized === 'operational'
  ) {
    variantClass = 'bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20 rounded-[6px]';
  } else if (
    normalized === 'purple' ||
    normalized === 'info' ||
    normalized === 'production' ||
    normalized === 'engineering'
  ) {
    variantClass = 'bg-primary-subtle text-primary border border-primary/20 rounded-[6px]';
  } else if (
    normalized === 'warning' ||
    normalized === 'pending' ||
    normalized === 'maintenance' ||
    normalized === 'low_stock'
  ) {
    variantClass = 'bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/20 rounded-[6px]';
  } else if (
    normalized === 'danger' ||
    normalized === 'cancelled' ||
    normalized === 'breakdown' ||
    normalized === 'overdue' ||
    normalized === 'offline' ||
    normalized === 'out_of_stock'
  ) {
    variantClass = 'bg-semantic-danger-subtle text-semantic-danger-dark border border-semantic-danger/20 rounded-[6px]';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-caption font-medium' : 'px-2.5 py-1 text-body-sm font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 select-none font-mono ${variantClass} ${sizeClass} ${className}`}>
      {children || status}
    </span>
  );
};
