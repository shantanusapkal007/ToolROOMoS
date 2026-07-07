"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, UserCog, Factory, History, Search, ArrowRight, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from "../../../lib/api";
import { useToast } from "../../../components/ui/Toast";

// API Fetchers
const fetchEmployees = async () => {
  const res = await api.get('/hr/employees');
  return Array.isArray(res) ? res : res.data;
};

const fetchMachines = async () => {
  const res = await api.get('/master-data/machines?limit=100');
  return Array.isArray(res) ? res : res.data;
};

const fetchRateHistory = async (type: string, id: string): Promise<any[]> => {
  const res = await api.get(`/hr/rates/${type}/${id}`);
  return Array.isArray(res) ? res : (res as any).data || [];
};

export default function ResourceRatesPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<any>(null); // For history panel
  const [editEntity, setEditEntity] = useState<any>(null); // For edit modal
  const [newRate, setNewRate] = useState<number | string>("");
  const [reason, setReason] = useState("");

  const { data: employees = [], isLoading: loadingEmp } = useQuery({ queryKey: ['employees'], queryFn: fetchEmployees });
  const { data: machines = [], isLoading: loadingMach } = useQuery({ queryKey: ['machines'], queryFn: fetchMachines });

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['rateHistory', selectedEntity?.type, selectedEntity?.id],
    queryFn: () => fetchRateHistory(selectedEntity.type, selectedEntity.id),
    enabled: !!selectedEntity,
  });

  // Combine and normalize data
  const mergedData = [
    ...employees.map((e: any) => ({
      id: e.id,
      code: e.employeeCode,
      name: e.name,
      category: e.designation || 'General',
      type: 'EMPLOYEE',
      rate: e.hourlyRate || 0,
      status: e.status
    })),
    ...machines.map((m: any) => ({
      id: m.id,
      code: m.machineCode,
      name: m.machineName,
      category: m.machineType || 'General',
      type: 'MACHINE',
      rate: m.hourlyRate || 0,
      status: m.status
    }))
  ];

  const filteredData = mergedData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateRateMutation = useMutation({
    mutationFn: async ({ id, type, rate, reason }: any) => {
      if (type === 'EMPLOYEE') {
        return await api.patch(`/hr/employees/${id}/rate`, { newRate: Number(rate), reason });
      } else {
        return await api.put(`/master-data/machines/${id}`, { hourlyRate: Number(rate), remarks: reason });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      success("Rate updated successfully");
      setEditEntity(null);
      setNewRate("");
      setReason("");
    }
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEntity || !newRate) return;
    updateRateMutation.mutate({ 
      id: editEntity.id, 
      type: editEntity.type, 
      rate: newRate, 
      reason: reason || 'Rate adjustment' 
    });
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Resource Rates</h2>
          <p className="text-sm text-slate-400">Consolidated financial view of hourly cost rates for employees and machines.</p>
        </div>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search resources..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/10">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Resource</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Current Rate (₹)</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(loadingEmp || loadingMach) ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading resources...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No resources found.</td></tr>
              ) : (
                filteredData.map(item => (
                  <tr key={`${item.type}-${item.id}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center">
                        {item.type === 'EMPLOYEE' ? <UserCog className="w-4 h-4 mr-2 text-blue-400" /> : <Factory className="w-4 h-4 mr-2 text-purple-400" />}
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{item.code}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${item.type === 'EMPLOYEE' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-300">{item.category}</td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-400">
                      ₹{Number(item.rate).toFixed(2)}
                      <span className="text-xs text-slate-500 font-sans font-normal ml-1">/hr</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedEntity(item)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-slate-300 transition-colors flex items-center"
                        >
                          <History className="w-3 h-3 mr-1.5" /> History
                        </button>
                        <button 
                          onClick={() => { setEditEntity(item); setNewRate(item.rate); setReason(""); }}
                          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Update Rate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Rate Modal */}
      <AnimatePresence>
        {editEntity && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0B1120] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-bold text-white">Update Hourly Rate</h3>
                <button onClick={() => setEditEntity(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Resource</div>
                  <div className="font-bold text-white">{editEntity.name} ({editEntity.code})</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Rate (₹/hr)</label>
                  <input 
                    type="number" step="0.01" required
                    value={newRate} onChange={e => setNewRate(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reason for Update</label>
                  <input 
                    type="text" required placeholder="e.g. Annual Increment, Inflation"
                    value={reason} onChange={e => setReason(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <button 
                    type="button" onClick={() => setEditEntity(null)}
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white mr-2"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={updateRateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl flex items-center"
                  >
                    {updateRateMutation.isPending ? 'Updating...' : 'Save Rate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Side Panel */}
      <AnimatePresence>
        {selectedEntity && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
            className="absolute top-0 right-0 bottom-0 w-96 bg-[#0B1120]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col z-40"
          >
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="font-bold text-white">Rate History</h3>
                <p className="text-xs text-slate-400">{selectedEntity.name}</p>
              </div>
              <button onClick={() => setSelectedEntity(null)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingHistory ? (
                <div className="text-center text-slate-500">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-center text-slate-500">No rate changes recorded yet.</div>
              ) : (
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-[15px] w-px bg-white/10" />
                  {history.map((record: any, idx: number) => (
                    <div key={record.id} className="relative flex items-start mb-6">
                      <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center shrink-0 z-10">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-xs text-slate-400">{new Date(record.effectiveFrom).toLocaleDateString()}</div>
                            <div className="text-[10px] font-mono text-slate-500">{record.recordedBy}</div>
                          </div>
                          <div className="flex items-center text-sm font-bold font-mono">
                            <span className="text-slate-400 line-through mr-2">₹{Number(record.oldRate).toFixed(2)}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500 mr-2" />
                            <span className="text-emerald-400">₹{Number(record.newRate).toFixed(2)}</span>
                          </div>
                          {record.reason && (
                            <div className="mt-2 text-xs text-slate-300 bg-black/40 p-2 rounded-lg italic">
                              "{record.reason}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
