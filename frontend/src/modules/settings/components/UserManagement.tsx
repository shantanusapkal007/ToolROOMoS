import React from 'react';
import { Users, Plus, Shield, Mail } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const mockUsers = [
  { id: '1', name: 'Admin User', email: 'admin@toolroom.com', role: 'ADMIN', status: 'Active' },
  { id: '2', name: 'John Doe', email: 'john.d@toolroom.com', role: 'ENGINEERING', status: 'Active' },
  { id: '3', name: 'Jane Smith', email: 'jane.s@toolroom.com', role: 'PROCUREMENT', status: 'Active' },
];

export const UserManagement = () => {
  return (
    <div className="h-full flex flex-col">
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
        <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
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
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs mr-3">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-slate-400 flex items-center mt-0.5 text-xs">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                      {user.status}
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
    </div>
  );
};
