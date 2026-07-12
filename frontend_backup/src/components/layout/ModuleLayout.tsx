'use client';

import React from 'react';
import { UniversalLayout } from '@/components/layout/UniversalLayout';
import { UniversalToolbar } from '@/components/layout/UniversalToolbar';
import { UniversalInspector } from '@/components/layout/UniversalInspector';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export interface ModuleTab {
  label: string;
  path: string;
  exact?: boolean;
}

export interface ModuleLayoutProps {
  moduleName: string;
  basePath: string;
  tabs: ModuleTab[];
  children: React.ReactNode;
}

export function ModuleLayout({ moduleName, basePath, tabs, children }: ModuleLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');

  // Check if we are on a detail page. A detail page is generally deeper than a base tab.
  // E.g. /engineering/bom/123 -> length is 4. (["", "engineering", "bom", "123"])
  const segments = pathname.split('/').filter(Boolean);
  const isDetail = segments.length > 2;

  // Find the active tab based on the pathname
  const activeTab = tabs.find(tab => 
    tab.exact ? pathname === tab.path : pathname.startsWith(tab.path) && tab.path !== basePath
  ) || tabs.find(tab => tab.path === basePath);

  // Determine back URL
  let backUrl = basePath;
  if (isDetail) {
    // If it's a detail view, back goes to the active tab list view
    const listPath = activeTab?.path || basePath;
    backUrl = projectId ? `${listPath}?project=${projectId}` : listPath;
  } else if (projectId) {
    // If it's a list view but scoped to a project, back goes to project overview
    backUrl = `/projects/${projectId.replace('PRJ-', '')}/overview`;
  } else {
    // If it's a top level module, back goes home
    backUrl = '/';
  }

  const breadcrumb = (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => router.push(backUrl)} 
        className="p-[var(--space-1-5)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--hover-600)] rounded-[var(--radius-md)] transition-all border border-[var(--border-500)] hover:border-[var(--color-brand)]/50"
        title="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center text-body font-medium text-[var(--text-secondary)] whitespace-nowrap">
        {projectId ? (
          <>
            <span className="hover:text-[var(--text-primary)] cursor-pointer" onClick={() => router.push('/projects')}>Projects</span>
            <ChevronRight className="w-3 h-3 mx-[var(--space-1-5)] text-[var(--text-tertiary)]" />
            <span className="hover:text-[var(--text-primary)] cursor-pointer" onClick={() => router.push(`/projects/${projectId.replace('PRJ-', '')}/overview`)}>{projectId}</span>
            <ChevronRight className="w-3 h-3 mx-[var(--space-1-5)] text-[var(--text-tertiary)]" />
            <span className="hover:text-[var(--text-primary)] cursor-pointer" onClick={() => router.push(`${basePath}?project=${projectId}`)}>{moduleName}</span>
          </>
        ) : (
          <span className="hover:text-[var(--text-primary)] cursor-pointer" onClick={() => router.push(basePath)}>{moduleName}</span>
        )}

        {isDetail && activeTab && (
          <>
            <ChevronRight className="w-3 h-3 mx-[var(--space-1-5)] text-[var(--text-tertiary)]" />
            <span className="text-[var(--color-brand)] font-semibold">{activeTab.label} Detail</span>
          </>
        )}
      </div>
    </div>
  );

  const getTabUrl = (path: string) => {
    return projectId ? `${path}?project=${projectId}` : path;
  };

  const documentTabs = (
    <div className="flex space-x-5 shrink-0 overflow-x-auto whitespace-nowrap hide-scrollbar">
      {tabs.map((tab) => {
        const isActive = tab.exact 
          ? pathname === tab.path 
          : pathname.startsWith(tab.path) && (tab.path !== basePath || pathname === basePath);
          
        return (
          <Link 
            key={tab.path}
            href={getTabUrl(tab.path)} 
            className={`pb-[var(--space-3)] text-body font-semibold tracking-wide transition-all ${isActive ? "text-[var(--color-brand)] border-b border-[var(--color-brand)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <UniversalLayout
      toolbar={<UniversalToolbar />}
      documentTabs={documentTabs}
      breadcrumb={breadcrumb}
      sidePanel={isDetail ? <UniversalInspector /> : undefined}
    >
      {children}
    </UniversalLayout>
  );
}
