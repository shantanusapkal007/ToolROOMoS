"use client";

import React, { useState } from 'react';
import { Building2, UserCog, Settings as SettingsIcon, Layout, Shield, Hash, Sliders, Lock } from 'lucide-react';
import { useAuth } from '../../components/auth/AuthProvider';
import { PageHeader } from '../../components/layout/PageHeader';
import { CompanyProfile } from './components/CompanyProfile';
import { UserManagement } from './components/UserManagement';
import { SystemPreferences } from './components/SystemPreferences';
import { FormBuilder } from './components/FormBuilder';
import { RolePermissions } from './components/RolePermissions';
import { DocumentSequences } from './components/DocumentSequences';
import { MasterLookupSettings } from './components/MasterLookupSettings';

export const SettingsModule: React.FC = () => {
  const [activeSection, setActiveSection] = useState('roles');
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  const navigation = [
    { id: 'roles', label: 'Role Permissions (RBAC)', icon: Shield, desc: 'Granular module access', show: isAdmin },
    { id: 'sequences', label: 'Document Numbering', icon: Hash, desc: 'Prefix & serial formats', show: isAdmin },
    { id: 'lookups', label: 'Master Options & Sources', icon: Sliders, desc: 'Dynamic dropdown values', show: isAdmin },
    { id: 'users', label: 'User Governance', icon: UserCog, desc: 'Staff accounts & roles', show: isAdmin },
    { id: 'company', label: 'Company Profile', icon: Building2, desc: 'Organization & tax details', show: isAdmin },
    { id: 'system', label: 'System Preferences', icon: SettingsIcon, desc: 'Global OS configuration', show: isAdmin },
    { id: 'form_builder', label: 'Dynamic Forms', icon: Layout, desc: 'Custom metadata schemas', show: isAdmin },
  ].filter(item => item.show);

  if (!isAdmin) {
    return (
      <div className="flex-1 h-full flex flex-col justify-center items-center p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20 shadow-subtle">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-ink">Administrator Access Required</h3>
        <p className="text-caption text-cool-gray mt-1 max-w-sm">
          System governance, security policies, and master lookups are restricted to Administrator accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 space-y-4">
      <PageHeader 
        title="System Governance & Settings" 
        description="Configure Role-Based Access Control (RBAC), document numbering, user access, master options, and workspace preferences."
        icon={<SettingsIcon />}
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden gap-5">
        {/* Sub-Navigation Sidebar */}
        <div className="w-64 shrink-0 flex flex-col bg-white border border-border-gray rounded-[12px] p-3 shadow-subtle overflow-y-auto custom-scrollbar">
          <div className="px-2.5 py-1.5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cool-gray">
              Governance Modules
            </span>
          </div>

          <div className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-start w-full px-3 py-2.5 rounded-[10px] text-left transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-primary text-white shadow-subtle font-semibold' 
                      : 'text-ink hover:bg-slate-100/80 hover:text-primary'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2.5 mt-0.5 shrink-0 ${isActive ? 'text-white' : 'text-primary'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold leading-tight truncate">{item.label}</div>
                    <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-white/80' : 'text-cool-gray'}`}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white border border-border-gray rounded-[12px] overflow-hidden shadow-subtle min-h-0 flex flex-col">
          {activeSection === 'roles' && <RolePermissions />}
          {activeSection === 'sequences' && <DocumentSequences />}
          {activeSection === 'lookups' && <MasterLookupSettings />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'company' && <CompanyProfile />}
          {activeSection === 'system' && <SystemPreferences />}
          {activeSection === 'form_builder' && <FormBuilder />}
        </div>
      </div>
    </div>
  );
};
