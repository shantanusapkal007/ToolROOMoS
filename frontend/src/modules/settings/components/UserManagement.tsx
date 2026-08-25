"use client";

import React, { useState } from 'react';
import { Users, Plus, Shield, Mail, Search, Key, Clock, Edit2, Lock, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useUsers, useCreateUser, useUpdateUser } from '../../../hooks/useUsers';

const AVAILABLE_ROLES = [
  { id: 'ADMIN', label: 'Admin (Full Access)', desc: 'Unrestricted system governance & security' },
  { id: 'PRODUCTION', label: 'Production Operator', desc: 'Job cards, MSDR daily reports & machine logs' },
  { id: 'STORES', label: 'Stores Officer', desc: 'GRN inward, Inventory stock & Store issuances' },
  { id: 'ENGINEERING', label: 'Engineering Specialist', desc: 'BOMs, routings, CAD drawings & revisions' },
  { id: 'QUALITY', label: 'Quality Inspector', desc: 'Inspection standards, First-piece & PDI' },
  { id: 'PURCHASE', label: 'Purchase Manager', desc: 'Purchase requests & Supplier POs' },
  { id: 'FINANCE', label: 'Finance Controller', desc: 'Invoicing, costing & customer payments' },
  { id: 'SALES', label: 'Sales Officer', desc: 'Customer POs & proposals' },
  { id: 'SALES_ENGINEER', label: 'Sales Engineer', desc: 'Quotation estimation & technical feasibility' },
];

