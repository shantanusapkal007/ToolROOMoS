import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Unlock, Clock, AlertTriangle, Save, CheckCircle, Package, Briefcase, Factory } from 'lucide-react';
import { useUpdateMaintenanceTicket, useToggleLOTO, useAddMaintenanceLog, useAddSparePart } from '../../../hooks/useMaintenance';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/formatters';
import { Combobox } from '../../../components/ui/Combobox';

interface TicketDrawerProps {
  ticket: any | null;
  onClose: () => void;
}

export const TicketDrawer: React.FC<TicketDrawerProps> = ({ ticket, onClose }) => {
  const updateTicket = useUpdateMaintenanceTicket();
  const toggleLoto = useToggleLOTO();
  const addLog = useAddMaintenanceLog();
  const addSparePart = useAddSparePart();
  const [newLog, setNewLog] = useState('');
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState<number>(1);

  // Fetch materials for spare parts
  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const res = await api.get('/master-data/materials');
      const data = res.data;
      if (Array.isArray(data)) return data;
      if (data?.data) return data.data;
      return [];
    }
  });

  if (!ticket) return null;

  const handleToggleLoto = async () => {
    await toggleLoto.mutateAsync({
      id: ticket.id,
      lotoApplied: !ticket.lotoApplied,
    });
  };

  const handleAddLog = async () => {
    if (!newLog.trim()) return;
    await addLog.mutateAsync({
      id: ticket.id,
      actionTaken: newLog,
      timeSpentHours: timeSpent,
    });
    setNewLog('');
    setTimeSpent(0);
  };

  const handleAddSparePart = async () => {
    if (!selectedMaterial || quantity <= 0) return;
    await addSparePart.mutateAsync({
      id: ticket.id,
      materialId: selectedMaterial,
      quantityConsumed: quantity,
    });
    setSelectedMaterial('');
    setQuantity(1);
  };

  const handleResolve = async () => {
    await updateTicket.mutateAsync({
      id: ticket.id,
      status: 'RESOLVED',
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {ticket && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[500px] bg-[#0A0A0C]/95 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] pointer-events-none rounded-full" />
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-zinc-400">{ticket.ticketNumber}</span>
                </div>
                <h2 className="text-xl font-bold text-white relative z-10">{ticket.machine?.machineName} Breakdown</h2>
                
                {/* Meta information */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                    ticket.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    ticket.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {ticket.priority} PRIORITY
                  </span>

                  {/* Project Link */}
                  {ticket.project && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> 
                      {ticket.project.projectNumber}
                    </span>
                  )}

                  {/* Category */}
                  {ticket.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                      {ticket.category}
                    </span>
                  )}

                  {/* Plant / Department (Master Data) */}
                  {ticket.machine?.plant && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 border border-white/10 flex items-center gap-1">
                      <Factory className="w-3 h-3" /> 
                      {ticket.machine.plant.plantName}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors relative z-10">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* LOTO Control */}
              <div className="spotlight-card p-6 rounded-xl border border-white/5 bg-[#111]">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${ticket.lotoApplied ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                      {ticket.lotoApplied ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Lockout / Tagout</h3>
                      <p className="text-sm text-zinc-400">
                        {ticket.lotoApplied ? 'Machine is isolated and locked.' : 'Machine is NOT locked out.'}
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleToggleLoto}
                  disabled={toggleLoto.isPending}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    ticket.lotoApplied 
                      ? 'bg-zinc-800 text-white hover:bg-zinc-700' 
                      : 'bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/30 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                  }`}
                >
                  {ticket.lotoApplied ? (
                    <>Remove LOTO Tag</>
                  ) : (
                    <><AlertTriangle className="w-4 h-4" /> Apply Digital LOTO</>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Issue Description</h3>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-zinc-300 text-sm leading-relaxed">
                    {ticket.issueDescription}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Reported By</p>
                    <p className="text-sm text-white font-medium">{ticket.reportedBy?.name || ticket.reportedBy?.email || ticket.reportedById}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Assigned To</p>
                    <p className="text-sm text-white font-medium">{ticket.assignedTo ? (ticket.assignedTo.name || ticket.assignedTo.email) : 'Unassigned'}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Ticket Created</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm text-white font-medium">{formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>
                  {ticket.downtimeStartedAt && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-semibold">Downtime Started</p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-white font-medium">{formatDate(ticket.downtimeStartedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Logs */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Maintenance Logs</h3>
                
                <div className="space-y-4 mb-6">
                  {ticket.logs?.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">No maintenance logs yet.</p>
                  ) : (
                    ticket.logs?.map((log: any) => (
                      <div key={log.id} className="relative pl-4 border-l-2 border-white/10">
                        <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[5px] top-1.5" />
                        <p className="text-sm text-white mb-1">{log.actionTaken}</p>
                        <div className="flex gap-4 text-xs text-zinc-500">
                          <span>{log.loggedBy?.name}</span>
                          <span>{formatDate(log.createdAt)}</span>
                          {log.timeSpentHours > 0 && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <Clock className="w-3 h-3" /> {log.timeSpentHours}h
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Log Form */}
                <div className="p-4 bg-[#111] rounded-xl border border-white/5 space-y-3">
                  <textarea 
                    value={newLog}
                    onChange={(e) => setNewLog(e.target.value)}
                    placeholder="Describe actions taken..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-zinc-500 focus:border-blue-500 outline-none h-24 resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <input 
                        type="number" 
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(Number(e.target.value))}
                        placeholder="Hours"
                        className="w-24 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <button 
                      onClick={handleAddLog}
                      disabled={!newLog.trim() || addLog.isPending}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" /> Log Activity
                    </button>
                  </div>
                </div>
              </div>

              {/* Spare Parts Section */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">Spare Parts Consumed</h3>
                <div className="space-y-4 mb-6">
                  {ticket.spareParts?.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">No spare parts consumed.</p>
                  ) : (
                    ticket.spareParts?.map((sp: any) => (
                      <div key={sp.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-zinc-400" />
                          <div>
                            <p className="text-sm text-white font-medium">{sp.material?.materialCode}</p>
                            <p className="text-xs text-zinc-500">Qty: {sp.quantityConsumed}</p>
                          </div>
                        </div>
                        <p className="text-sm font-mono text-emerald-400">
                          ${(sp.costAtTime * sp.quantityConsumed).toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-[#111] rounded-xl border border-white/5 flex flex-col gap-3">
                  <Combobox 
                    options={materials?.map((m: any) => ({ value: m.id, label: m.materialCode + ' - ' + m.description })) || []}
                    value={selectedMaterial}
                    onChange={setSelectedMaterial}
                    placeholder="Search Material..."
                  />
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-20 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500"
                      min="1"
                      placeholder="Qty"
                    />
                    <button 
                      onClick={handleAddSparePart}
                      disabled={!selectedMaterial || addSparePart.isPending}
                      className="flex-1 flex justify-center items-center p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" /> Add Part
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-black/40">
              
              {/* Financial Summary */}
              <div className="flex justify-between items-center mb-4 p-4 rounded-xl bg-zinc-900 border border-white/10">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Total Cost Incurred</span>
                <span className="text-lg font-mono text-emerald-400 font-bold">${Number(ticket.totalCost || 0).toFixed(2)}</span>
              </div>

              {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                <>
                <button 
                  onClick={handleResolve}
                  disabled={updateTicket.isPending || ticket.lotoApplied}
                  title={ticket.lotoApplied ? "Remove LOTO before resolving" : "Mark as Resolved"}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" /> Mark as Resolved
                </button>
                {ticket.lotoApplied && (
                  <p className="text-xs text-red-400 text-center mt-3 flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Remove LOTO before resolving ticket.
                  </p>
                )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
