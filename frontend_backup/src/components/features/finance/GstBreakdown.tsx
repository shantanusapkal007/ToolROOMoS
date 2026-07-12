import React from 'react';

interface GstBreakdownProps {
  subtotal: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  taxAmount: number;
  roundOff?: number;
  totalAmount: number;
}

export function GstBreakdown({
  subtotal,
  cgstAmount = 0,
  sgstAmount = 0,
  igstAmount = 0,
  taxAmount,
  roundOff = 0,
  totalAmount
}: GstBreakdownProps) {
  const formatCurrency = (val: number) => {
    return '₹ ' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex justify-end mt-6">
      <div className="w-72 glass-panel p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-zinc-400 font-medium">Subtotal</span>
          <span className="text-zinc-200 font-bold font-mono">{formatCurrency(subtotal)}</span>
        </div>
        
        {cgstAmount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400 font-medium">CGST</span>
            <span className="text-zinc-200 font-bold font-mono">{formatCurrency(cgstAmount)}</span>
          </div>
        )}
        
        {sgstAmount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400 font-medium">SGST</span>
            <span className="text-zinc-200 font-bold font-mono">{formatCurrency(sgstAmount)}</span>
          </div>
        )}

        {igstAmount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400 font-medium">IGST</span>
            <span className="text-zinc-200 font-bold font-mono">{formatCurrency(igstAmount)}</span>
          </div>
        )}

        {(cgstAmount === 0 && sgstAmount === 0 && igstAmount === 0) && taxAmount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400 font-medium">Total Tax</span>
            <span className="text-zinc-200 font-bold font-mono">{formatCurrency(taxAmount)}</span>
          </div>
        )}

        {roundOff !== 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400 font-medium">Round Off</span>
            <span className="text-zinc-200 font-bold font-mono">{formatCurrency(roundOff)}</span>
          </div>
        )}

        <div className="h-px bg-white/10 my-1" />

        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-white uppercase tracking-wider">Total</span>
          <span className="text-lg font-black text-emerald-400 font-mono">{formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
