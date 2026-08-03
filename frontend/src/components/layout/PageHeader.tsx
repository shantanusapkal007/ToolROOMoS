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

export function PageHeader({ title, description, breadcrumbs, icon, actions }: PageHeaderProps) {
  const { unreadCount, toggleCenter } = useNotifications();

  return (
    <div className="h-[var(--size-header)] flex items-center justify-between w-full border-b border-zinc-200 bg-white px-6 shrink-0 mb-6 rounded-lg shadow-xs">
      <div className="flex flex-col justify-center gap-0.5">
        
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center text-micro text-zinc-400 font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 mx-1 text-zinc-400 shrink-0" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-zinc-900 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-zinc-600 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title & Subtitle */}
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-5 h-5 flex items-center justify-center text-zinc-700">
              {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'w-4 h-4' })}
            </div>
          )}
          <h1 className="text-section-title font-bold text-zinc-900 tracking-tight leading-none">
            {title}
          </h1>
          {description && (
            <span className="text-caption text-zinc-500 font-normal border-l border-zinc-200 pl-2.5 ml-1 hidden sm:inline">
              {description}
            </span>
          )}
        </div>
      </div>

      {/* Global Actions & Utilities */}
      <div className="flex items-center gap-2">
        {actions}
        
        <div className="flex items-center gap-1 pl-2 border-l border-zinc-200 ml-1">
          <button 
            className="h-[var(--size-button-secondary)] px-2.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 flex items-center gap-1.5 transition-colors cursor-pointer text-caption font-medium border border-zinc-200" 
            title="Command Palette (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-micro bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 font-mono">⌘K</span>
          </button>
          
          <button 
            onClick={toggleCenter}
            className="relative h-[var(--size-button-secondary)] w-8 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer border border-zinc-200"
            title="Notification Center"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-1 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
