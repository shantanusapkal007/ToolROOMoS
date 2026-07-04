"use client";

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { Users, Briefcase, Plus, TrendingUp, Edit2, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

export default function HrDashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr/employees');
      setEmployees(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load HR data', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const internal = safeEmployees.filter(e => e.employeeType === 'INTERNAL');
  const external = safeEmployees.filter(e => e.employeeType === 'EXTERNAL');

  const handleAddWorker = async () => {
    try {
      // For demo purposes, pick the first department ID available from existing employees
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
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans bg-[#05070A]">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8 pl-32 pb-32 relative z-0 animate-fade-in">
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

        {loading ? (
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-32 bg-white/5 rounded-xl"></div>
            <div className="h-64 bg-white/5 rounded-xl"></div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Internal Staff */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
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
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
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
        )}
      </div>

      {/* Add Worker Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0A0F1C] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">Add New Worker</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Employee Code</label>
                <input 
                  type="text" 
                  value={newWorker.employeeCode}
                  onChange={e => setNewWorker({...newWorker, employeeCode: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. EMP-001"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newWorker.name}
                  onChange={e => setNewWorker({...newWorker, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                  <select 
                    value={newWorker.employeeType}
                    onChange={e => setNewWorker({...newWorker, employeeType: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 appearance-none"
                  >
                    <option value="INTERNAL">Internal</option>
                    <option value="EXTERNAL">External / Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Hourly Rate (₹)</label>
                  <input 
                    type="number" 
                    value={newWorker.hourlyRate}
                    onChange={e => setNewWorker({...newWorker, hourlyRate: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Designation</label>
                <input 
                  type="text" 
                  value={newWorker.designation}
                  onChange={e => setNewWorker({...newWorker, designation: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. CNC Operator"
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end space-x-3 bg-white/[0.02]">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
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
    <div className={`p-5 rounded-2xl border ${isExternal ? 'bg-purple-900/10 border-purple-500/20' : 'bg-white/5 border-white/10'} shadow-sm relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-4">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isExternal ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
          {worker.employeeType}
        </span>
      </div>
      
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold text-lg border border-white/10">
          {worker.name.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">{worker.name}</h3>
          <p className="text-sm text-slate-400">{worker.designation || 'Worker'}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">Base Hourly Charge</p>
          {editingRate ? (
            <div className="flex items-center space-x-2">
              <span className="text-white">₹</span>
              <input 
                type="number" 
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-20 bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-sm"
              />
              <button onClick={handleUpdateRate} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Save</button>
              <button onClick={() => setEditingRate(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <p className="font-bold text-white">₹{worker.hourlyRate} <span className="text-slate-500 font-normal text-sm">/ hr</span></p>
              <button onClick={() => setEditingRate(true)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                <Edit2 className="w-3 h-3 text-slate-400" />
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
