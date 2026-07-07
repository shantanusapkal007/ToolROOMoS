"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { Truck, X, Info, Calendar, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { useToast } from "../../../../components/ui/Toast";
import { useProject } from "../../../../hooks/useProjects";
import { useCreateDispatch } from "../../../../hooks/useDispatch";

export default function DispatchTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const { data: project, isLoading: projectLoading } = useProject(resolvedParams.id);
  const createDispatchMutation = useCreateDispatch(resolvedParams.id);
  const [showModal, setShowModal] = useState(false);
  const [viewingDispatchDetails, setViewingDispatchDetails] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    dispatchNumber: `DISP-${Date.now().toString().slice(-4)}`,
    dispatchQty: 1,
    transporterName: "",
    vehicleNumber: "",
    driverDetails: "",
    trackingReference: "",
    logisticsCost: 0,
    remarks: ""
  });

  // React Query handles fetching

  if (projectLoading || !project) return null;

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      await createDispatchMutation.mutateAsync(formData);
      setShowModal(false);
    } catch (err: any) {}
  };

  const handleExportDispatch = (disp: any) => {
    if (!disp) return;
    
    const exportData = [{
      "Dispatch Number": disp.dispatchNumber,
      "Date": new Date(disp.dispatchDate).toLocaleDateString(),
      "Quantity": disp.dispatchQty,
      "Transporter Name": disp.transporterName || '-',
      "Vehicle Number": disp.vehicleNumber || '-',
      "Driver Details": disp.driverDetails || '-',
      "Tracking Reference": disp.trackingReference || '-',
      "Logistics Cost": disp.logisticsCost,
      "Remarks": disp.remarks || '-'
    }];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatch Note");
    
    XLSX.writeFile(wb, `Dispatch_${disp.dispatchNumber}.xlsx`);
  };



  return (
    <div className="flex-1 overflow-y-auto pb-12 animate-fade-in flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center shrink-0 mb-4 bg-white/[0.01] border border-white/5 rounded-xl p-3">
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mr-3 text-indigo-400">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Logistics & Dispatch</h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Packing Slips & Notes</p>
          </div>
        </div>
        <button onClick={() => {
            setFormData({
              dispatchNumber: `DISP-${Date.now().toString().slice(-4)}`,
              dispatchQty: 1, transporterName: "", vehicleNumber: "", driverDetails: "", trackingReference: "", logisticsCost: 0, remarks: ""
            });
            setShowModal(true);
        }} className="group relative px-4 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg transition-all duration-300 shadow-[0_0_10px_rgba(79,70,229,0.1)]">
            <span className="relative z-10 flex items-center text-indigo-400 font-bold text-xs">Log Dispatch</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar pr-2">
        {project.dispatchNotes && project.dispatchNotes.length > 0 ? (
          <div className="space-y-2">
            {project.dispatchNotes.map((disp: any) => (
              <div key={disp.id} className="bg-white/[0.01] p-4 rounded-xl flex justify-between items-start border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-indigo-500/20 transition-all opacity-0 group-hover:opacity-100" />
                <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-sm font-bold text-white">{disp.dispatchNumber}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        DISPATCHED
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-3 font-bold uppercase tracking-wider">
                      <span>QTY: <strong className="text-white font-mono">{disp.dispatchQty}</strong></span>
                      {disp.transporterName && (
                        <span className="border-l border-white/10 pl-3">TRANS: <strong className="text-white">{disp.transporterName}</strong></span>
                      )}
                      {disp.vehicleNumber && (
                        <span className="border-l border-white/10 pl-3">VEH: <strong className="text-white">{disp.vehicleNumber}</strong></span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center space-x-3 uppercase tracking-wider font-bold mt-1">
                      {disp.driverDetails && (
                        <span>DRIVER: {disp.driverDetails}</span>
                      )}
                      {disp.trackingReference && (
                        <span className="border-l border-white/10 pl-3 text-indigo-400/70">TRK: {disp.trackingReference}</span>
                      )}
                    </div>
                    {disp.remarks && <div className="text-[10px] text-slate-500 mt-2 font-mono">"{disp.remarks}"</div>}
                </div>
                <div className="text-right relative z-10 flex flex-col justify-between items-end">
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logistics Cost</div>
                        <div className="text-indigo-400 font-bold font-mono text-sm">&#8377;{disp.logisticsCost}</div>
                    </div>
                    <div className="mt-2">
                        <button
                          onClick={() => setViewingDispatchDetails(disp)}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded text-[10px] uppercase tracking-wider font-bold border border-white/10 transition-colors animate-fade-in"
                        >
                          Details
                        </button>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-2">{new Date(disp.dispatchDate).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed flex-1 flex flex-col items-center justify-center">
            <Truck className="h-8 w-8 text-slate-500 mx-auto mb-3 opacity-50" />
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">No dispatches logged.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-lg p-6 animate-slide-up border border-indigo-500/20 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none" />
            <h3 className="text-lg font-bold text-white mb-5 relative z-10 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-indigo-400" />
              Create Dispatch Note
            </h3>
            <form onSubmit={handleCreateDispatch} className="space-y-4 relative z-10 flex-1 min-h-0 flex flex-col overflow-y-auto hide-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Dispatch Number</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                    value={formData.dispatchNumber}
                    onChange={(e) => setFormData({...formData, dispatchNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 font-mono"
                    value={formData.dispatchQty}
                    onChange={(e) => setFormData({...formData, dispatchQty: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Transporter Name</label>
                  <input
                    type="text"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                    value={formData.transporterName}
                    onChange={(e) => setFormData({...formData, transporterName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Vehicle Number</label>
                  <input
                    type="text"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Driver Details</label>
                  <input
                    type="text"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                    value={formData.driverDetails}
                    onChange={(e) => setFormData({...formData, driverDetails: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tracking Reference</label>
                  <input
                    type="text"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                    value={formData.trackingReference}
                    onChange={(e) => setFormData({...formData, trackingReference: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Logistics Cost (&#8377;)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 font-mono"
                  value={formData.logisticsCost}
                  onChange={(e) => setFormData({...formData, logisticsCost: Number(e.target.value)})}
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Remarks</label>
                <input
                  type="text"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                />
              </div>

              <div className="flex space-x-3 pt-4 shrink-0 border-t border-white/10 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all">Save Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {viewingDispatchDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="glass-modal w-full max-w-md p-6 animate-slide-up border border-indigo-500/20 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[70px] -mr-24 -mt-24 pointer-events-none" />
            <div className="flex justify-between items-center pb-4 border-b border-white/10 shrink-0 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dispatch Note Details</h3>
                  <p className="text-[10px] text-slate-400">Logistics fulfillment record</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleExportDispatch(viewingDispatchDetails)}
                  className="flex items-center space-x-1.5 h-8 px-3 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 font-bold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <button onClick={() => setViewingDispatchDetails(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="py-6 space-y-4 text-xs relative z-10">
              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Dispatch Code:</span>
                  <span className="text-white font-bold font-mono">{viewingDispatchDetails.dispatchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date Dispatched:</span>
                  <span className="text-slate-300 font-mono">{new Date(viewingDispatchDetails.dispatchDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity Dispatched:</span>
                  <span className="text-slate-200 font-bold font-mono">{viewingDispatchDetails.dispatchQty} units</span>
                </div>
              </div>

              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                  <Info className="w-3.5 h-3.5 mr-1" /> Carrier Logistics
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Transporter:</span>
                  <span className="text-slate-300 font-bold">{viewingDispatchDetails.transporterName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vehicle Number:</span>
                  <span className="text-slate-300 font-mono">{viewingDispatchDetails.vehicleNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver details:</span>
                  <span className="text-slate-300">{viewingDispatchDetails.driverDetails || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tracking Reference:</span>
                  <span className="text-slate-300 font-mono">{viewingDispatchDetails.trackingReference || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3.5 bg-black/30 rounded-xl border border-white/5 space-y-2">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" /> Logistics Cost Summary
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Carrier Fare Charged:</span>
                  <span className="text-indigo-400 font-bold font-mono text-sm">&#8377;{Number(viewingDispatchDetails.logisticsCost).toLocaleString()}</span>
                </div>
                {viewingDispatchDetails.remarks && (
                  <div className="flex flex-col space-y-1 pt-1 border-t border-white/5 mt-1.5">
                    <span className="text-slate-500 font-bold text-[9px] uppercase tracking-widest">Remarks:</span>
                    <span className="text-slate-300 italic">"{viewingDispatchDetails.remarks}"</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 shrink-0 flex justify-end relative z-10">
              <button type="button" onClick={() => setViewingDispatchDetails(null)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
