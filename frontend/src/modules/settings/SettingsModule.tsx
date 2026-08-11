"use client";

import React, { useState } from 'react';
import { Building2, UserCog, Settings as SettingsIcon, Layout, Shield, Hash, Sparkles } from 'lucide-react';
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
    { id: 'roles', label: 'Role Permissions (RBAC)', icon: Shield, show: isAdmin },
    { id: 'sequences', label: 'Document Numbering', icon: Hash, show: isAdmin },
    { id: 'lookups', label: 'Master Options & Sources', icon: Sparkles, show: isAdmin },
    { id: 'users', label: 'User Governance', icon: UserCog, show: isAdmin },
    { id: 'company', label: 'Company Profile', icon: Building2, show: isAdmin },
    { id: 'system', label: 'System Preferences', icon: SettingsIcon, show: isAdmin },
    { id: 'form_builder', label: 'Dynamic Forms', icon: Layout, show: isAdmin },
  ].filter(item => item.show);

  if (!isAdmin) {
    return (
      <div className="flex-1 h-full flex flex-col justify-center items-center p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-primary-subtle text-primary flex items-center justify-center mb-4">
          <SettingsIcon className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-base text-ink">Administrator Access Required</h3>
        <p className="text-caption text-silver-blue mt-1 max-w-sm">System settings and security policies are restricted to Admin accounts.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 space-y-5">
      <PageHeader 
        title="System Governance & Settings" 
        description="Configure Role-Based Access Control (RBAC), document numbering, user access, master options, and workspace preferences."
        icon={<SettingsIcon />}
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden gap-6">
        
        {/* Sub-Navigation Sidebar */}
        <div className="w-60 shrink-0 flex flex-col space-y-1 overflow-y-auto bg-white border border-border-gray rounded-[12px] p-2 shadow-subtle hide-scrollbar">
          <span className="text-micro font-semibold uppercase tracking-wider text-silver-blue px-2.5 py-1 mb-1 block">
            Governance Modules
          </span>
          {navigation.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center w-full px-3 py-2.5 rounded-[10px] text-caption font-medium transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-white shadow-subtle' 
                    : 'text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)]'
                }`}
              >
                <Icon className={`w-4 h-4 mr-2.5 shrink-0 ${isActive ? 'text-white' : 'text-silver-blue'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
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
