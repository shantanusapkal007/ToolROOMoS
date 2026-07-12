'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Receipt, IndianRupee, CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function FinanceDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/finance/invoices')
      .then(res => setInvoices(res?.data?.data || res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
      case 'PARTIAL': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
      default: return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' };
    }
  };

  const totalRevenue = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
  const totalReceived = invoices.reduce((acc, inv) => acc + Number(inv.amountPaid || 0), 0);
  const totalOutstanding = totalRevenue - totalReceived;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Invoiced</span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">₹{totalRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Received</span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">₹{totalReceived.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Outstanding</span>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">₹{totalOutstanding.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Invoice Register</h2>
      </div>

      {/* Invoice Table */}
      <div className="bg-zinc-900/30 backdrop-blur-md border border-white/[0.06] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Invoice #</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Customer</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Subtotal</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">GST</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Total</th>
              <th className="text-right px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Paid</th>
              <th className="text-center px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-500">Loading invoices...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-zinc-500">No invoices generated yet.</td></tr>
            ) : (
              invoices.map(inv => {
                const colors = getStatusColor(inv.paymentStatus);
                return (
                  <tr key={inv.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-white font-bold">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-zinc-300">{inv.dispatchNote?.customer?.name || '—'}</td>
                    <td className="px-6 py-4 text-right text-zinc-400 font-mono">₹{Number(inv.subtotal).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right text-zinc-400 font-mono">₹{Number(inv.taxAmount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right text-white font-bold font-mono">₹{Number(inv.totalAmount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-mono">₹{Number(inv.amountPaid).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`${colors.bg} ${colors.text} border ${colors.border} px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1`}>
                        {inv.paymentStatus === 'PAID' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
