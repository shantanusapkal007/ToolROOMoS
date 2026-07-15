"use client";

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { Users, Briefcase, Plus, TrendingUp, Edit2, X, Search, Sliders, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

export default function HrDashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workforce' | 'directory'>('workforce');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWorker, setNewWorker] = useState({
    employeeCode: '',
    name: '',
    designation: '',
    employeeType: 'INTERNAL',
    hourlyRate: 0,
  });

  const { success, error } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadEmployees(),
        loadMachines(),
        loadUsers()
      ]);
    } catch (err) {
      console.error('Failed to load HR dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/hr/employees');
      setEmployees(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load employees', err);
      setEmployees([]);
    }
  };

  const loadMachines = async () => {
    try {
      const res = await api.get('/master-data/machines');
      setMachines(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load machines', err);
      setMachines([]);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load users', err);
      setUsers([]);
    }
  };

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const internal = safeEmployees.filter(e => e.employeeType === 'INTERNAL');
  const external = safeEmployees.filter(e => e.employeeType === 'EXTERNAL');

  const handleAddWorker = async () => {
    try {
      const defaultDeptId = safeEmployees.length > 0 ? safeEmployees[0].departmentId : null;
      if (!defaultDeptId) {
        throw new Error("No departments available. Seed the database first.");
      }
      
      await api.post('/hr/employees', {
        ...newWorker,
        hourlyRate: Number(newWorker.hourlyRate),
        departmentId: defaultDeptId
      });
      
      setIsAddModalOpen(false);
      success('Success', 'Worker added successfully');
      loadEmployees();
    } catch (e: any) {
      error('Error', e.message || 'Failed to add worker');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-zinc-900 font-sans bg-[#05070A]">
      <Sidebar />
      <div className="flex-1 overflow-y-auto px-8 py-8 pl-[5.5rem] pb-32 relative z-0 animate-fade-in">
        <PageHeader
          title="HR & Resource Management"
          subtitle="Manage internal staff, outside contractors, and dynamic base hourly charges."
          actions={
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Worker
            </button>
          }
        />

        {/* Tab Selection */}
        <div className="flex space-x-6 border-b border-black/5 mb-6">
          <button 
            onClick={() => setActiveTab('workforce')}
            className={`pb-3 text-sm font-bold tracking-wider uppercase transition-colors relative ${activeTab === 'workforce' ? 'text-zinc-900 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Workforce Directory
          </button>
          <button 
            onClick={() => setActiveTab('directory')}
            className={`pb-3 text-sm font-bold tracking-wider uppercase transition-colors relative ${activeTab === 'directory' ? 'text-zinc-900 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Hourly Rates Consolidated
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-32 bg-black/5 rounded-xl"></div>
            <div className="h-64 bg-black/5 rounded-xl"></div>
          </div>
        ) : activeTab === 'workforce' ? (
          <div className="space-y-8">
            
            {/* Internal Staff */}
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-400" />
                Internal Workforce ({internal.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {internal.map(emp => (
                  <WorkerCard key={emp.id} worker={emp} />
                ))}
                {internal.length === 0 && <p className="text-slate-500">No internal staff found.</p>}
              </div>
            </div>

            {/* Outside Subcontractors / Temporary */}
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-purple-400" />
                Outside / Contract Workers ({external.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {external.map(emp => (
                  <WorkerCard key={emp.id} worker={emp} isExternal />
                ))}
                {external.length === 0 && <p className="text-slate-500">No external workers found.</p>}
              </div>
            </div>

          </div>
        ) : (
          <HourlyRatesDirectoryTable 
            employees={safeEmployees}
            machines={machines}
            users={users}
            onReload={loadAllData}
          />
        )}
      </div>

      {/* Add Worker Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/5 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0A0F1C] border border-black/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-black/5">
              <h3 className="text-lg font-bold text-zinc-900">Add New Worker</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-zinc-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Employee Code</label>
                <input 
                  type="text" 
                  value={newWorker.employeeCode}
                  onChange={e => setNewWorker({...newWorker, employeeCode: e.target.value})}
                  className="w-full bg-black/5 border border-black/10 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. EMP-001"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newWorker.name}
                  onChange={e => setNewWorker({...newWorker, name: e.target.value})}
                  className="w-full bg-black/5 border border-black/10 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Type</label>
                  <select 
                    value={newWorker.employeeType}
                    onChange={e => setNewWorker({...newWorker, employeeType: e.target.value})}
                    className="w-full bg-black/5 border border-black/10 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none focus:border-emerald-500 appearance-none"
                  >
                    <option value="INTERNAL">Internal</option>
                    <option value="EXTERNAL">External / Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Hourly Rate (&#8377;)</label>
                  <input 
                    type="number" 
                    value={newWorker.hourlyRate}
                    onChange={e => setNewWorker({...newWorker, hourlyRate: Number(e.target.value)})}
                    className="w-full bg-black/5 border border-black/10 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Designation</label>
                <input 
                  type="text" 
                  value={newWorker.designation}
                  onChange={e => setNewWorker({...newWorker, designation: e.target.value})}
                  className="w-full bg-black/5 border border-black/10 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. CNC Operator"
                />
              </div>
            </div>

            <div className="p-6 border-t border-black/5 flex justify-end space-x-3 bg-black/[0.02]">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddWorker}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-500/20"
              >
                Add Worker
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Ensure useToast isn't redefined at the bottom if already imported
function WorkerCard({ worker, isExternal = false }: { worker: any, isExternal?: boolean }) {
  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState(worker.hourlyRate);
  const { success, error } = useToast();

  const handleUpdateRate = async () => {
    try {
      await api.patch(`/hr/employees/${worker.id}/rate`, { newRate: Number(newRate), reason: 'Updated via HR Dashboard' });
      setEditingRate(false);
      success('Success', 'Rate updated successfully.');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      error('Error', e.message || 'Failed to update rate.');
    }
  };

  return (
    <div className={`p-5 rounded-2xl border ${isExternal ? 'bg-purple-900/10 border-purple-500/20' : 'bg-black/5 border-black/10'} shadow-sm relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-4">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isExternal ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
          {worker.employeeType}
        </span>
      </div>
      
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-zinc-900 font-bold text-lg border border-black/10">
          {worker.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-zinc-900 text-lg">{worker.name}</h3>
          <p className="text-sm text-zinc-500">{worker.designation || 'Worker'}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-black/5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">Base Hourly Charge</p>
          {editingRate ? (
            <div className="flex items-center space-x-2">
              <span className="text-zinc-900">&#8377;</span>
              <input 
                type="number" 
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-20 bg-black/5 border border-black/20 rounded px-2 py-1 text-zinc-900 text-sm"
              />
              <button onClick={handleUpdateRate} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Save</button>
              <button onClick={() => setEditingRate(false)} className="text-xs text-zinc-500 hover:text-zinc-900">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <p className="font-bold text-zinc-900">&#8377;{worker.hourlyRate} <span className="text-slate-500 font-normal text-sm">/ hr</span></p>
              <button onClick={() => setEditingRate(true)} className="p-1 hover:bg-black/10 rounded-md transition-colors">
                <Edit2 className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          )}
        </div>
        <button className="flex items-center text-xs font-semibold text-orange-400 hover:text-orange-300">
          <TrendingUp className="w-3 h-3 mr-1" /> History
        </button>
      </div>
    </div>
  );
}

function HourlyRatesDirectoryTable({ employees, machines, users, onReload }: { employees: any[], machines: any[], users: any[], onReload: () => void }) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const directoryItems: any[] = [];
  
  employees.forEach(emp => {
    directoryItems.push({
      id: emp.id,
      name: `${emp.firstName || ''} ${emp.lastName || emp.name || ''}`,
      code: emp.employeeCode,
      category: 'Labour',
      type: emp.employeeType === 'EXTERNAL' ? 'External Contractor' : 'Internal Employee',
      designation: emp.designation || 'Machinist / Operator',
      rate: Number(emp.hourlyRate || 0),
      rawEntity: emp
    });
  });

  machines.forEach(mac => {
    directoryItems.push({
      id: mac.id,
      name: mac.machineName,
      code: mac.machineCode,
      category: 'Machine',
      type: mac.machineType,
      designation: 'Shopfloor Asset',
      rate: Number(mac.hourlyRate || 0),
      rawEntity: mac
    });
  });

  users.forEach(usr => {
    directoryItems.push({
      id: usr.id,
      name: usr.name,
      code: usr.email,
      category: 'Owner',
      type: usr.role,
      designation: 'System Access User',
      rate: Number(usr.hourlyRate || 0),
      rawEntity: usr
    });
  });

  const filtered = directoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.designation.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEditRate = (item: any) => {
    setEditingId(item.id);
    setEditingRate(item.rate);
  };

  const handleSaveRate = async (item: any) => {
    setSaving(true);
    try {
      if (item.category === 'Labour') {
        await api.patch(`/hr/employees/${item.id}/rate`, { 
          newRate: Number(editingRate), 
          reason: 'Consolidated rates directory edit' 
        });
      } else if (item.category === 'Machine') {
        await api.put(`/master-data/machines/${item.id}`, {
          ...item.rawEntity,
          hourlyRate: Number(editingRate)
        });
      } else if (item.category === 'Owner') {
        await api.put(`/users/${item.id}`, {
          ...item.rawEntity,
          hourlyRate: Number(editingRate)
        });
      }
      success('Rate Saved', `Successfully updated hourly rate to ₹${editingRate}`);
      setEditingId(null);
      onReload();
    } catch (err: any) {
      error('Save Failed', err.message || 'Failed to update hourly rate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#F4F4F6]/50 border border-black/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl backdrop-blur-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Consolidated Hourly Rates</h3>
            <p className="text-xs text-zinc-500">View and update billing rates for all personnel, machines, and administrative owners.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Search resource..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/5 border border-black/10 rounded-lg pl-9 pr-4 py-2 text-zinc-900 text-xs focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-[#F4F4F6] border border-black/10 rounded-lg px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Labour">Labours</option>
            <option value="Machine">Machines</option>
            <option value="Owner">Owners</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/5">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-black/5 text-zinc-500 border-b border-black/5 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Resource Code</th>
              <th className="px-6 py-4">Resource Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Type / Role</th>
              <th className="px-6 py-4">Designation</th>
              <th className="px-6 py-4">Hourly Rate (₹)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">No resources found matching filter.</td>
              </tr>
            ) : filtered.map(item => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} className="hover:bg-black/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-zinc-500">{item.code}</td>
                  <td className="px-6 py-4 font-semibold text-zinc-900">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      item.category === 'Labour' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      item.category === 'Machine' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 font-medium">{item.type}</td>
                  <td className="px-6 py-4 text-zinc-500">{item.designation}</td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-zinc-900 text-xs">₹</span>
                        <input 
                          type="number" 
                          value={editingRate}
                          onChange={e => setEditingRate(Number(e.target.value))}
                          className="w-20 bg-black/5 border border-black/20 rounded px-2 py-1 text-zinc-900 text-xs font-bold font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-zinc-900 text-xs">₹{item.rate.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleSaveRate(item)} 
                          disabled={saving}
                          className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button 
                          onClick={() => setEditingId(null)} 
                          className="text-xs text-zinc-500 hover:text-zinc-900 px-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEditRate(item)}
                        className="p-1.5 hover:bg-black/10 rounded-md transition-colors inline-flex items-center"
                        title="Edit Hourly Rate"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-900" />
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
  );
}
