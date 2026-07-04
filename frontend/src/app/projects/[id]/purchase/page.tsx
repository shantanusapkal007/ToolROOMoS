"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { ShoppingCart } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";

import { useToast } from "../../../../components/ui/Toast";

export default function PurchaseTab({ params }: { params: Promise<{ id: string }> }) {
  const { error, success } = useToast();
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);
  const [showPoModal, setShowPoModal] = useState(false);
  const [poNum, setPoNum] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [poRate, setPoRate] = useState(5000);
  const [poQty, setPoQty] = useState(2);
  const [vendors, setVendors] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
    loadVendors();
    loadMaterials();
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
    } catch (err) { console.error(err); }
  };

  const loadVendors = async () => {
    const res = await api.get("master-data/vendors");
    setVendors(res.data || []);
    if (res.data?.length > 0) setSelectedVendorId(res.data[0].id);
  };
  const loadMaterials = async () => {
    const res = await api.get("master-data/materials");
    setMaterials(res.data || []);
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || materials.length === 0) return;
    try {
      await api.post(`projects/${project.id}/purchase-orders`, {
        vendorId: selectedVendorId,
        poNumber: poNum,
        items: [{ materialId: materials[0].id, orderedQty: poQty, agreedRate: poRate }]
      });
      setShowPoModal(false);
      success("PO Generated", `Purchase Order ${poNum} successfully created.`);
      loadProjectDetails(project.id);
    } catch (err: any) { error("Failed to Create PO", err.message); }
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
      <div className="glass-panel p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-h4 font-semibold text-white">Purchase & Procurement</h2>
            <p className="text-slate-400 mt-1">Manage Vendor POs, RFQs, and Material Sourcing.</p>
          </div>
          <button onClick={() => setShowPoModal(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium">Generate Vendor PO</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <ShoppingCart className="h-6 w-6 text-amber-400 mb-3" />
            <h3 className="font-semibold text-white">Purchase Orders</h3>
            <p className="text-sm text-slate-500 mt-1">{project.purchaseOrderHeaders?.length || 0} external orders</p>
          </div>
        </div>
      </div>

      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up">
            <h2 className="text-h4 font-bold mb-6 text-white">Create Purchase Order</h2>
            <form onSubmit={handleCreatePo} className="space-y-4">
              <Input
                label="PO Number"
                value={poNum}
                onChange={(e) => setPoNum(e.target.value)}
                required
              />
              <Select
                label="Vendor"
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                options={vendors.map(v => ({ label: v.name, value: v.id }))}
              />
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowPoModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-medium">Save PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
