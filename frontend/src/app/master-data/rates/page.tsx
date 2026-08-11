"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, UserCog, Factory, History, Search, ArrowRight, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from "../../../lib/api";
import { useToast } from "../../../components/ui/Toast";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { StatusBadge } from "../../../components/ui/StatusBadge";

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
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-border-gray flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
        <div>
          <h2 className="text-sub-heading font-bold text-ink">Resource Rates</h2>
          <p className="text-caption text-silver-blue mt-0.5">Consolidated financial view of hourly cost rates for employees and machines.</p>
        </div>
        <div className="w-full sm:w-64">
          <Input 
            placeholder="Search resources..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-silver-blue" />}
            className="py-2 text-caption"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
          <table className="w-full text-left border-collapse text-body-sm">
            <thead>
              <tr className="bg-[rgba(148,151,169,0.05)] border-b border-border-gray text-caption font-semibold text-cool-gray">
                <th className="py-3.5 px-4">Resource</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Current Rate (₹)</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-gray">
              {(loadingEmp || loadingMach) ? (
                <tr><td colSpan={5} className="py-12 text-center text-silver-blue">Loading resources...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-silver-blue">No resources found.</td></tr>
              ) : (
                filteredData.map(item => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-[rgba(148,151,169,0.06)] transition-colors group text-ink">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-ink flex items-center">
                        {item.type === 'EMPLOYEE' ? <UserCog className="w-4 h-4 mr-2 text-primary" /> : <Factory className="w-4 h-4 mr-2 text-primary-dark" />}
                        {item.name}
                      </div>
                      <div className="text-small text-silver-blue font-mono mt-0.5">{item.code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-[8px] text-[11px] font-mono font-medium tracking-wider uppercase ${item.type === 'EMPLOYEE' ? 'bg-primary-subtle text-primary' : 'bg-[rgba(148,151,169,0.12)] text-[#484b5e]'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-caption text-cool-gray">{item.category}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-green">
                      ₹{Number(item.rate).toFixed(2)}
                      <span className="text-small text-silver-blue font-sans font-normal ml-1">/hr</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="white"
                          size="sm"
                          onClick={() => setSelectedEntity(item)}
                        >
                          <History className="w-3.5 h-3.5 mr-1 text-silver-blue" /> History
                        </Button>
                        <Button 
                          variant="primary"
                          size="sm"
                          onClick={() => { setEditEntity(item); setNewRate(item.rate); setReason(""); }}
                        >
                          Update Rate
                        </Button>
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
      <Modal
        isOpen={!!editEntity}
        onClose={() => setEditEntity(null)}
        title="Update Hourly Rate"
        maxWidth="md"
      >
        {editEntity && (
          <form onSubmit={handleUpdate} className="space-y-4 text-ink">
            <div className="p-3 bg-[rgba(148,151,169,0.04)] border border-border-gray rounded-[10px]">
              <div className="text-small text-silver-blue mb-0.5">Resource</div>
              <div className="font-semibold text-ink">{editEntity.name} ({editEntity.code})</div>
            </div>
            <div>
              <label className="block text-caption font-medium text-cool-gray mb-1.5">New Rate (₹/hr) *</label>
              <Input 
                type="number" step="0.01" required
                value={newRate} onChange={e => setNewRate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-cool-gray mb-1.5">Reason for Update *</label>
              <Input 
                type="text" required placeholder="e.g. Annual Increment, Inflation"
                value={reason} onChange={e => setReason(e.target.value)}
              />
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-border-gray">
              <Button 
                variant="ghost" 
                type="button" 
                onClick={() => setEditEntity(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                type="submit"
                isLoading={updateRateMutation.isPending}
              >
                Save Rate
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* History Side Panel */}
      <AnimatePresence>
        {selectedEntity && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
            className="absolute top-0 right-0 bottom-0 w-96 bg-white border-l border-border-gray shadow-level-4 flex flex-col z-40"
          >
            <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center bg-white">
              <div>
                <h3 className="font-bold text-feature-title text-ink">Rate History</h3>
                <p className="text-small text-silver-blue">{selectedEntity.name}</p>
              </div>
              <button onClick={() => setSelectedEntity(null)} className="p-1.5 hover:bg-[rgba(148,151,169,0.08)] rounded-[8px] text-silver-blue hover:text-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingHistory ? (
                <div className="text-center text-silver-blue">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-center text-silver-blue">No rate changes recorded yet.</div>
              ) : (
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-[15px] w-px bg-border-gray" />
                  {history.map((record: any, idx: number) => (
                    <div key={record.id} className="relative flex items-start mb-6">
                      <div className="w-8 h-8 rounded-full bg-white border border-border-gray flex items-center justify-center shrink-0 z-10 shadow-subtle">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="bg-[rgba(148,151,169,0.04)] border border-border-gray rounded-[10px] p-3 shadow-subtle">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-caption font-medium text-cool-gray">{new Date(record.effectiveFrom).toLocaleDateString()}</div>
                            <div className="text-small font-mono text-silver-blue">{record.recordedBy}</div>
                          </div>
                          <div className="flex items-center text-caption font-bold font-mono">
                            <span className="text-silver-blue line-through mr-2">₹{Number(record.oldRate).toFixed(2)}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-silver-blue mr-2" />
                            <span className="text-green">₹{Number(record.newRate).toFixed(2)}</span>
                          </div>
                          {record.reason && (
                            <div className="mt-2 text-small text-cool-gray bg-white border border-border-gray p-2 rounded-[8px] italic">
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
