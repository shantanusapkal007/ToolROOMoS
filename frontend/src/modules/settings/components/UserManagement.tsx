import React, { useState } from 'react';
import { Users, Plus, Shield, Mail } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useUsers, useCreateUser } from '../../../hooks/useUsers';

export const UserManagement = () => {
  const { data: result, isLoading } = useUsers();
  const createUserMutation = useCreateUser();
  const users = result?.data || [];

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'PRODUCTION', password: '', hourlyRate: 0 });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserMutation.mutateAsync({
        ...formData,
        hourlyRate: Number(formData.hourlyRate || 0)
      });
      setShowInviteModal(false);
      setFormData({ name: '', email: '', role: 'PRODUCTION', password: '', hourlyRate: 0 });
    } catch (err) {}
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0 bg-white/5">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mr-4 border border-purple-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Users & Roles</h2>
            <p className="text-sm text-slate-400">Manage access control and team members.</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowInviteModal(true)}>
          Invite User
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 hide-scrollbar">
        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0B1018]/50">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">User</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Role</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Hourly Rate (₹)</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 animate-pulse">Loading users...</td>
                </tr>
              )}
              {users.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs mr-3">
                        {user.name ? user.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-slate-400 flex items-center mt-0.5 text-xs">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-white text-xs">
                    ₹{Number(user.hourlyRate || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      user.status === 'ACTIVE' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
                      {user.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInviteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1018] border border-white/10 w-full max-w-md p-6 rounded-2xl animate-slide-up shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Invite New User</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <Input label="Full Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              <Input label="Email Address" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              <Input label="Temporary Password" type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              <Select 
                label="Role" 
                options={[
                  { label: 'Admin', value: 'ADMIN' },
                  { label: 'Procurement', value: 'PROCUREMENT' },
                  { label: 'Production', value: 'PRODUCTION' },
                  { label: 'Quality', value: 'QUALITY' },
                  { label: 'Finance', value: 'FINANCE' },
                ]}
                value={formData.role} 
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              />
              <Input 
                label="Hourly Cost Rate (₹)" 
                type="number" 
                required 
                value={formData.hourlyRate} 
                onChange={(e) => setFormData({...formData, hourlyRate: Number(e.target.value)})} 
              />
              <div className="flex space-x-3 pt-4 border-t border-white/10">
                <Button type="button" variant="ghost" onClick={() => setShowInviteModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" variant="primary" isLoading={createUserMutation.isPending} className="flex-1">Send Invite</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
