"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Save, 
  Search, 
  Lock, 
  Layers, 
  Wrench, 
  Package, 
  CheckCircle2, 
  ShoppingCart, 
  CreditCard, 
  Briefcase, 
  Cpu, 
  Check, 
  Minus,
  Sparkles
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAllPermissions, useModules, useUpdatePermissions, useRolesSummary, useApplyPreset } from '../../../hooks/useRbac';
import { RolePermission } from '../../../services/rbac.service';
import { Modal } from '../../../components/ui/Modal';

const ROLE_ICONS: Record<string, any> = {
  ADMIN: Shield,
  PRODUCTION: Wrench,
  STORES: Package,
  ENGINEERING: Layers,
  QUALITY: CheckCircle2,
  PURCHASE: ShoppingCart,
  FINANCE: CreditCard,
  SALES: Briefcase,
  SALES_ENGINEER: Cpu,
};

const ACTIONS: { key: keyof RolePermission; label: string; desc: string }[] = [
  { key: 'canView', label: 'View', desc: 'Read access' },
  { key: 'canCreate', label: 'Create', desc: 'Add new records' },
  { key: 'canEdit', label: 'Edit', desc: 'Modify entries' },
  { key: 'canDelete', label: 'Delete', desc: 'Archive or purge' },
  { key: 'canApprove', label: 'Approve', desc: 'Authorize workflows' },
  { key: 'canExport', label: 'Export', desc: 'Download reports' },
];

