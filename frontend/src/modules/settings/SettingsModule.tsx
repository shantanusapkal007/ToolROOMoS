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
import { motion } from 'framer-motion';

export const SettingsModule: React.FC = () => {
  const [activeSection, setActiveSection] = useState('roles');
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  const navigation = [
    { id: 'roles', label: 'Role Permissions (RBAC)', icon: <Shield className="w-4 h-4 mr-3" />, show: isAdmin },
    { id: 'sequences', label: 'Document Numbering', icon: <Hash className="w-4 h-4 mr-3" />, show: isAdmin },
    { id: 'lookups', label: 'Master Options & Sources', icon: <Sparkles className="w-4 h-4 mr-3" />, show: isAdmin },
    { id: 'users', label: 'User Governance', icon: <UserCog className="w-4 h-4 mr-3" />, show: isAdmin },
    { id: 'company', label: 'Company Profile', icon: <Building2 className="w-4 h-4 mr-3" />, show: isAdmin },
    { id: 'system', label: 'System Preferences', icon: <SettingsIcon className="w-4 h-4 mr-3" />, show: isAdmin },
    { id: 'form_builder', label: 'Dynamic Forms', icon: <Layout className="w-4 h-4 mr-3" />, show: isAdmin },
  ].filter(item => item.show);

  if (!isAdmin) {
    return (
      <div className="flex-1 h-full flex flex-col justify-center items-center relative z-0 text-zinc-500">
        <SettingsIcon className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-semibold text-zinc-700">Administrator Access Required</p>
        <p className="text-sm text-zinc-500 mt-1">System settings and RBAC matrix are restricted to Admin roles.</p>
      </div>
    );
  }

  return (
    <main className="flex-1 h-full flex flex-col relative pl-16 overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto h-full flex flex-col px-6 py-6 min-h-0 overflow-y-auto space-y-4">
        
        <PageHeader 
          title="System Governance & Settings" 
          description="Configure Role-Based Access Control (RBAC), document numbering, user access, master options, and workspace preferences."
          icon={<SettingsIcon />}
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]}
        />

        <div className="flex flex-1 min-h-0 overflow-hidden gap-4">
          
          {/* Clean Sub-Navigation Sidebar */}
          <div className="w-56 shrink-0 flex flex-col space-y-1 overflow-y-auto bg-white border border-zinc-200 rounded-lg p-2 shadow-xs">
            <span className="text-micro font-bold uppercase tracking-wider text-zinc-400 px-2 py-1 mb-1 block">
              Governance Modules
            </span>
            {navigation.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center w-full px-2.5 py-2 rounded-md text-caption font-semibold transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-zinc-900 text-white shadow-xs font-bold' 
                      : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white border border-zinc-200 rounded-lg p-4 overflow-y-auto shadow-xs min-h-0">
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
    </main>
  );
};

