"use client";

import React, { useState, useEffect } from 'react';
import { api } from "../../../../lib/api";
import { DollarSign } from "lucide-react";
import { Input } from "../../../../components/ui/Input";

export default function FinanceTab({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [project, setProject] = useState<any | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invNum, setInvNum] = useState("");
  const [invAmount, setInvAmount] = useState(45000);

  useEffect(() => {
    loadProjectDetails(resolvedParams.id);
  }, [resolvedParams.id]);

  const loadProjectDetails = async (projectId: string) => {
    try {
      const res = await api.get(`projects/${projectId}`);
      setProject(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      const dispRes = await api.get(`projects/${project.id}/dispatches`);
      if (!dispRes.data || dispRes.data.length === 0) return alert("No dispatch note found.");
      await api.post(`projects/${project.id}/invoices`, {
        dispatchNoteId: dispRes.data[0].id,
        invoiceNumber: invNum,
        subtotal: invAmount,
        taxAmount: invAmount * 0.18,
        totalAmount: invAmount * 1.18,
      });
      setShowInvoiceModal(false);
      loadProjectDetails(project.id);
    } catch (err: any) { alert(err.message); }
  };

  if (!project) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-32 animate-fade-in">
      <div className="glass-panel p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-h4 font-semibold text-white">Finance & Billing</h2>
            <p className="text-slate-400 mt-1">Manage Invoices and Cost Analysis.</p>
          </div>
          <button onClick={() => setShowInvoiceModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium">Generate Tax Invoice</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <DollarSign className="h-6 w-6 text-green-400 mb-3" />
            <h3 className="font-semibold text-white">Invoices</h3>
            <p className="text-sm text-slate-500 mt-1">{project.invoiceHeaders?.length || 0} invoices generated</p>
          </div>
        </div>
      </div>

      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-md p-8 animate-slide-up">
            <h2 className="text-h4 font-bold mb-6 text-white">Create Tax Invoice</h2>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <Input
                label="Invoice Number"
                type="text"
                value={invNum}
                onChange={(e) => setInvNum(e.target.value)}
                required
              />
              <Input
                label="Subtotal Amount"
                type="number"
                value={invAmount}
                onChange={(e) => setInvAmount(Number(e.target.value))}
                required
              />
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 font-medium">Save Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
