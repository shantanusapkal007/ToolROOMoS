"use client";

import React from 'react';
import { Users, ShoppingCart, Package, Factory, UserCog, Building2, Database, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";

const navigation = [
  { id: 'customers', label: 'Customers', desc: 'Client profiles & CRM', icon: <Users /> },
  { id: 'vendors', label: 'Vendors', desc: 'Supplier configurations', icon: <ShoppingCart /> },
  { id: 'materials', label: 'Materials', desc: 'Raw material definitions', icon: <Package /> },
  { id: 'machines', label: 'Machines', desc: 'Shop floor assets', icon: <Factory /> },
  { id: 'operations', label: 'Operations', desc: 'Manufacturing processes', icon: <UserCog /> },
  { id: 'employees', label: 'Employees', desc: 'Workforce & operators', icon: <UserCog /> },
  { id: 'warehouses', label: 'Plants', desc: 'Primary plants & facilities', icon: <Building2 /> },
  { id: 'locations', label: 'Locations', desc: 'Specific storage bins', icon: <Package /> },
  { id: 'rates', label: 'Resource Rates', desc: 'Hourly cost rate cards', icon: <Database /> },
  { id: 'inspection-standards', label: 'Inspection Standards', desc: 'Quality audit protocols', icon: <ShieldCheck /> },
];

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AppLayout>
      <div className="w-full h-full flex flex-col min-h-0 overflow-hidden space-y-4">
        
        <PageHeader 
          title="Master Data Hub" 
          description="Manage foundational entities, machines, materials, and resource rates."
          icon={<Database />}
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Master Data' }]}
        />

        <div className="flex flex-1 min-h-0 overflow-hidden gap-4">
          {/* Sub Navigation Sidebar */}
          <div className="w-60 shrink-0 flex flex-col space-y-1 overflow-y-auto pr-1 hide-scrollbar bg-white border border-border-gray rounded-[12px] p-2 shadow-subtle">
            <span className="text-micro font-semibold text-silver-blue uppercase tracking-wider px-2.5 py-1 mb-1 block">
              Master Registers
            </span>
            
            {navigation.map((item) => {
              const href = `/master-data/${item.id}`;
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

          {/* Page Content View */}
          <div className="flex-1 bg-white border border-border-gray rounded-[12px] flex flex-col min-h-0 shadow-subtle overflow-hidden">
            {children}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
