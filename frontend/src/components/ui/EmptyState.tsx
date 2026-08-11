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

/**
 * EmptyState Component matching Design System specs:
 * - Clean layout, display-sm/display-md typography, circular icon container, button-primary CTA
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = <PackageOpen className="h-6 w-6 text-ink" />, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full max-w-lg mx-auto">
      {/* Circular Icon Container */}
      <div className="h-14 w-14 rounded-full bg-canvas border border-border-gray flex items-center justify-center mb-6 text-ink">
        {React.cloneElement(icon as React.ReactElement<{className?: string}>, { 
          className: 'h-6 w-6 text-ink' 
        })}
      </div>

      {/* Typography Section */}
      <div className="mb-8">
        <h3 className="text-display-sm font-medium text-ink mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-body-md text-mute max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {/* Action Button */}
      {actionLabel && onAction && (
        <Button 
          variant="primary"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
