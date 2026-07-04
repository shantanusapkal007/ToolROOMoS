"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { Package, Factory } from "lucide-react";
import { Input } from "../../../../components/ui/Input";
import { useToast } from "../../../../components/ui/Toast";

export default function InventoryTab({ params }: { params: Promise<{ id: string }> }) {
  const { success, error } = useToast();
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);
  
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [grnNum, setGrnNum] = useState("");
  const [grnHeatNum, setGrnHeatNum] = useState("HEAT-2026-X");

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreateGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      const poRes = await api.get(`projects/${project.id}/purchase-orders`);
      if (!poRes.data || poRes.data.length === 0) return error("No Active PO", "A purchase order is required before generating a GRN.");
      const activePo = poRes.data[0];
      await api.post(`projects/${project.id}/goods-receipts`, {
        poHeaderId: activePo.id,
        grnNumber: grnNum,
        items: [{
          poItemId: activePo.items[0].id,
          receivedQty: activePo.items[0].orderedQty,
          acceptedQty: activePo.items[0].orderedQty,
          actualRate: activePo.items[0].agreedRate,
          heatNumber: grnHeatNum,
        }]
      });
      setShowGrnModal(false);
      success("GRN Created", `Material received successfully under ${grnNum}.`);
      loadProjectDetails(project.id);
    } catch (err: any) { error("Failed", err.message); }
  };

  const handleIssueMaterial = async () => {
    if (!project) return;
    try {
      const grnRes = await api.get(`projects/${project.id}/goods-receipts`);
      if (!grnRes.data || grnRes.data.length === 0) return error("No Material", "No received material available to issue.");
      await api.post(`projects/${project.id}/material-issues`, {
        issueNumber: `ISS-${Date.now().toString().slice(-4)}`,
        items: [{ inventoryBatchId: grnRes.data[0].items[0].inventoryBatchId || "temp-batch", issuedQty: grnRes.data[0].items[0].acceptedQty }]
      });
      success("Material Issued", "Successfully issued material to floor.");
      loadProjectDetails(project.id);
    } catch (err: any) { error("Issue Failed", err.message); }
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
      <div className="glass-panel p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-h4 font-semibold text-white">Inventory & Shop Floor</h2>
            <p className="text-slate-400 mt-1">Manage Goods Receipts (GRN) and Material Issues.</p>
          </div>
          <div className="space-x-3">
            <button onClick={() => setShowGrnModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium">Receive Material (GRN)</button>
            <button onClick={handleIssueMaterial} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium">Issue to Floor</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <Package className="h-6 w-6 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-white">Goods Receipts (GRN)</h3>
            <p className="text-sm text-slate-500 mt-1">{project.goodsReceiptHeaders?.length || 0} receipts</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <Factory className="h-6 w-6 text-purple-400 mb-3" />
            <h3 className="font-semibold text-white">Material Issues</h3>
            <p className="text-sm text-slate-500 mt-1">{project.materialIssueHeaders?.length || 0} issues to floor</p>
          </div>
        </div>

        {/* Live Inventory Upload / Transactions */}
        <div className="border-t border-white/10 pt-8 mt-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Live Inventory Ledger</h3>
          <div className="bg-[#050A14]/80 border border-white/5 rounded-2xl overflow-hidden shadow-inner">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/40">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Material / Batch</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reference Doc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {project.inventoryTransactions?.length > 0 ? (
                  project.inventoryTransactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-slate-300 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString()}
                        <div className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${
                          tx.movementType === 'GRN_RECEIPT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {tx.movementType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-medium">{tx.inventoryBatch?.material?.materialCode}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{tx.inventoryBatch?.batchNumber}</p>
                      </td>
                      <td className="p-4 font-black text-white">
                        {tx.movementType === 'GRN_RECEIPT' ? '+' : '-'}{tx.quantity}
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300 font-mono text-xs">{tx.referenceDocType}</span>
                        <div className="text-xs text-slate-500 mt-0.5">{tx.remarks || '-'}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                      No inventory movements recorded yet. Generate a GRN to automatically upload material to stock.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showGrnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up">
            <h2 className="text-h4 font-bold mb-2 text-white">Receive Material</h2>
            <form onSubmit={handleCreateGrn} className="space-y-4">
              <Input
                label="GRN Number"
                type="text"
                value={grnNum}
                onChange={(e) => setGrnNum(e.target.value)}
                required
              />
              <Input
                label="Heat / Batch Number"
                type="text"
                value={grnHeatNum}
                onChange={(e) => setGrnHeatNum(e.target.value)}
                required
              />
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowGrnModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-medium">Receive (GRN)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
