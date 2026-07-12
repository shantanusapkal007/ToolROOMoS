'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AlertTriangle, IndianRupee, User } from 'lucide-react';

export default function ReceivablesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/finance/receivables')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Accounts Receivable</h2>
        <p className="text-zinc-400 mt-1">Outstanding invoices requiring customer payment.</p>
      </div>

      {/* Outstanding Summary */}
      {data && (
        <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-400/70 uppercase tracking-wider">Total Outstanding</div>
              <div className="text-3xl font-bold text-white mt-1">₹{data.totalOutstanding.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="text-zinc-500 text-sm">{data.invoiceCount} unpaid invoice{data.invoiceCount !== 1 ? 's' : ''}</div>
        </div>
      )}

      {/* Overdue Invoice List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-zinc-500 py-12">Fetching receivables...</div>
        ) : !data || data.invoices.length === 0 ? (
          <div className="text-center text-zinc-500 py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
            All invoices are settled. No outstanding receivables.
          </div>
        ) : (
          data.invoices.map((inv: any) => {
            const outstanding = Number(inv.totalAmount) - Number(inv.amountPaid);
            return (
              <div key={inv.id} className="bg-zinc-900/40 backdrop-blur-md border border-white/[0.08] rounded-2xl p-5 flex items-center justify-between hover:border-rose-500/20 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div>
                    <div className="text-white font-bold">{inv.invoiceNumber}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <User className="w-3 h-3 text-zinc-600" />
                      <span className="text-xs text-zinc-500">{inv.dispatchNote?.customer?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-rose-400 font-mono">₹{outstanding.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5">
                    of ₹{Number(inv.totalAmount).toLocaleString('en-IN')} total
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
