"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, ShoppingCart, Package, Factory, UserCog, Building2, Database, ArrowUpRight } from 'lucide-react';

export default function MasterDataDashboard() {
  const router = useRouter();

  const cards = [
    { id: 'customers', label: 'Customers', desc: 'Manage client profiles and business terms.', icon: <Users className="w-5 h-5 text-blue-400" /> },
    { id: 'vendors', label: 'Vendors', desc: 'Supplier configurations and performance.', icon: <ShoppingCart className="w-5 h-5 text-emerald-400" /> },
    { id: 'materials', label: 'Materials', desc: 'Raw materials, consumables, and parts.', icon: <Package className="w-5 h-5 text-purple-400" /> },
    { id: 'machines', label: 'Machines', desc: 'Shop floor assets and work centers.', icon: <Factory className="w-5 h-5 text-amber-400" /> },
    { id: 'operations', label: 'Operations', desc: 'Manufacturing processes and routing.', icon: <UserCog className="w-5 h-5 text-rose-400" /> },
    { id: 'employees', label: 'Employees', desc: 'Workforce registry and skills.', icon: <UserCog className="w-5 h-5 text-cyan-400" /> },
    { id: 'warehouses', label: 'Warehouses', desc: 'Storage hubs and stock points.', icon: <Building2 className="w-5 h-5 text-indigo-400" /> },
    { id: 'locations', label: 'Locations', desc: 'Storage bins and physical mapping.', icon: <Package className="w-5 h-5 text-teal-400" /> },
    { id: 'rates', label: 'Resource Rates', desc: 'Standard cost cards for costing.', icon: <Database className="w-5 h-5 text-orange-400" /> },
    { id: 'custom-fields', label: 'Custom Fields', desc: 'Extensible registry schema.', icon: <Database className="w-5 h-5 text-zinc-400" /> },
  ];

  return (
    <div className="h-full flex flex-col p-6 overflow-auto custom-scrollbar animate-fade-in">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Master Data Workbenches</h2>
        <p className="text-sm text-zinc-400 mt-1">Select a registry to manage foundational entities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
        {cards.map((card) => (
          <div key={card.id} className="glass-panel p-5 flex flex-col justify-between relative group hover:bg-white/[0.02] transition-all border border-white/[0.04]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {card.icon}
                <h4 className="font-bold text-zinc-200">{card.label}</h4>
              </div>
              <p className="text-xs text-zinc-500 mt-2">{card.desc}</p>
            </div>
            <div className="mt-5 flex justify-end">
              <button 
                onClick={() => router.push(`/master-data/${card.id}`)}
                className="text-xs text-zinc-300 group-hover:text-emerald-400 font-bold transition-colors flex items-center gap-1"
              >
                Open Workbench <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
