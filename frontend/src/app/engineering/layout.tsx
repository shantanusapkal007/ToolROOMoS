"use client";

import React from 'react';
import { Layers, GitMerge, FileText, Cpu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";

const navigation = [
  { id: 'bom', label: 'Bill of Materials', desc: 'Material requirements', icon: <Layers /> },
  { id: 'routing', label: 'Routings', desc: 'Manufacturing sequences', icon: <GitMerge /> },
  { id: 'drawings', label: 'Drawings', desc: 'CAD / CAM blueprints', icon: <FileText /> },
];

export default function EngineeringLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans mission-control-bg">
      <Sidebar />
      <div className="flex-1 h-full flex flex-col relative z-0 pl-24 pr-6 animate-fade-in py-6 max-h-screen">
        <PageHeader 
          title="Engineering" 
          description="Manage BOMs, Routings, and Technical Data."
          icon={<Cpu />}
          colorHint="amber-500"
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Engineering' }]}
        />

        <div className="flex flex-1 min-h-0 overflow-hidden mt-2 gap-6">
          {/* Sub Navigation Sidebar */}
          <div className="w-64 shrink-0 flex flex-col space-y-2 overflow-y-auto pr-2 hide-scrollbar pb-10 relative z-10">
            <div className="absolute -left-10 top-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {navigation.map((item) => {
              const href = `/engineering/${item.id}`;
              const isActive = pathname.startsWith(href);
              
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`relative group flex items-center w-full p-3 rounded-xl transition-all duration-300 text-left overflow-hidden border ${
                    isActive 
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.2)]' 
                      : 'bg-[#050505] border-white/5 hover:border-amber-500/20 hover:bg-[#0a0a0c] spotlight-card'
                  }`}
                >
                  <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[0.98]" />

                  {isActive && (
                    <>
                      <motion.div 
                        layoutId="engActiveTab"
                        className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent pointer-events-none" 
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                      <motion.div 
                        layoutId="engActiveBar"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,1)]" 
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </>
                  )}
                  
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 relative z-10 ${
                    isActive 
                      ? 'bg-amber-500/20 text-amber-400 shadow-[inset_0_0_10px_rgba(245,158,11,0.4)]' 
                      : 'bg-[#111] text-slate-400 group-hover:bg-amber-500/10 group-hover:text-amber-300 border border-white/5 group-hover:border-amber-500/20'
                  }`}>
                    {React.cloneElement(item.icon as React.ReactElement<{className?: string}>, { className: 'w-4 h-4' })}
                  </div>
                  
                  <div className="ml-3 flex-1 relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                    <h3 className={`text-xs font-bold tracking-wide transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                      {item.label}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium group-hover:text-amber-500/70 transition-colors uppercase tracking-wider">{item.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Page Content */}
          <div className="flex-1 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl overflow-y-auto shadow-2xl relative z-10 flex flex-col min-h-0">
             {children}
          </div>
        </div>
      </div>
    </div>
  );
}
