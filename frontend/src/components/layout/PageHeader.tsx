import React from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

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
 * PageHeader Component matching Design_System.md (Kraken theme):
 * - bg white, border border-gray (#dedee5), rounded 12px, shadow subtle, IBM Plex Sans heading
 */
export function PageHeader({ title, description, breadcrumbs, icon, actions }: PageHeaderProps) {
  const { unreadCount, toggleCenter } = useNotifications();

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

        {/* Title & Subtitle */}
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-5 h-5 flex items-center justify-center text-primary">
              {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'w-5 h-5' })}
            </div>
          )}
          <h1 className="text-sub-heading font-bold text-ink tracking-tight leading-none">
            {title}
          </h1>
          {description && (
            <span className="text-body-sm text-silver-blue font-normal border-l border-border-gray pl-3 ml-1 hidden sm:inline">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Global Actions & Utilities */}
      <div className="flex items-center gap-3">
        {actions}
        
        <div className="flex items-center gap-2 pl-3 border-l border-border-gray ml-1">
          <button 
            className="h-9 px-3 rounded-[10px] text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] flex items-center gap-2 transition-colors cursor-pointer text-caption font-medium border border-border-gray shadow-subtle" 
            title="Command Palette (Cmd+K)"
          >
            <Search className="w-4 h-4 text-silver-blue" />
            <span className="text-[11px] font-mono bg-[rgba(148,151,169,0.08)] px-1.5 py-0.5 rounded-[4px] text-silver-blue">⌘K</span>
          </button>
          
          <button 
            onClick={toggleCenter}
            className="relative h-9 w-9 rounded-[10px] text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] flex items-center justify-center transition-colors cursor-pointer border border-border-gray shadow-subtle"
            title="Notification Center"
          >
            <Bell className="w-4 h-4 text-silver-blue" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-accent-red text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
