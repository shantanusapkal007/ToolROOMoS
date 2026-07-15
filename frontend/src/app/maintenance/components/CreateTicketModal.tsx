import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useCreateMaintenanceTicket } from '../../../hooks/useMaintenance';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Combobox } from '../../../components/ui/Combobox';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ isOpen, onClose }) => {
  const [machineId, setMachineId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [assignedToId, setAssignedToId] = useState('');
  const [category, setCategory] = useState('');
  const [downtimeStartedAt, setDowntimeStartedAt] = useState('');
  
  const createTicket = useCreateMaintenanceTicket();
  
  // Fetch machines to populate the dropdown
  const { data: machines } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const res = await api.get('/master-data/machines');
      // Handle the custom response structure from our `api` wrapper if needed,
      // but `api.get` already returns res.data in axios, 
      // wait, `api.get` returns an AxiosResponse if we didn't unwrap it.
      // MasterDataService does: `const res = await api.get<any>(...); const body = res.data;`
      // Let's do `res.data.data` because standard nestjs endpoints might wrap it, or just `res.data`
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data?.data) return data.data;
      return [];
    }
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data?.data) return data.data;
      return [];
    }
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data?.data) return data.data;
      return [];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineId || !issueDescription) return;

    await createTicket.mutateAsync({
      machineId,
      projectId: projectId || undefined,
      issueDescription,
      priority,
      assignedToId: assignedToId || undefined,
      category: category || undefined,
      downtimeStartedAt: downtimeStartedAt ? new Date(downtimeStartedAt).toISOString() : undefined
    });
    
    // Reset and close
    setMachineId('');
    setProjectId('');
    setIssueDescription('');
    setPriority('NORMAL');
    setAssignedToId('');
    setCategory('');
    setDowntimeStartedAt('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/5 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-[#FBFBFC] border border-black/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] pointer-events-none rounded-full" />
            
            <div className="p-6 border-b border-black/10 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Report Breakdown</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                  Select Machine <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={machines?.map((m: any) => ({ value: m.id, label: m.machineName })) || []}
                  value={machineId}
                  onChange={setMachineId}
                  placeholder="Search machines..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                  Related Project (Optional)
                </label>
                <Combobox
                  options={projects?.map((p: any) => ({ value: p.id, label: p.projectNumber + ' - ' + p.partName })) || []}
                  value={projectId}
                  onChange={setProjectId}
                  placeholder="Search projects..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                    Assignee (Optional)
                  </label>
                  <Combobox
                    options={users?.map((u: any) => ({ value: u.id, label: u.name || u.email })) || []}
                    value={assignedToId}
                    onChange={setAssignedToId}
                    placeholder="Search employees..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                    Category (Optional)
                  </label>
                  <Combobox
                    options={[
                      { value: 'MECHANICAL', label: 'Mechanical' },
                      { value: 'ELECTRICAL', label: 'Electrical' },
                      { value: 'HYDRAULIC', label: 'Hydraulic' },
                      { value: 'PNEUMATIC', label: 'Pneumatic' },
                      { value: 'SOFTWARE', label: 'Software' },
                    ]}
                    value={category}
                    onChange={setCategory}
                    placeholder="Select category..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                  Downtime Started At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={downtimeStartedAt}
                  onChange={(e) => setDowntimeStartedAt(e.target.value)}
                  className="w-full bg-black/5 border border-black/10 rounded-lg p-3 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 appearance-none"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1.5">Priority</label>
                <div className="grid grid-cols-3 gap-3">
                  {['NORMAL', 'HIGH', 'CRITICAL'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${
                        priority === p 
                          ? p === 'CRITICAL' ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                            : p === 'HIGH' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                            : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                          : 'bg-black/5 border-black/10 text-zinc-500 hover:bg-black/10 hover:text-zinc-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1.5">Issue Description *</label>
                <textarea 
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  required
                  placeholder="Describe the breakdown, symptoms, and potential hazards..."
                  className="w-full bg-black/5 border border-black/10 rounded-lg p-3 text-sm text-zinc-900 placeholder-zinc-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 h-32 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-black/10 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createTicket.isPending || !machineId || !issueDescription.trim()}
                  className="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-elevation transition-all"
                >
                  {createTicket.isPending ? 'Reporting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
