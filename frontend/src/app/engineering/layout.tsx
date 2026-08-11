"use client";

import React from 'react';
import { Layers, GitMerge, FileText, Cpu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";

const navigation = [
  { id: 'bom', label: 'Bill of Materials', desc: 'Material requirements', icon: <Layers /> },
  { id: 'routing', label: 'Routings', desc: 'Manufacturing sequences', icon: <GitMerge /> },
  { id: 'drawings', label: 'Drawings', desc: 'CAD / CAM blueprints', icon: <FileText /> },
];

export default function EngineeringLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppLayout>
      <div className="w-full h-full flex flex-col min-h-0 space-y-4">
        <PageHeader 
          title="Engineering" 
          description="Manage BOMs, Routings, and Technical Data."
          icon={<Cpu />}
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Engineering' }]}
        />

        <div className="flex flex-1 min-h-0 overflow-hidden gap-4">
          {/* Sub Navigation Sidebar */}
          <div className="w-60 shrink-0 flex flex-col space-y-1 overflow-y-auto pr-1 hide-scrollbar bg-white border border-border-gray rounded-[12px] p-2 shadow-subtle">
            <span className="text-micro font-semibold text-silver-blue uppercase tracking-wider px-2.5 py-1 mb-1 block">
              Engineering Modules
            </span>
            
            {navigation.map((item) => {
              const href = `/engineering/${item.id}`;
              const isActive = pathname.startsWith(href);
              
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`flex items-center w-full px-3 py-2.5 rounded-[10px] transition-colors ${
                    isActive 
                      ? 'bg-primary text-white font-medium shadow-subtle' 
                      : 'text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)]'
                  }`}
                >
                  <div className="flex-shrink-0 w-4 h-4 mr-3 flex items-center justify-center">
                    {React.cloneElement(item.icon as React.ReactElement<{className?: string}>, { 
                      className: isActive ? 'w-4 h-4 text-white' : 'w-4 h-4 text-silver-blue' 
                    })}
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <span className="text-caption font-medium leading-tight truncate">{item.label}</span>
                    <span className={`text-small truncate ${isActive ? 'text-white/80' : 'text-silver-blue'}`}>
                      {item.desc}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Page Content */}
          <div className="flex-1 bg-white border border-border-gray rounded-[12px] flex flex-col min-h-0 shadow-subtle overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
