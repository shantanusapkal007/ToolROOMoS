"use client";

import React, { useState } from 'react';
import { Users, Plus, Shield, Mail, Search, Key, Clock, Edit2, Lock, CheckCircle2, Check, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useUsers, useCreateUser, useUpdateUser } from '../../../hooks/useUsers';
import { motion, AnimatePresence } from 'framer-motion';

const AVAILABLE_ROLES = [
  { id: 'ADMIN', label: 'Admin (Full Access)', desc: 'Unrestricted system governance & security' },
  { id: 'PRODUCTION', label: 'Production Operator', desc: 'Job cards, MSDR daily reports & machine logs' },
  { id: 'STORES', label: 'Stores Officer', desc: 'GRN inward, Heat # tracking & Store issuances' },
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
      hourlyRate: Number(user.hourlyRate || 0),
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const payload: any = {
      name: editFormData.name,
      email: editFormData.email,
      role: editFormData.selectedRoles.join(', '),
      status: editFormData.status,
      hourlyRate: Number(editFormData.hourlyRate || 0),
    };

    if (editFormData.newPassword) {
      payload.password = editFormData.newPassword;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data: payload
      });
      setEditingUser(null);
    } catch (err) {}
  };

  const filteredUsers = users.filter((u: any) =>
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    (u.role && u.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col relative">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between p-6 border-b border-black/10 shrink-0 bg-black/5">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mr-4 border border-purple-200 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">User Login Credentials & Access Governance</h2>
            <p className="text-sm text-zinc-500">Manage user login credentials, assign multiple system roles, and configure hourly cost rates.</p>
          </div>
        </div>

        <Button 
          variant="primary" 
          leftIcon={<Plus className="w-4 h-4" />} 
          onClick={() => setShowInviteModal(true)}
          className="bg-purple-600 hover:bg-purple-700 active:scale-[0.98] border border-purple-500/40 shadow-[0_1px_3px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.2)]"
        >
          Add User Login Account
        </Button>
      </div>

      {/* Controls Bar */}
      <div className="p-4 border-b border-black/5 bg-white/40 flex items-center gap-4 shrink-0">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search accounts by name, email ID, or system role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/70 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div className="text-xs font-bold text-zinc-500 font-mono">
          Total Accounts: {filteredUsers.length}
        </div>
      </div>

      {/* User Table */}
      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
        <div className="border border-black/10 rounded-2xl overflow-hidden shadow-sm bg-white">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/5 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider border-b border-black/10">
              <tr>
                <th className="px-6 py-4">User & Login ID</th>
                <th className="px-6 py-4">Assigned System Roles (Multiple)</th>
                <th className="px-6 py-4">Hourly Cost Rate</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-medium text-xs">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 animate-pulse">Loading user accounts...</td>
                </tr>
              )}
              {filteredUsers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No matching user accounts found.</td>
                </tr>
              )}
              {filteredUsers.map((u: any) => {
                const userRolesList = (u.role || 'PRODUCTION').split(',').map((r: string) => r.trim());

                return (
                  <tr key={u.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs mr-3 shadow-sm">
                          {u.name ? u.name.charAt(0) : '?'}
                        </div>
                        <div>
                          <p className="text-zinc-900 font-bold text-sm">{u.name}</p>
                          <p className="text-zinc-500 flex items-center mt-0.5 text-xs font-mono">
                            <Mail className="w-3 h-3 mr-1 text-zinc-400" />
                            {u.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Multiple System Roles Badges */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        {userRolesList.map((roleName: string, rIdx: number) => (
                          <span key={rIdx} className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200 shadow-xs">
                            <Shield className="w-3 h-3 mr-1 text-purple-600" />
                            {roleName}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-zinc-900 text-sm">
                      â‚¹{Number(u.hourlyRate || 0).toFixed(2)}/hr
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-mono text-[11px]">
                      {u.lastLoginAt ? (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(u.lastLoginAt).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">Never Logged In</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' 
                          : 'bg-zinc-200 text-zinc-700 border border-zinc-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                        {u.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenEdit(u)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1 ml-auto"
                      >
                        <Edit2 className="w-3 h-3" /> Edit Roles / Reset Password
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Login Modal with Multi-Select Roles */}
      {showInviteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="glass-panel border border-white/80 w-full max-w-xl p-6 rounded-2xl shadow-2xl space-y-4 my-auto">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-zinc-900">Add User Login & System Roles</h3>
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
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={createFormData.password} 
                  onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})} 
                />
                <Input 
                  label="Hourly Cost Rate (â‚¹/hr)" 
                  type="number" 
                  required 
                  value={createFormData.hourlyRate} 
                  onChange={(e) => setCreateFormData({...createFormData, hourlyRate: (e.target.value === '' ? ('' as any) : Number(e.target.value))})} 
                />
              </div>

              {/* Multi-Select System Roles Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-zinc-700 tracking-wider">
                  Assigned System Roles (Select Multiple)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-2 bg-white/70 border border-black/10 rounded-xl">
                  {AVAILABLE_ROLES.map((r) => {
                    const isSelected = createFormData.selectedRoles.includes(r.id);
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => toggleCreateRole(r.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                          isSelected 
                            ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs' 
                            : 'bg-white/50 border-black/5 hover:bg-black/5 text-zinc-600'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs">{r.label}</p>
                          <p className="text-[10px] text-zinc-400 leading-snug">{r.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center mt-0.5 border ${
                          isSelected ? 'bg-purple-600 text-white border-purple-600' : 'border-zinc-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-black/10">
                <Button type="button" variant="ghost" onClick={() => setShowInviteModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" variant="primary" isLoading={createUserMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700">Create Account & Roles</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Credentials & Multi-Role Selection Modal */}
      {editingUser && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="glass-panel border border-white/80 w-full max-w-xl p-6 rounded-2xl shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-2">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Edit Credentials & Assigned Roles</h3>
                <p className="text-xs text-zinc-500 font-mono">{editingUser.email}</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {editFormData.selectedRoles.map((r, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded-md uppercase">
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
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
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
                <label className="block text-xs font-bold uppercase text-zinc-700 tracking-wider">
                  Assigned System Roles (Multiple Selected)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto custom-scrollbar p-2 bg-white/70 border border-black/10 rounded-xl">
                  {AVAILABLE_ROLES.map((r) => {
                    const isSelected = editFormData.selectedRoles.includes(r.id);
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => toggleEditRole(r.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                          isSelected 
                            ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs' 
                            : 'bg-white/50 border-black/5 hover:bg-black/5 text-zinc-600'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs">{r.label}</p>
                          <p className="text-[10px] text-zinc-400 leading-snug">{r.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded flex items-center justify-center mt-0.5 border ${
                          isSelected ? 'bg-purple-600 text-white border-purple-600' : 'border-zinc-300'
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
                  <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">Account Login Status</label>
                  <select 
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-black/10 rounded-xl text-sm font-medium focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Can Login)</option>
                    <option value="INACTIVE">INACTIVE (Login Disabled)</option>
                  </select>
                </div>

                <Input 
                  label="Hourly Cost Rate (â‚¹/hr)" 
                  type="number" 
                  required 
                  value={editFormData.hourlyRate} 
                  onChange={(e) => setEditFormData({...editFormData, hourlyRate: (e.target.value === '' ? ('' as any) : Number(e.target.value))})} 
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-black/10">
                <Button type="button" variant="ghost" onClick={() => setEditingUser(null)} className="flex-1">Cancel</Button>
                <Button type="submit" variant="primary" isLoading={updateUserMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700">Save Roles & Credentials</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
