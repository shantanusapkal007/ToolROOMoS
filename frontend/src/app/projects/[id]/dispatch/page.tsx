"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { Truck } from "lucide-react";
import { useToast } from "../../../../components/ui/Toast";
import { useProject } from "../../../../hooks/useProjects";
import { useCreateDispatch } from "../../../../hooks/useDispatch";

export default function DispatchTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const { data: project, isLoading: projectLoading } = useProject(resolvedParams.id);
  const createDispatchMutation = useCreateDispatch(resolvedParams.id);
  const [showModal, setShowModal] = useState(false);
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



  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in flex flex-col h-full">
      <div className="glass-panel p-6 mb-6 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h2 className="text-h3 font-bold text-white flex items-center">
              <Truck className="h-6 w-6 mr-3 text-indigo-400" />
              Logistics & Dispatch
            </h2>
            <p className="text-slate-400 mt-1">Manage Packing Slips, Transporters, and Dispatch Notes.</p>
          </div>
          <button onClick={() => {
            setFormData({
              dispatchNumber: `DISP-${Date.now().toString().slice(-4)}`,
              dispatchQty: 1, transporterName: "", vehicleNumber: "", driverDetails: "", trackingReference: "", logisticsCost: 0, remarks: ""
            });
            setShowModal(true);
          }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all">
            Log Dispatch Note
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {project.dispatchNotes && project.dispatchNotes.length > 0 ? (
          <div className="space-y-4">
            {project.dispatchNotes.map((disp: any) => (
              <div key={disp.id} className="glass-panel p-5 border border-white/5 hover:border-indigo-500/30 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-lg font-bold text-white">{disp.dispatchNumber}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-400">
                        DISPATCHED
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 flex items-center space-x-4">
                      <span>Qty: <strong className="text-white">{disp.dispatchQty}</strong></span>
                      {disp.transporterName && (
                        <span>Transporter: <strong className="text-white">{disp.transporterName}</strong></span>
                      )}
                      {disp.vehicleNumber && (
                        <span>Vehicle: <strong className="text-white">{disp.vehicleNumber}</strong></span>
                      )}
                      {disp.driverDetails && (
                        <span>Driver: <strong className="text-white">{disp.driverDetails}</strong></span>
                      )}
                      {disp.trackingReference && (
                        <span>Tracking: <strong className="text-white">{disp.trackingReference}</strong></span>
                      )}
                    </div>
                    {disp.remarks && <div className="text-xs text-slate-500 mt-2">"{disp.remarks}"</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Logistics Cost</div>
                    <div className="text-indigo-400 font-bold font-mono">&#8377;{disp.logisticsCost}</div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(disp.dispatchDate).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel border border-dashed border-white/10 rounded-2xl">
            <Truck className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Dispatches Yet</h3>
            <p className="text-slate-400">Log a dispatch note when items are shipped out.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div className="glass-panel w-full max-w-lg p-8 animate-slide-up border border-indigo-500/20">
            <h2 className="text-h4 font-bold mb-6 text-white">Create Dispatch Note</h2>
            <form onSubmit={handleCreateDispatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dispatch Number</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50"
                    value={formData.dispatchNumber}
                    onChange={(e) => setFormData({...formData, dispatchNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50"
                    value={formData.dispatchQty}
                    onChange={(e) => setFormData({...formData, dispatchQty: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Transporter Name</label>
                  <input
                    type="text"
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50"
                    value={formData.transporterName}
                    onChange={(e) => setFormData({...formData, transporterName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Driver Details</label>
                  <input
                    type="text"
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50"
                    value={formData.driverDetails}
                    onChange={(e) => setFormData({...formData, driverDetails: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tracking Reference</label>
                  <input
                    type="text"
                    className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50"
                    value={formData.trackingReference}
                    onChange={(e) => setFormData({...formData, trackingReference: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Logistics Cost (&#8377;)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50"
                  value={formData.logisticsCost}
                  onChange={(e) => setFormData({...formData, logisticsCost: Number(e.target.value)})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Remarks</label>
                <input
                  type="text"
                  className="w-full bg-[#050A14] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50"
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                />
              </div>

              <div className="flex space-x-3 pt-4 shrink-0 border-t border-white/10 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium text-white transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all">Save Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
