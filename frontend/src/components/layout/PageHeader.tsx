import React from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Bell } from 'lucide-react';
import { UniversalToolbar } from './UniversalToolbar';

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

export function PageHeader({ title, description, breadcrumbs, icon, colorHint = 'indigo-500', actions }: PageHeaderProps) {
  return (
    <div className="relative z-20 flex flex-col sm:flex-row sm:items-end justify-between w-full mb-6 shrink-0 gap-4">
      <div className="flex flex-col gap-2">
        
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center text-[10px] font-bold text-slate-500 mb-1 tracking-widest uppercase">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 mx-1.5 text-slate-600 shrink-0" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-zinc-900 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-zinc-600">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title Area */}
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`w-10 h-10 rounded-xl bg-black/5 text-${colorHint} border border-black/10 flex items-center justify-center shadow-inner`}>
              {React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: 'w-5 h-5' })}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-zinc-900">
              {title}
            </h1>
            {description && (
              <h2 className="text-sm text-zinc-500 font-medium tracking-wide mt-0.5">
                {description}
              </h2>
            )}
          </div>
        </div>
      </div>

      {/* Global Actions / Toolbar Area */}
      <div className="flex items-center gap-4 bg-black/5 p-1.5 rounded-xl border border-black/10 backdrop-blur-md shadow-lg">
        {actions}
        
        {/* Global Utilities (Search hint, Notifications) */}
        <div className="flex items-center gap-2 pl-2 border-l border-black/10 ml-2">
          <button className="w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-black/10 flex items-center justify-center transition-all" title="Search (Cmd+K)">
            <Search className="w-4 h-4" />
          </button>
          <button className="relative w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-black/10 flex items-center justify-center transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-elevation" />
          </button>
        </div>
      </div>
    </div>
  );
}