export const RolePermissions: React.FC = () => {
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

  const handleRoleSelect = (roleName: string) => {
    if (roleName === activeRole) return;
    if (hasChanges) {
      setPendingRole(roleName);
      setShowConfirmDiscard(true);
    } else {
      setActiveRole(roleName);
    }
  };

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

  const handleColumnToggle = (action: keyof RolePermission) => {
    if (activeRole === 'ADMIN') return;
    const allCurrentlyEnabled = filteredModules.every(mod => {
      const perm = localPermissions.find(p => p.module === mod.id);
      return perm && perm[action] === true;
    });

    const targetValue = !allCurrentlyEnabled;

    setLocalPermissions(prev => {
      return prev.map(p => {
        const isModuleInFiltered = filteredModules.some(m => m.id === p.module);
        if (isModuleInFiltered) {
          return { ...p, [action]: targetValue };
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
        permissions: localPermissions.map(p => ({
          module: p.module!,
          canView: !!p.canView,
          canCreate: !!p.canCreate,
          canEdit: !!p.canEdit,
          canDelete: !!p.canDelete,
          canApprove: !!p.canApprove,
          canExport: !!p.canExport
        }))
      });
      setHasChanges(false);
    } catch (err) {}
  };

  const handleDiscard = () => {
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
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchModule.toLowerCase()) || 
    m.description.toLowerCase().includes(searchModule.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col min-h-0 bg-white">
      {/* 1. Sleek Horizontal Role Selector Strip */}
      <div className="p-4 border-b border-border-gray bg-white shrink-0">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Role-Based Access Control</h2>
            <p className="text-[11px] text-cool-gray">
              Configure read, create, edit, delete, approval, and export permissions per system role.
            </p>
          </div>

          {activeRole === 'ADMIN' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-full shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Admin role holds unrestrictable global access
            </span>
          )}
        </div>

        {/* Horizontal Role Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {isLoading ? (
            <div className="text-xs text-cool-gray py-2">Loading roles...</div>
          ) : (
            roles.map(r => {
              const isSelected = activeRole === r.role;
              const Icon = ROLE_ICONS[r.role] || Shield;
              return (
                <button
                  key={r.role}
                  onClick={() => handleRoleSelect(r.role)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white shadow-subtle'
                      : 'bg-canvas hover:bg-slate-100 text-cool-gray hover:text-ink border border-border-gray/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-primary'}`} />
                  <span>{r.name}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-cool-gray'
                  }`}>
                    {r.userCount}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Unified Clean Filter & Presets Toolbar */}
      <div className="px-5 py-3 border-b border-border-gray/80 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-cool-gray absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter modules..."
            value={searchModule}
            onChange={(e) => setSearchModule(e.target.value)}
            className="w-full h-8 pl-8 pr-3 bg-white border border-border-gray rounded-[6px] text-xs text-ink placeholder:text-cool-gray focus:outline-none focus:border-primary"
          />
        </div>

        {/* Quick Presets & Save Actions */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {activeRole !== 'ADMIN' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-cool-gray mr-1">Presets:</span>
              <button
                onClick={() => handleApplyPreset('FULL')}
                disabled={applyPresetMutation.isPending}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-border-gray rounded-[6px] text-xs font-semibold transition-colors cursor-pointer shadow-subtle"
              >
                Full Access
              </button>
              <button
                onClick={() => handleApplyPreset('SUPERVISOR')}
                disabled={applyPresetMutation.isPending}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-primary border border-border-gray rounded-[6px] text-xs font-semibold transition-colors cursor-pointer shadow-subtle"
              >
                Supervisor
              </button>
              <button
                onClick={() => handleApplyPreset('READ_ONLY')}
                disabled={applyPresetMutation.isPending}
                className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-800 border border-border-gray rounded-[6px] text-xs font-semibold transition-colors cursor-pointer shadow-subtle"
              >
                Read Only
              </button>
              <button
                onClick={() => handleApplyPreset('CLEAR')}
                disabled={applyPresetMutation.isPending}
                className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-border-gray rounded-[6px] text-xs font-semibold transition-colors cursor-pointer shadow-subtle"
              >
                Clear
              </button>
            </div>
          )}

          {hasChanges && (
            <div className="flex items-center gap-1.5 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="h-8 text-xs text-cool-gray hover:text-ink"
              >
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={updatePermissionsMutation.isPending}
                className="h-8 px-3 text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Save Matrix
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Spacious, Modern Interactive Permission Tiles Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-white">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-border-gray text-cool-gray font-bold text-[11px] uppercase tracking-wider select-none">
            <tr>
              <th className="px-6 py-3 min-w-[240px]">Module</th>
              {ACTIONS.map(action => (
                <th key={action.key} className="px-3 py-3 text-center w-20">
                  <button
                    type="button"
                    onClick={() => handleColumnToggle(action.key)}
                    disabled={activeRole === 'ADMIN'}
                    className={`inline-flex items-center gap-1 font-bold text-[11px] uppercase transition-colors ${
                      activeRole === 'ADMIN' ? 'cursor-default text-cool-gray' : 'hover:text-primary cursor-pointer'
                    }`}
                    title={`Click to toggle ${action.label} for all modules`}
                  >
                    <span>{action.label}</span>
                  </button>
                </th>
              ))}
              <th className="px-6 py-3 text-right w-28">Quick Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-gray/50">
            {filteredModules.map((mod) => {
              const perm = localPermissions.find(p => p.module === mod.id) || {} as Partial<RolePermission>;
              const allActive = ACTIONS.every(a => perm[a.key] === true);

              return (
                <tr key={mod.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-xs text-ink">{mod.name}</div>
                    <div className="text-[11px] text-cool-gray mt-0.5">{mod.description}</div>
                  </td>
                  
                  {ACTIONS.map(action => {
                    const isGranted = activeRole === 'ADMIN' || perm[action.key] === true;

                    return (
                      <td key={action.key} className="px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(mod.id, action.key)}
                          disabled={activeRole === 'ADMIN'}
                          className={`w-7 h-7 mx-auto rounded-[6px] flex items-center justify-center transition-all cursor-pointer ${
                            isGranted
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-subtle ring-1 ring-emerald-600/30'
                              : 'bg-canvas hover:bg-white text-slate-400 hover:text-ink border border-border-gray hover:border-slate-400'
                          } ${activeRole === 'ADMIN' ? 'opacity-85 cursor-not-allowed' : 'active:scale-95'}`}
                          title={`${isGranted ? 'Revoke' : 'Grant'} ${action.label} on ${mod.name}`}
                        >
                          {isGranted ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <Minus className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>
                    );
                  })}

                  <td className="px-6 py-3.5 text-right">
                    {activeRole !== 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => handleRowToggle(mod.id, !allActive)}
                        className={`text-xs font-semibold transition-colors cursor-pointer ${
                          allActive
                            ? 'text-cool-gray hover:text-rose-600'
                            : 'text-primary hover:text-primary-hover'
                        }`}
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

      <Modal
        isOpen={showConfirmDiscard}
        onClose={() => setShowConfirmDiscard(false)}
        title="Unsaved Changes"
      >
        <div className="space-y-4">
          <p className="text-xs text-cool-gray leading-relaxed">
            You have unsaved permission modifications on the current role. Discard changes and switch roles?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowConfirmDiscard(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (pendingRole) setActiveRole(pendingRole);
                setShowConfirmDiscard(false);
                setHasChanges(false);
              }}
            >
              Discard Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
