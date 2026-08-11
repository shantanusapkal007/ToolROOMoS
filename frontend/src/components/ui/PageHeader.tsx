import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

/**
 * PageHeader UI Primitive matching ToolRoomOS Design System:
 * - bg white, border border-gray (#dedee5), rounded 12px, shadow subtle, typography.heading.xl (28px/700)
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
}) => {
  return (
    <div className="bg-white border border-border-gray p-6 rounded-[12px] shadow-subtle mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <h1 className="text-heading-xl font-bold text-ink tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-body-sm text-silver-blue mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
