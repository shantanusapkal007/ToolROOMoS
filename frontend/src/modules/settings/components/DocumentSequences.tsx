"use client";

import React, { useState } from 'react';
import { Hash, Save, Check, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { motion } from 'framer-motion';

interface SequenceConfig {
  id: string;
  documentType: string;
  name: string;
  prefix: string;
  financialYear: string;
  padding: number;
  currentNumber: number;
}

export const DocumentSequences: React.FC = () => {
  const { success } = useToast();
  const [saving, setSaving] = useState(false);

  const [sequences, setSequences] = useState<SequenceConfig[]>([
    { id: '1', documentType: 'PURCHASE_ORDER', name: 'Purchase Order', prefix: 'PO', financialYear: '2026-27', padding: 4, currentNumber: 104 },
    { id: '2', documentType: 'GOODS_RECEIPT', name: 'Goods Receipt Note (GRN)', prefix: 'GRN', financialYear: '2026-27', padding: 4, currentNumber: 88 },
    { id: '3', documentType: 'MATERIAL_ISSUE', name: 'Material Store Issue', prefix: 'MI', financialYear: '2026-27', padding: 4, currentNumber: 215 },
    { id: '4', documentType: 'JOB_CARD', name: 'Shop Floor Job Card', prefix: 'JC', financialYear: '2026-27', padding: 4, currentNumber: 512 },
    { id: '5', documentType: 'INVOICE', name: 'Sales Tax Invoice', prefix: 'INV', financialYear: '2026-27', padding: 5, currentNumber: 62 },
    { id: '6', documentType: 'MAINTENANCE_TICKET', name: 'Machine Maintenance Ticket', prefix: 'MNT', financialYear: '2026-27', padding: 4, currentNumber: 34 },
    { id: '7', documentType: 'SUBCONTRACT_ORDER', name: 'Outsource Work Order', prefix: 'SCO', financialYear: '2026-27', padding: 4, currentNumber: 19 },
    { id: '8', documentType: 'NCR_REPORT', name: 'Non-Conformance Report (NCR)', prefix: 'NCR', financialYear: '2026-27', padding: 4, currentNumber: 7 },
  ]);

  const handleChange = (id: string, field: keyof SequenceConfig, value: any) => {
    setSequences(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const getPreview = (seq: SequenceConfig) => {
    const padded = String(seq.currentNumber + 1).padStart(seq.padding, '0');
    if (seq.financialYear && seq.financialYear !== 'NONE') {
      return `${seq.prefix}-${seq.financialYear}-${padded}`;
    }
    return `${seq.prefix}-${padded}`;
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      success('Sequences Updated', 'Document auto-numbering configurations saved.');
    }, 800);
  };

  return (
    <div className="h-full flex flex-col relative">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-black/10 shrink-0 bg-black/5">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mr-4 border border-blue-200 shadow-sm">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Document Numbering & Sequences</h2>
            <p className="text-sm text-zinc-500">Configure auto-generated prefixes, financial year patterns, and zero-padding.</p>
          </div>
        </div>

        <Button 
          variant="primary" 
          leftIcon={<Save className="w-4 h-4" />} 
          onClick={handleSave}
          isLoading={saving}
          className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] border border-blue-500/40 shadow-[0_1px_3px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.2)]"
        >
          Save Sequences
        </Button>
      </div>

      {/* List / Table */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
        <div className="grid grid-cols-1 gap-4">
          {sequences.map((seq) => (
            <motion.div 
              key={seq.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5 border border-white/80 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Info */}
              <div className="md:w-1/3">
                <span className="text-xs font-bold font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  {seq.documentType}
                </span>
                <h3 className="font-semibold text-zinc-900 text-base mt-1">{seq.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Current Counter: <strong className="text-zinc-800 font-mono">#{seq.currentNumber}</strong></p>
              </div>

              {/* Form Controls */}
              <div className="flex flex-wrap items-center gap-3 md:w-2/3 justify-end">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Prefix</label>
                  <input 
                    type="text" 
                    value={seq.prefix} 
                    onChange={(e) => handleChange(seq.id, 'prefix', e.target.value.toUpperCase())}
                    className="w-24 px-3 py-1.5 bg-white/70 border border-black/10 rounded-xl text-sm font-bold font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Financial Year</label>
                  <input 
                    type="text"
                    value={seq.financialYear} 
                    onChange={(e) => handleChange(seq.id, 'financialYear', e.target.value.toUpperCase())}
                    placeholder="e.g. 2026-27 or NONE"
                    className="w-28 px-3 py-1.5 bg-white/70 border border-black/10 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    list={`fy-list-${seq.id}`}
                  />
                  <datalist id={`fy-list-${seq.id}`}>
                    <option value="2024-25" />
                    <option value="2025-26" />
                    <option value="2026-27" />
                    <option value="2027-28" />
                    <option value="2028-29" />
                    <option value="NONE" />
                  </datalist>
                </div>


                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Zero Padding</label>
                  <select 
                    value={seq.padding} 
                    onChange={(e) => handleChange(seq.id, 'padding', (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                    className="px-3 py-1.5 bg-white/70 border border-black/10 rounded-xl text-sm font-medium focus:outline-none"
                  >
                    <option value={3}>3 (e.g. 001)</option>
                    <option value={4}>4 (e.g. 0001)</option>
                    <option value={5}>5 (e.g. 00001)</option>
                  </select>
                </div>

                {/* Live Preview Box */}
                <div className="p-2.5 bg-zinc-900/5 rounded-xl border border-black/5 min-w-[160px] text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-zinc-400 uppercase">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Next Generated ID
                  </div>
                  <div className="text-sm font-bold font-mono text-blue-600 mt-0.5">
                    {getPreview(seq)}
                  </div>
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
};
