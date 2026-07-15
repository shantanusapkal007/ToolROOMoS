import React, { useState } from 'react';
import { Building2, UserCog, Settings as SettingsIcon, Layout } from 'lucide-react';
import { useAuth } from '../../components/auth/AuthProvider';
import { PageHeader } from '../../components/ui/PageHeader';
import { CompanyProfile } from './components/CompanyProfile';
import { UserManagement } from './components/UserManagement';
import { SystemPreferences } from './components/SystemPreferences';
import { FormBuilder } from './components/FormBuilder';

export const SettingsModule: React.FC = () => {
  const [activeSection, setActiveSection] = useState('company');
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  const navigation = [
    { id: 'company', label: 'Company Profile', icon: <Building2 className="w-4 h-4 mr-3" />, show: isAdmin },
    { id: 'users', label: 'Users & Roles', icon: <UserCog className="w-4 h-4 mr-3" />, show: isAdmin },
    { id: 'form_builder', label: 'Form Builder', icon: <Layout className="w-4 h-4 mr-3" />, show: isAdmin },
    { id: 'system', label: 'System Preferences', icon: <SettingsIcon className="w-4 h-4 mr-3" />, show: isAdmin },
  ].filter(item => item.show);

  if (!isAdmin) {
    return (
      <div className="flex-1 h-full flex flex-col justify-center items-center relative z-0 animate-fade-in text-zinc-500">
        <SettingsIcon className="w-16 h-16 mb-4 opacity-20" />
        <p>You do not have permission to view System Settings.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col relative z-0 pl-[5.5rem] pr-8 animate-fade-in py-8">
      <PageHeader 
        title="System Settings" 
        subtitle="Manage company profile, users, forms, and preferences."
      />

      <div className="flex flex-1 overflow-hidden mt-4 gap-8">
        
        {/* Settings Sidebar Nav */}
        <div className="w-64 shrink-0 flex flex-col space-y-1 overflow-y-auto pr-4 hide-scrollbar">
          {navigation.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-elevation' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'
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
          {activeSection === 'company' && <CompanyProfile />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'system' && <SystemPreferences />}
          {activeSection === 'form_builder' && <FormBuilder />}
          
          {!['company', 'users', 'system', 'form_builder'].includes(activeSection) && (
            <div className="flex items-center justify-center h-full text-slate-500">
              Module '{activeSection}' is currently under construction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
