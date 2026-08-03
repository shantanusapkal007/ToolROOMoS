"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Check, 
  X, 
  Save, 
  Zap, 
  Users, 
  Search, 
  CheckCircle2, 
  Sparkles,
  Lock,
  Layers
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
    <div className="h-full flex flex-col relative">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between p-6 border-b border-black/10 shrink-0 bg-black/5">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mr-4 border border-indigo-200 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Role-Based Access Control (RBAC)</h2>
              <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 text-[10px] font-bold rounded-full">
                Next-Gen Security Matrix
              </span>
            </div>
            <p className="text-sm text-zinc-500">Manage granular permissions across 6 security vectors per operational module.</p>
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
                  leftIcon={<Save className="w-4 h-4" />} 
                  onClick={handleSave}
                  isLoading={updatePermissionsMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] border border-emerald-500/40 shadow-[0_1px_3px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.2)]"
                >
                  Save Permissions Matrix
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Role Selector Sidebar */}
        <div className="w-72 border-r border-black/10 bg-black/[0.02] overflow-y-auto p-4 space-y-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-2 mb-1">System Roles ({roles.length})</p>

          {isLoading ? (
            <div className="text-center p-4 text-zinc-500 animate-pulse text-xs">Loading roles...</div>
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
                  className={`w-full text-left p-3.5 rounded-2xl transition-all flex flex-col gap-1 border ${
                    isSelected 
                      ? 'bg-white shadow-elevation text-indigo-600 border-indigo-500/30' 
                      : 'text-zinc-700 hover:bg-black/5 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-900">{r.name}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      r.isSystemAdmin ? 'bg-amber-500/10 text-amber-700' : 'bg-zinc-200/60 text-zinc-600'
                    }`}>
                      {r.userCount} Users
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1">{r.description}</p>
                </button>
              );
            })
          )}
          
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Admin Security Rule</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              ADMIN role implicitly holds unrestrictable global access across all modules.
            </p>
          </div>
        </div>

        {/* Matrix Area */}
        <div className="flex-1 overflow-y-auto bg-white/40 p-6 relative hide-scrollbar flex flex-col">
          
          {/* Active Role Info & Presets */}
          <div className="glass-panel p-5 rounded-2xl border border-white/70 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-zinc-900">{activeRoleSummary?.name || activeRole} Role Matrix</h3>
                <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-700 font-bold text-xs rounded-full">
                  {activeRoleSummary?.userCount || 0} Active Accounts
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{activeRoleSummary?.description}</p>
            </div>

            {/* Quick 1-Click Preset Templates */}
            {activeRole !== 'ADMIN' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">Presets:</span>
                <button
                  onClick={() => handleApplyPreset('FULL')}
                  disabled={applyPresetMutation.isPending}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" /> Full Access
                </button>
                <button
                  onClick={() => handleApplyPreset('SUPERVISOR')}
                  disabled={applyPresetMutation.isPending}
                  className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 border border-blue-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Layers className="w-3 h-3" /> Supervisor
                </button>
                <button
                  onClick={() => handleApplyPreset('READ_ONLY')}
                  disabled={applyPresetMutation.isPending}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" /> Read Only
                </button>
                <button
                  onClick={() => handleApplyPreset('CLEAR')}
                  disabled={applyPresetMutation.isPending}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="mb-4 relative flex-shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search modules..."
              value={searchModule}
              onChange={(e) => setSearchModule(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/70 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Permissions Table */}
          <div className="flex-1 overflow-y-auto border border-black/10 rounded-2xl shadow-sm bg-white">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-900/5 sticky top-0 z-10 border-b border-black/10 text-zinc-500 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Module Name</th>
                  <th className="px-4 py-4 text-center">View</th>
                  <th className="px-4 py-4 text-center">Create</th>
                  <th className="px-4 py-4 text-center">Edit</th>
                  <th className="px-4 py-4 text-center">Delete</th>
                  <th className="px-4 py-4 text-center">Approve</th>
                  <th className="px-4 py-4 text-center">Export</th>
                  <th className="px-4 py-4 text-right">Row Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-medium text-xs">
                {filteredModules.map((mod) => {
                  const perm = localPermissions.find(p => p.module === mod.id) || {} as Partial<RolePermission>;
                  const actions: (keyof RolePermission)[] = ['canView', 'canCreate', 'canEdit', 'canDelete', 'canApprove', 'canExport'];
                  const allActive = actions.every(a => perm[a] === true);

                  return (
                    <tr key={mod.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 text-sm">{mod.name}</div>
                        <div className="text-xs text-zinc-400">{mod.description}</div>
                      </td>
                      
                      {actions.map(action => (
                        <td key={action} className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleToggle(mod.id, action)}
                            disabled={activeRole === 'ADMIN'}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              activeRole === 'ADMIN' || perm[action] ? 'bg-indigo-600' : 'bg-zinc-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                                activeRole === 'ADMIN' || perm[action] ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                      ))}

                      <td className="px-4 py-4 text-right">
                        {activeRole !== 'ADMIN' && (
                          <button
                            onClick={() => handleRowToggle(mod.id, !allActive)}
                            className="text-xs text-indigo-600 font-bold hover:underline"
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
          <>
            <button
              onClick={() => {
                setShowConfirmDiscard(false);
                setPendingRole(null);
              }}
              className="px-4 py-2 text-xs font-bold bg-black/5 hover:bg-black/10 text-zinc-900 border border-black/10 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowConfirmDiscard(false);
                if (pendingRole) {
                  setActiveRole(pendingRole);
                  setPendingRole(null);
                }
              }}
              className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.2)] border border-red-500/30 transition-all cursor-pointer"
            >
              Discard Changes
            </button>
          </>
        }
      >
        <p className="text-zinc-600 text-xs leading-relaxed">
          Switching roles will discard your unsaved permission assignments. Are you sure you want to proceed? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
