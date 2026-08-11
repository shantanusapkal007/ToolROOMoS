"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Save, 
  Zap, 
  Search, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAllPermissions, useModules, useUpdatePermissions, useRolesSummary, useApplyPreset } from '../../../hooks/useRbac';
import { RolePermission } from '../../../services/rbac.service';
import { Modal } from '../../../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

export const RolePermissions = () => {
  const { data: permissionsData, isLoading: isPermissionsLoading } = useAllPermissions();
  const { data: modulesData, isLoading: isModulesLoading } = useModules();
  const { data: rolesSummary, isLoading: isSummaryLoading } = useRolesSummary();
  const updatePermissionsMutation = useUpdatePermissions();
  const applyPresetMutation = useApplyPreset();

  const [activeRole, setActiveRole] = useState<string>('PRODUCTION');
  const [localPermissions, setLocalPermissions] = useState<Partial<RolePermission>[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchModule, setSearchModule] = useState('');
  const [showConfirmDiscard, setShowConfirmDiscard] = useState<boolean>(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);

  // Initialize local permissions when role changes or data loads
  useEffect(() => {
    if (permissionsData?.permissions && modulesData) {
      const rolePerms = permissionsData.permissions.filter(p => p.role === activeRole);
      
      const initializedPerms = modulesData.map(mod => {
        const existing = rolePerms.find(p => p.module === mod.id);
        return existing || {
          role: activeRole,
          module: mod.id,
          canView: false,
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canApprove: false,
          canExport: false
        };
      });
      
      setLocalPermissions(initializedPerms);
      setHasChanges(false);
    }
  }, [activeRole, permissionsData, modulesData]);

  const isLoading = isPermissionsLoading || isModulesLoading || isSummaryLoading;
  const roles = rolesSummary || [];
  const modules = modulesData || [];

  const handleToggle = (moduleId: string, action: keyof RolePermission) => {
    if (activeRole === 'ADMIN') return;
    setLocalPermissions(prev => {
      return prev.map(p => {
        if (p.module === moduleId) {
          return { ...p, [action]: !p[action] };
        }
        return p;
      });
    });
    setHasChanges(true);
  };

  const handleRowToggle = (moduleId: string, enableAll: boolean) => {
    if (activeRole === 'ADMIN') return;
    setLocalPermissions(prev => {
      return prev.map(p => {
        if (p.module === moduleId) {
          return {
            ...p,
            canView: enableAll,
            canCreate: enableAll,
            canEdit: enableAll,
            canDelete: enableAll,
            canApprove: enableAll,
            canExport: enableAll,
          };
        }
        return p;
      });
    });
    setHasChanges(true);
  };

  const handleApplyPreset = async (preset: 'FULL' | 'READ_ONLY' | 'SUPERVISOR' | 'CLEAR') => {
    if (activeRole === 'ADMIN') return;
    try {
      await applyPresetMutation.mutateAsync({ role: activeRole, preset });
      setHasChanges(false);
    } catch (err) {}
  };

  const handleSave = async () => {
    if (activeRole === 'ADMIN') return;
    try {
      await updatePermissionsMutation.mutateAsync({
        role: activeRole,
        permissions: localPermissions
      });
      setHasChanges(false);
    } catch (err) {}
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchModule.toLowerCase()) || 
    m.description.toLowerCase().includes(searchModule.toLowerCase())
  );

  const activeRoleSummary = roles.find(r => r.role === activeRole);

  return (
    <div className="h-full flex flex-col relative min-h-0">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between p-5 border-b border-border-gray shrink-0 bg-white">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-primary-subtle text-primary flex items-center justify-center border border-primary/20 shadow-subtle">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-section-heading font-bold text-ink tracking-tight">Role-Based Access Control (RBAC)</h2>
              <span className="px-2 py-0.5 bg-primary-subtle text-primary text-[10px] font-semibold rounded-full border border-primary/20">
                Security Matrix
              </span>
            </div>
            <p className="text-caption text-silver-blue">Manage granular permissions across 6 security vectors per operational module.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {hasChanges && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={handleSave}
                  isLoading={updatePermissionsMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  <span>Save Permissions Matrix</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0 gap-0">
        
        {/* Role Selector Sidebar */}
        <div className="w-64 shrink-0 border-r border-border-gray bg-[#fbfbfd] overflow-y-auto p-3 space-y-1.5 hide-scrollbar">
          <span className="text-micro font-semibold uppercase tracking-wider text-silver-blue px-2 py-1 mb-1 block">
            System Roles ({roles.length})
          </span>

          {isLoading ? (
            <div className="text-center p-4 text-silver-blue animate-pulse text-caption">Loading roles...</div>
          ) : (
            roles.map(r => {
              const isSelected = activeRole === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => {
                    if (hasChanges) {
                      setPendingRole(r.role);
                      setShowConfirmDiscard(true);
                    } else {
                      setActiveRole(r.role);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-[10px] transition-all flex flex-col gap-0.5 border cursor-pointer ${
                    isSelected 
                      ? 'bg-white shadow-subtle border-primary text-ink' 
                      : 'border-transparent text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-caption text-ink">{r.name}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      r.isSystemAdmin 
                        ? 'bg-[rgba(245,158,11,0.12)] text-[#b45309]' 
                        : 'bg-primary-subtle text-primary'
                    }`}>
                      {r.userCount} Users
                    </span>
                  </div>
                  <p className="text-small text-silver-blue line-clamp-1">{r.description}</p>
                </button>
              );
            })
          )}
          
          <div className="mt-4 p-3 rounded-[10px] bg-[rgba(245,158,11,0.08)] border border-amber-200 text-[#b45309] space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-caption">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Admin Security Rule</span>
            </div>
            <p className="text-small text-amber-900/80 leading-relaxed">
              ADMIN role implicitly holds unrestrictable global access across all modules.
            </p>
          </div>
        </div>

        {/* Matrix Area */}
        <div className="flex-1 overflow-y-auto p-5 relative hide-scrollbar flex flex-col min-h-0 bg-white space-y-4">
          
          {/* Active Role Info & Presets */}
          <div className="p-4 rounded-[12px] border border-border-gray bg-[#fbfbfd] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-body font-bold text-ink">{activeRoleSummary?.name || activeRole} Role Matrix</h3>
                <span className="px-2.5 py-0.5 bg-primary-subtle text-primary font-semibold text-[11px] rounded-full border border-primary/20">
                  {activeRoleSummary?.userCount || 0} Active Accounts
                </span>
              </div>
              <p className="text-caption text-silver-blue mt-0.5">{activeRoleSummary?.description}</p>
            </div>

            {/* Quick 1-Click Preset Templates */}
            {activeRole !== 'ADMIN' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-micro font-semibold text-silver-blue uppercase tracking-wider">Presets:</span>
                <button
                  onClick={() => handleApplyPreset('FULL')}
                  disabled={applyPresetMutation.isPending}
                  className="px-2.5 py-1 bg-white hover:bg-[rgba(20,158,97,0.08)] text-[#026b3f] border border-emerald-200 rounded-[8px] text-caption font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-subtle"
                >
                  <Zap className="w-3 h-3 text-accent-green" /> Full Access
                </button>
                <button
                  onClick={() => handleApplyPreset('SUPERVISOR')}
                  disabled={applyPresetMutation.isPending}
                  className="px-2.5 py-1 bg-white hover:bg-primary-subtle text-primary border border-primary/20 rounded-[8px] text-caption font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-subtle"
                >
                  <Layers className="w-3 h-3 text-primary" /> Supervisor
                </button>
                <button
                  onClick={() => handleApplyPreset('READ_ONLY')}
                  disabled={applyPresetMutation.isPending}
                  className="px-2.5 py-1 bg-white hover:bg-[rgba(245,158,11,0.08)] text-[#b45309] border border-amber-200 rounded-[8px] text-caption font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-subtle"
                >
                  <Lock className="w-3 h-3 text-amber-500" /> Read Only
                </button>
                <button
                  onClick={() => handleApplyPreset('CLEAR')}
                  disabled={applyPresetMutation.isPending}
                  className="px-2.5 py-1 bg-white hover:bg-[rgba(239,68,68,0.08)] text-[#b91c1c] border border-rose-200 rounded-[8px] text-caption font-medium transition-colors cursor-pointer shadow-subtle"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-blue" />
            <input 
              type="text" 
              placeholder="Search modules..."
              value={searchModule}
              onChange={(e) => setSearchModule(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-border-gray rounded-[10px] text-caption text-ink placeholder:text-silver-blue focus:outline-none focus:border-primary shadow-subtle"
            />
          </div>

          {/* Permissions Table */}
          <div className="flex-1 overflow-y-auto border border-border-gray rounded-[12px] shadow-subtle bg-white min-h-0">
            <table className="w-full text-left text-caption whitespace-nowrap">
              <thead className="bg-[#fbfbfd] sticky top-0 z-10 border-b border-border-gray text-silver-blue font-semibold text-micro uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Module Name</th>
                  <th className="px-3 py-3 text-center">View</th>
                  <th className="px-3 py-3 text-center">Create</th>
                  <th className="px-3 py-3 text-center">Edit</th>
                  <th className="px-3 py-3 text-center">Delete</th>
                  <th className="px-3 py-3 text-center">Approve</th>
                  <th className="px-3 py-3 text-center">Export</th>
                  <th className="px-4 py-3 text-right">Row Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray text-caption">
                {filteredModules.map((mod) => {
                  const perm = localPermissions.find(p => p.module === mod.id) || {} as Partial<RolePermission>;
                  const actions: (keyof RolePermission)[] = ['canView', 'canCreate', 'canEdit', 'canDelete', 'canApprove', 'canExport'];
                  const allActive = actions.every(a => perm[a] === true);

                  return (
                    <tr key={mod.id} className="hover:bg-[#fbfbfd] transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-ink">{mod.name}</div>
                        <div className="text-small text-silver-blue">{mod.description}</div>
                      </td>
                      
                      {actions.map(action => (
                        <td key={action} className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleToggle(mod.id, action)}
                            disabled={activeRole === 'ADMIN'}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out ${
                              activeRole === 'ADMIN' || perm[action] ? 'bg-primary' : 'bg-[#dedee5]'
                            } ${activeRole === 'ADMIN' ? 'opacity-80 cursor-not-allowed' : ''}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-subtle transition duration-200 ease-in-out ${
                                activeRole === 'ADMIN' || perm[action] ? 'translate-x-2' : '-translate-x-2'
                              }`}
                            />
                          </button>
                        </td>
                      ))}

                      <td className="px-4 py-3 text-right">
                        {activeRole !== 'ADMIN' && (
                          <button
                            onClick={() => handleRowToggle(mod.id, !allActive)}
                            className="text-caption text-primary font-medium hover:underline cursor-pointer"
                          >
                            {allActive ? 'Disable All' : 'Enable All'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
      <Modal
        isOpen={showConfirmDiscard}
        onClose={() => {
          setShowConfirmDiscard(false);
          setPendingRole(null);
        }}
        title="Unsaved Changes"
        subtitle="You have unsaved modifications to the permissions registry."
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="white"
              size="sm"
              onClick={() => {
                setShowConfirmDiscard(false);
                setPendingRole(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setShowConfirmDiscard(false);
                if (pendingRole) {
                  setActiveRole(pendingRole);
                  setPendingRole(null);
                }
              }}
            >
              Discard Changes
            </Button>
          </div>
        }
      >
        <p className="text-cool-gray text-caption leading-relaxed">
          Switching roles will discard your unsaved permission assignments. Are you sure you want to proceed?
        </p>
      </Modal>
    </div>
  );
};
