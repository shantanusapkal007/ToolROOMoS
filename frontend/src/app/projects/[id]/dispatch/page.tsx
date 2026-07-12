"use client";

import React, { useState } from 'react';
import { Truck, Plus } from "lucide-react";
import { SmartTable } from "@/components/ui/SmartTable";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useProject } from "@/hooks/useProjects";
import { useCreateDispatch } from "@/hooks/useDispatch";
import { formatDate } from "@/lib/formatters";

export default function DispatchTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const projectId = resolvedParams.id;
  
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const createDispatchMutation = useCreateDispatch(projectId);
  
  const [drawerMode, setDrawerMode] = useState<string | null>(null);
  
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

  if (projectLoading || !project) return null;

  const dispatches = project.dispatchNotes || [];

  const handleCreateDispatch = async () => {
    try {
      await createDispatchMutation.mutateAsync(formData);
      setDrawerMode(null);
      success("Dispatch Created", `Dispatch note ${formData.dispatchNumber} logged successfully`);
    } catch (err: any) {}
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Truck className="w-5 h-5 mr-2 text-indigo-400" /> Logistics & Dispatch
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage packing slips, dispatch notes, and transport details</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setFormData({
                dispatchNumber: `DISP-${Date.now().toString().slice(-4)}`,
                dispatchQty: 1, transporterName: "", vehicleNumber: "", driverDetails: "", trackingReference: "", logisticsCost: 0, remarks: ""
              });
              setDrawerMode('CREATE');
            }} 
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" /> Log Dispatch
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl">
        <SmartTable 
          data={dispatches}
          isLoading={false}
          columns={[
            { key: 'dispatchNumber', label: 'Dispatch No' },
            { key: 'dispatchDate', label: 'Date', render: (val) => formatDate(val) },
            { key: 'dispatchQty', label: 'Quantity' },
            { key: 'transporterName', label: 'Transporter' },
            { key: 'vehicleNumber', label: 'Vehicle No' },
            { key: 'trackingReference', label: 'Tracking Ref' }
          ]}
        />
      </div>

      <PremiumDrawer
        isOpen={drawerMode === 'CREATE'}
        onClose={() => setDrawerMode(null)}
        title="Log Dispatch"
        subtitle="Record outbound shipments and transporter details"
      >
        <div className="space-y-4 p-1">
          <Input label="Dispatch Number" value={formData.dispatchNumber} onChange={e => setFormData({...formData, dispatchNumber: e.target.value})} />
          <Input label="Dispatch Qty" type="number" value={formData.dispatchQty} onChange={e => setFormData({...formData, dispatchQty: Number(e.target.value)})} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Transporter Name" value={formData.transporterName} onChange={e => setFormData({...formData, transporterName: e.target.value})} />
            <Input label="Vehicle Number" value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} />
          </div>
          
          <Input label="Driver Details" value={formData.driverDetails} onChange={e => setFormData({...formData, driverDetails: e.target.value})} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tracking Reference" value={formData.trackingReference} onChange={e => setFormData({...formData, trackingReference: e.target.value})} />
            <Input label="Logistics Cost" type="number" value={formData.logisticsCost} onChange={e => setFormData({...formData, logisticsCost: Number(e.target.value)})} />
          </div>
          
          <Input label="Remarks" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
          
          <div className="pt-6">
            <button onClick={handleCreateDispatch} className="w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.2),_inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-xl text-indigo-300 hover:text-white font-bold text-sm transition-all">
              Submit Dispatch Note
            </button>
          </div>
        </div>
      </PremiumDrawer>
    </div>
  );
}
