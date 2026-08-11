import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * EmptyState Component matching ToolRoomOS Design System:
 * - 8pt spacing rhythm, named heading typography, circular icon surface, and single primary CTA.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <PackageOpen className="h-6 w-6 text-cool-gray" />,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center w-full max-w-md mx-auto ${className}`}
    >
      {/* Circular Icon Container */}
      <div className="h-14 w-14 rounded-full bg-white border border-border-gray flex items-center justify-center mb-4 text-cool-gray shadow-subtle">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: 'h-6 w-6 text-cool-gray',
        })}
      </div>

      {/* Typography Section */}
      <div className="mb-6 space-y-1">
        <h3 className="text-display-xs font-semibold text-ink tracking-tight">
          {title}
        </h3>
        <p className="text-body-sm text-silver-blue max-w-xs mx-auto">
          {description}
        </p>
      </div>

      {/* Primary Action Button */}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
