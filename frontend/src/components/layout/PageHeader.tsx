import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  icon?: React.ReactNode;
  colorHint?: string;
  actions?: React.ReactNode;
}

/**
 * PageHeader Component matching ToolRoomOS Design System:
 * - bg white, border border-gray (#dedee5), rounded 12px, shadow subtle, typography.heading.xl title
 */
export function PageHeader({ title, description, breadcrumbs, icon, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full border border-border-gray bg-white px-6 py-4 shrink-0 rounded-[12px] shadow-subtle">
      <div className="flex flex-col justify-center gap-1">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center text-caption text-silver-blue font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1 text-silver-blue/60 shrink-0" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-ink transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-ink font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title & Subtitle — Tokenized heading.xl */}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-5 h-5 flex items-center justify-center text-primary">
              {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                className: 'w-5 h-5',
              })}
            </div>
          )}
          <h1 className="text-heading-xl font-bold text-ink tracking-tight leading-none">
            {title}
          </h1>
          {description && (
            <span className="text-body-sm text-silver-blue font-normal border-l border-border-gray pl-3 ml-1 hidden sm:inline">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Module-Specific Actions */}
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
