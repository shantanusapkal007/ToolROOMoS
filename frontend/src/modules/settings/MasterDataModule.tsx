"use client";

import React, { useState, useEffect } from 'react';
import { Users, ShoppingCart, Package, Factory, UserCog, Building2, Database, ChevronRight } from 'lucide-react';
import { EntityView } from './components/EntityView';
import { customerRegistry } from './registries/customerRegistry';
import { vendorRegistry } from './registries/vendorRegistry';
import { materialRegistry } from './registries/materialRegistry';
import { machineRegistry } from './registries/machineRegistry';
import { employeeRegistry } from './registries/employeeRegistry';
import { warehouseRegistry } from './registries/warehouseRegistry';
import { locationRegistry } from './registries/locationRegistry';
import { operationRegistry } from './registries/operationRegistry';

const registries = {
  customers: customerRegistry,
  vendors: vendorRegistry,
  materials: materialRegistry,
  machines: machineRegistry,
  employees: employeeRegistry,
  warehouses: warehouseRegistry,
  locations: locationRegistry,
  operations: operationRegistry,
};

export const MasterDataModule: React.FC = () => {
  const [activeSection, setActiveSection] = useState('customers');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const navigation = [
    { id: 'customers', label: 'Customers', desc: 'Client profiles & CRM', icon: <Users /> },
    { id: 'vendors', label: 'Vendors', desc: 'Supplier configurations', icon: <ShoppingCart /> },
    { id: 'materials', label: 'Materials', desc: 'Raw material definitions', icon: <Package /> },
    { id: 'machines', label: 'Machines', desc: 'Shop floor assets', icon: <Factory /> },
    { id: 'operations', label: 'Operations', desc: 'Manufacturing processes', icon: <UserCog /> },
    { id: 'employees', label: 'Employees', desc: 'Workforce & operators', icon: <UserCog /> },
    { id: 'warehouses', label: 'Warehouses', desc: 'Primary storage hubs', icon: <Building2 /> },
    { id: 'locations', label: 'Locations', desc: 'Specific storage bins', icon: <Package /> },
  ];

  return (
    <div className="flex-1 h-full flex flex-col relative z-0 pl-32 pr-12 animate-fade-in py-12">
      
      {/* Massive Typographical Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full mb-6">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Factory Knowledge Base</span>
          </div>
          <h1 className="text-6xl font-bold mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 drop-shadow-lg">
            Master Data.
          </h1>
          <h2 className="text-xl text-slate-400 font-medium tracking-wide">Manage foundational entities and resources.</h2>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden mt-4 gap-8">
        
        {/* Premium Sidebar Nav */}
        <div className="w-80 shrink-0 flex flex-col space-y-4 overflow-y-auto pr-4 hide-scrollbar pb-20 relative z-10">
          <div className="absolute -left-10 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {navigation.map((item, idx) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`relative group flex items-center w-full p-4 rounded-2xl transition-all duration-500 text-left overflow-hidden border backdrop-blur-xl ${
                  isActive 
                    ? 'bg-[#050A14]/90 border-emerald-500/30 shadow-[0_8px_32px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' 
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10 hover:shadow-xl'
                }`}
                style={{ animation: `slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s forwards`, opacity: mounted ? 1 : 0 }}
              >
                {/* Active Glows */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)]" />
                  </>
                )}
                
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 relative z-10 ${
                  isActive 
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.4)]' 
                    : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-emerald-300'
                }`}>
                  {React.cloneElement(item.icon as React.ReactElement, { className: 'w-6 h-6' })}
                </div>
                
                <div className="ml-4 flex-1 relative z-10">
                  <h3 className={`font-bold tracking-wide transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {item.label}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium group-hover:text-slate-400 transition-colors">{item.desc}</p>
                </div>

                <div className={`transition-all duration-500 absolute right-4 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100'}`}>
                  <ChevronRight className={`w-5 h-5 ${isActive ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'text-slate-400'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 h-full overflow-hidden relative group rounded-3xl" style={{ animation: `slideUp 0.6s ease-out 0.2s forwards`, opacity: mounted ? 1 : 0 }}>
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 pointer-events-none"></div>
          
          <div className="relative h-full glass-panel border border-white/10 bg-[#0B1018]/60 overflow-hidden flex flex-col">
            {activeSection === 'customers' && <EntityView registry={registries.customers} />}
            {activeSection === 'vendors' && <EntityView registry={registries.vendors} />}
            {activeSection === 'materials' && <EntityView registry={registries.materials} />}
            {activeSection === 'machines' && <EntityView registry={registries.machines} />}
            {activeSection === 'employees' && <EntityView registry={registries.employees} />}
            { activeSection === 'warehouses' && <EntityView registry={registries.warehouses} /> }
            { activeSection === 'locations' && <EntityView registry={registries.locations} /> }
            { activeSection === 'operations' && <EntityView registry={registries.operations} /> }
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};