export const UserManagement: React.FC = () => {
  const { data: result, isLoading } = useUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const users = result?.data || [];

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  // New User Form State
  const [createFormData, setCreateFormData] = useState({ 
    name: '', 
    email: '', 
    selectedRoles: ['PRODUCTION'] as string[], 
    password: '', 
    hourlyRate: 0,
  });

  // Edit User / Reset Password Form State
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    selectedRoles: ['PRODUCTION'] as string[],
    status: 'ACTIVE',
    newPassword: '',
    hourlyRate: 0,
  });

  const toggleCreateRole = (roleId: string) => {
    setCreateFormData(prev => {
      const exists = prev.selectedRoles.includes(roleId);
      let updated: string[];
      if (roleId === 'ADMIN') {
        updated = exists ? ['PRODUCTION'] : ['ADMIN'];
      } else {
        const withoutAdmin = prev.selectedRoles.filter(r => r !== 'ADMIN');
        updated = exists ? withoutAdmin.filter(r => r !== roleId) : [...withoutAdmin, roleId];
        if (updated.length === 0) updated = ['PRODUCTION'];
      }
      return { ...prev, selectedRoles: updated };
    });
  };

  const toggleEditRole = (roleId: string) => {
    setEditFormData(prev => {
      const exists = prev.selectedRoles.includes(roleId);
      let updated: string[];
      if (roleId === 'ADMIN') {
        updated = exists ? ['PRODUCTION'] : ['ADMIN'];
      } else {
        const withoutAdmin = prev.selectedRoles.filter(r => r !== 'ADMIN');
        updated = exists ? withoutAdmin.filter(r => r !== roleId) : [...withoutAdmin, roleId];
        if (updated.length === 0) updated = ['PRODUCTION'];
      }
      return { ...prev, selectedRoles: updated };
    });
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserMutation.mutateAsync({
        name: createFormData.name,
        email: createFormData.email,
        password: createFormData.password,
        role: createFormData.selectedRoles.join(', '),
        hourlyRate: Number(createFormData.hourlyRate || 0)
      });
      setShowInviteModal(false);
      setCreateFormData({ name: '', email: '', selectedRoles: ['PRODUCTION'], password: '', hourlyRate: 0 });
    } catch (err) {}
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    const existingRoles = (user.role || 'PRODUCTION').split(',').map((r: string) => r.trim());
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      selectedRoles: existingRoles,
      status: user.status || 'ACTIVE',
      newPassword: '',
      hourlyRate: Number(user.hourlyRate || 0)
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data: {
          name: editFormData.name,
          email: editFormData.email,
          role: editFormData.selectedRoles.join(', '),
          status: editFormData.status,
          ...(editFormData.newPassword ? { password: editFormData.newPassword } : {}),
          hourlyRate: Number(editFormData.hourlyRate || 0)
        }
      });
      setEditingUser(null);
    } catch (err) {}
  };

  const filteredUsers = users.filter((u: any) => {
    const q = search.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);
    const roleMatch = u.role?.toLowerCase().includes(q);
    return nameMatch || emailMatch || roleMatch;
  });

  return (
    <div className="h-full flex flex-col relative min-h-0 bg-[#fbfbfd]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border-gray shrink-0 bg-white">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-subtle shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sub-heading font-bold text-ink tracking-tight">User Login Credentials & Access Governance</h2>
            <p className="text-caption text-cool-gray mt-0.5">
              Manage user credentials, assign multi-role permission tiers, and configure hourly cost rates.
            </p>
          </div>
        </div>

        <Button 
          variant="primary" 
          size="sm"
          onClick={() => setShowInviteModal(true)}
          className="h-9 px-4 font-semibold text-xs shadow-subtle"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add User Account</span>
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="p-4 border-b border-border-gray bg-white flex items-center justify-between gap-4 shrink-0">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cool-gray" />
          <input 
            type="text" 
            placeholder="Search accounts by name, email ID, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-canvas hover:bg-white focus:bg-white border border-border-gray rounded-[8px] text-xs text-ink placeholder:text-cool-gray focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-cool-gray font-mono">
          Total Accounts: <strong className="text-ink">{filteredUsers.length}</strong>
        </div>
      </div>

      {/* User Table */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
        <div className="border border-border-gray rounded-[12px] overflow-hidden shadow-subtle bg-white">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-cool-gray uppercase font-bold text-[11px] tracking-wider border-b border-border-gray select-none">
              <tr>
                <th className="px-5 py-3.5">User & Login ID</th>
                <th className="px-5 py-3.5">Assigned System Roles</th>
                <th className="px-5 py-3.5">Hourly Cost Rate</th>
                <th className="px-5 py-3.5">Last Login</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray/70">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-cool-gray animate-pulse">Loading user accounts...</td>
                </tr>
              )}
              {filteredUsers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-cool-gray">No matching user accounts found.</td>
                </tr>
              )}
              {filteredUsers.map((u: any) => {
                const userRolesList = (u.role || 'PRODUCTION').split(',').map((r: string) => r.trim());

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs mr-3 shadow-subtle border border-primary/20 shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="text-ink font-bold text-xs">{u.name}</p>
                          <p className="text-cool-gray flex items-center mt-0.5 text-[11px] font-mono">
                            <Mail className="w-3 h-3 mr-1 text-cool-gray" />
                            {u.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Multiple System Roles Badges */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        {userRolesList.map((roleName: string, rIdx: number) => (
                          <span key={rIdx} className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                            <Shield className="w-3 h-3 mr-1 text-primary" />
                            {roleName}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono font-bold text-ink text-xs">
                      ₹{Number(u.hourlyRate || 0).toFixed(2)}/hr
                    </td>
                    <td className="px-5 py-3.5 text-cool-gray font-mono text-[11px]">
                      {u.lastLoginAt ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(u.lastLoginAt).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-mute italic">Never Logged In</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-cool-gray border border-border-gray'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-cool-gray'}`} />
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => handleOpenEdit(u)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-primary border border-border-gray hover:border-primary/30 rounded-[8px] font-semibold text-xs transition-colors inline-flex items-center gap-1 shadow-subtle cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Roles / Password
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Login Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-border-gray w-full max-w-xl p-6 rounded-[12px] shadow-level-4 space-y-4 my-auto">
            <div className="flex items-center gap-2 mb-2 border-b border-border-gray pb-3">
              <div className="w-8 h-8 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Add User Login & System Roles</h3>
                <p className="text-xs text-cool-gray">Create authentication credentials and assign role permissions</p>
              </div>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Full Name" 
                  required 
                  placeholder="e.g. Rahul Sharma"
                  value={createFormData.name} 
                  onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})} 
                />
                <Input 
                  label="Login Email / ID" 
                  type="email" 
                  required 
                  placeholder="rahul@enterprise.com"
                  value={createFormData.email} 
                  onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Login Password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  value={createFormData.password} 
                  onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})} 
                />
                <Input 
                  label="Hourly Cost Rate (₹/hr)" 
                  type="number" 
                  required 
                  value={createFormData.hourlyRate} 
                  onChange={(e) => setCreateFormData({...createFormData, hourlyRate: (e.target.value === '' ? ('' as any) : Number(e.target.value))})} 
                />
              </div>

              {/* Multi-Select System Roles Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-cool-gray tracking-wider">
                  Assigned System Roles (Select Multiple)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 border border-border-gray rounded-[10px] custom-scrollbar">
                  {AVAILABLE_ROLES.map((r) => {
                    const isSelected = createFormData.selectedRoles.includes(r.id);
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => toggleCreateRole(r.id)}
                        className={`p-2.5 rounded-[10px] border text-left flex items-start justify-between transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-white border-primary text-ink shadow-subtle ring-1 ring-primary/20' 
                            : 'bg-white border-border-gray hover:bg-slate-100/70 text-cool-gray'
                        }`}
                      >
                        <div>
                          <p className={`font-bold text-xs ${isSelected ? 'text-primary' : 'text-ink'}`}>{r.label}</p>
                          <p className="text-[11px] text-cool-gray leading-snug">{r.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center mt-0.5 border ${
                          isSelected ? 'bg-primary text-white border-primary' : 'border-border-gray bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-border-gray">
                <Button type="button" variant="white" size="sm" onClick={() => setShowInviteModal(false)} className="flex-1 h-9">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={createUserMutation.isPending} className="flex-1 h-9 font-semibold">
                  Create Account & Roles
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-border-gray w-full max-w-xl p-6 rounded-[12px] shadow-level-4 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-border-gray pb-3 mb-2">
              <div>
                <h3 className="text-sm font-bold text-ink">Edit Credentials & Assigned Roles</h3>
                <p className="text-xs text-cool-gray font-mono">{editingUser.email}</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {editFormData.selectedRoles.map((r, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold rounded-[6px] uppercase">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="User Name" 
                  required 
                  value={editFormData.name} 
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} 
                />
                <Input 
                  label="Login Email ID" 
                  type="email" 
                  required 
                  value={editFormData.email} 
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} 
                />
              </div>

              {/* Password Reset */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-[10px] space-y-1">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Reset User Password</span>
                </div>
                <Input 
                  label="New Password (Leave blank to keep existing)" 
                  type="password" 
                  placeholder="Enter new password..."
                  value={editFormData.newPassword} 
                  onChange={(e) => setEditFormData({...editFormData, newPassword: e.target.value})} 
                />
              </div>

              {/* Multi-Select System Roles Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-cool-gray tracking-wider">
                  Assigned System Roles (Multiple Selected)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-2 bg-slate-50 border border-border-gray rounded-[10px] custom-scrollbar">
                  {AVAILABLE_ROLES.map((r) => {
                    const isSelected = editFormData.selectedRoles.includes(r.id);
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => toggleEditRole(r.id)}
                        className={`p-2.5 rounded-[10px] border text-left flex items-start justify-between transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-white border-primary text-ink shadow-subtle ring-1 ring-primary/20' 
                            : 'bg-white border-border-gray hover:bg-slate-100/70 text-cool-gray'
                        }`}
                      >
                        <div>
                          <p className={`font-bold text-xs ${isSelected ? 'text-primary' : 'text-ink'}`}>{r.label}</p>
                          <p className="text-[11px] text-cool-gray leading-snug">{r.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center mt-0.5 border ${
                          isSelected ? 'bg-primary text-white border-primary' : 'border-border-gray bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-cool-gray mb-1.5">Account Login Status</label>
                  <select 
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full h-9 px-3 bg-canvas hover:bg-white focus:bg-white border border-border-gray rounded-[8px] text-xs font-medium focus:outline-none focus:border-primary text-ink transition-all cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE (Can Login)</option>
                    <option value="INACTIVE">INACTIVE (Login Disabled)</option>
                  </select>
                </div>

                <Input 
                  label="Hourly Cost Rate (₹/hr)" 
                  type="number" 
                  required 
                  value={editFormData.hourlyRate} 
                  onChange={(e) => setEditFormData({...editFormData, hourlyRate: (e.target.value === '' ? ('' as any) : Number(e.target.value))})} 
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-border-gray">
                <Button type="button" variant="white" size="sm" onClick={() => setEditingUser(null)} className="flex-1 h-9">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={updateUserMutation.isPending} className="flex-1 h-9 font-semibold">
                  Save Roles & Credentials
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
