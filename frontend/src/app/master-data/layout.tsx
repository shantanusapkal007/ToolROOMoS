"use client";

import React from 'react';
import { Users, ShoppingCart, Package, Factory, UserCog, Building2, Database, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";

const navigation = [
  { id: 'customers', label: 'Customers', desc: 'Client profiles & CRM', icon: <Users /> },
  { id: 'vendors', label: 'Vendors', desc: 'Supplier configurations', icon: <ShoppingCart /> },
  { id: 'materials', label: 'Materials', desc: 'Raw material definitions', icon: <Package /> },
  { id: 'machines', label: 'Machines', desc: 'Shop floor assets', icon: <Factory /> },
  { id: 'operations', label: 'Operations', desc: 'Manufacturing processes', icon: <UserCog /> },
  { id: 'employees', label: 'Employees', desc: 'Workforce & operators', icon: <UserCog /> },
  { id: 'warehouses', label: 'Warehouses', desc: 'Primary storage hubs', icon: <Building2 /> },
  { id: 'locations', label: 'Locations', desc: 'Specific storage bins', icon: <Package /> },
  { id: 'rates', label: 'Resource Rates', desc: 'Hourly cost rate cards', icon: <Database /> },
  { id: 'inspection-standards', label: 'Inspection Standards', desc: 'Quality audit protocols', icon: <ShieldCheck /> },
];

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#F8F9FA]">
      <Sidebar />
      <main className="flex-1 h-full flex flex-col relative pl-16">
        <div className="w-full max-w-[1440px] mx-auto h-full flex flex-col px-6 py-6 min-h-0 overflow-hidden">
          
          <PageHeader 
            title="Master Data Hub" 
            description="Manage foundational entities, machines, materials, and resource rates."
            icon={<Database />}
            breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Master Data' }]}
          />

          <div className="flex flex-1 min-h-0 overflow-hidden gap-4">
            {/* Sub Navigation Sidebar */}
            <div className="w-56 shrink-0 flex flex-col space-y-1 overflow-y-auto pr-1 hide-scrollbar bg-white border border-zinc-200 rounded-lg p-2 shadow-xs">
              <span className="text-micro font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 mb-1 block">
                Master Registers
              </span>
              
              {navigation.map((item) => {
                const href = `/master-data/${item.id}`;
                const isActive = pathname.startsWith(href);
                
                return (
                  <Link
                    key={item.id}
                    href={href}
                    className={`flex items-center w-full px-2.5 py-2 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-zinc-900 text-white font-semibold shadow-xs' 
                        : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex-shrink-0 w-4 h-4 mr-2.5 flex items-center justify-center">
                      {React.cloneElement(item.icon as React.ReactElement<{className?: string}>, { 
                        className: isActive ? 'w-4 h-4 text-white' : 'w-4 h-4 text-zinc-500' 
                      })}
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-caption font-semibold leading-tight truncate">{item.label}</span>
                      <span className={`text-[10px] truncate ${isActive ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        {item.desc}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Page Content View */}
            <div className="flex-1 bg-white border border-zinc-200 rounded-lg overflow-y-auto p-4 flex flex-col min-h-0 shadow-xs">
              {children}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
