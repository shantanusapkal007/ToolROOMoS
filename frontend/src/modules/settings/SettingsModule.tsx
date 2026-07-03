import React, { useState } from 'react';
import { Building2, Users, ShoppingCart, Package, Factory, UserCog, Settings as SettingsIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { EntityView } from './components/EntityView';
import { customerRegistry } from './registries/customerRegistry';
import { vendorRegistry } from './registries/vendorRegistry';
import { materialRegistry } from './registries/materialRegistry';
import { machineRegistry } from './registries/machineRegistry';
import { employeeRegistry } from './registries/employeeRegistry';

// We will add more registries here as we build them
const registries = {
  customers: customerRegistry,
  vendors: vendorRegistry,
  materials: materialRegistry,
  machines: machineRegistry,
  employees: employeeRegistry,
};

export const SettingsModule: React.FC = () => {
  const [activeSection, setActiveSection] = useState('customers');

  const navigation = [
    { id: 'company', label: 'Company Profile', icon: <Building2 className="w-4 h-4 mr-3" /> },
    { id: 'users', label: 'Users & Roles', icon: <UserCog className="w-4 h-4 mr-3" /> },
    { id: 'divider-1', isDivider: true },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4 mr-3" /> },
    { id: 'vendors', label: 'Vendors', icon: <ShoppingCart className="w-4 h-4 mr-3" /> },
    { id: 'materials', label: 'Materials', icon: <Package className="w-4 h-4 mr-3" /> },
    { id: 'machines', label: 'Machines', icon: <Factory className="w-4 h-4 mr-3" /> },
    { id: 'employees', label: 'Employees', icon: <UserCog className="w-4 h-4 mr-3" /> },
    { id: 'divider-2', isDivider: true },
    { id: 'system', label: 'System Preferences', icon: <SettingsIcon className="w-4 h-4 mr-3" /> },
  ];

  return (
    <div className="flex-1 h-full flex flex-col relative z-0 pl-32 pr-12 animate-fade-in py-12">
      <PageHeader 
        title="Settings & Master Data" 
        subtitle="Centralized configuration and factory knowledge."
      />

      <div className="flex flex-1 overflow-hidden mt-4 gap-8">
        
        {/* Settings Sidebar Nav */}
        <div className="w-64 shrink-0 flex flex-col space-y-1 overflow-y-auto pr-4 hide-scrollbar">
          {navigation.map((item, idx) => {
            if (item.isDivider) return <div key={`div-${idx}`} className="h-px bg-white/10 my-4" />;
            
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto glass-panel rounded-2xl relative">
          {activeSection === 'customers' && <EntityView registry={registries.customers} />}
          {activeSection === 'vendors' && <EntityView registry={registries.vendors} />}
          {activeSection === 'materials' && <EntityView registry={registries.materials} />}
          {activeSection === 'machines' && <EntityView registry={registries.machines} />}
          {activeSection === 'employees' && <EntityView registry={registries.employees} />}
          {!['customers', 'vendors', 'materials', 'machines', 'employees'].includes(activeSection) && (
            <div className="flex items-center justify-center h-full text-slate-500">
              Module '{activeSection}' is currently under construction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
