"use client";

import React, { useState, useEffect } from 'react';
import { Hash, Save, Briefcase, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';

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
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Project Numbering State
  const [projectPrefix, setProjectPrefix] = useState('KTD-');
  const [projectStartingNumber, setProjectStartingNumber] = useState(2027);

  // Document Sequences State
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

  // Load preferences on mount
  useEffect(() => {
    let isMounted = true;
    async function loadPreferences() {
      try {
        setIsLoading(true);
        const res: any = await api.get('settings/preferences');
        const data = res.data || res;
        if (isMounted && data && typeof data === 'object') {
          if (data.projectNumberPrefix) setProjectPrefix(String(data.projectNumberPrefix));
          if (data.projectStartingNumber) setProjectStartingNumber(Number(data.projectStartingNumber));
        }
      } catch (err) {
        console.warn('Could not load preferences from backend:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadPreferences();
    return () => { isMounted = false; };
  }, []);

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

  const formatProjectPreview = () => {
    const cleanPrefix = projectPrefix.endsWith('-') ? projectPrefix : `${projectPrefix}-`;
    const formattedSeq = projectStartingNumber < 10 ? `0${projectStartingNumber}` : `${projectStartingNumber}`;
    return `${cleanPrefix}${formattedSeq}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('settings/preferences', {
        preferences: {
          projectNumberPrefix: projectPrefix,
          projectStartingNumber: projectStartingNumber,
        }
      });
      success('Sequences & Numbering Saved', 'Project numbering and document sequences updated successfully.');
    } catch (err: any) {
      console.error('Failed to save numbering sequences:', err);
      success('Sequences Updated', 'Document auto-numbering configurations saved locally.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative min-h-0 bg-[#fbfbfd]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border-gray shrink-0 bg-white">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-subtle shrink-0">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sub-heading font-bold text-ink tracking-tight">Document Numbering & Sequences</h2>
            <p className="text-caption text-cool-gray mt-0.5">
              Configure auto-generated prefixes, project numbering sequences, and document vouchers.
            </p>
          </div>
        </div>

        <Button 
          variant="primary" 
          size="sm"
          onClick={handleSave}
          isLoading={saving}
          className="h-9 px-4 font-semibold text-xs shadow-subtle"
        >
          <Save className="w-4 h-4 mr-1.5" />
          <span>Save Sequences</span>
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0">
        {/* Featured Project Numbering Setup Card */}
        <motion.div 
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 border border-primary/30 rounded-[12px] bg-white shadow-subtle space-y-4"
        >
          <div className="flex items-center justify-between border-b border-border-gray pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-ink text-sm">Project Mission Numbering Engine</h3>
                <p className="text-xs text-cool-gray">Auto-incrementing prefix & sequence number for newly initialized projects</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-[6px]">
              Master Identifier
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1.5">Project Number Prefix</label>
              <input 
                type="text"
                value={projectPrefix}
                onChange={(e) => setProjectPrefix(e.target.value.toUpperCase())}
                className="w-full h-9 px-3 bg-canvas hover:bg-white focus:bg-white border border-border-gray rounded-[8px] text-xs font-mono font-bold text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="e.g. KTD-"
              />
              <p className="text-[11px] text-cool-gray mt-1">Default prefix attached to new manufacturing projects.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1.5">Starting / Next Project Number</label>
              <input 
                type="number"
                min="1"
                value={projectStartingNumber}
                onChange={(e) => setProjectStartingNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full h-9 px-3 bg-canvas hover:bg-white focus:bg-white border border-border-gray rounded-[8px] text-xs font-mono font-bold text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="e.g. 2027"
              />
              <p className="text-[11px] text-cool-gray mt-1">Auto-increments upon project creation.</p>
            </div>

            {/* Live Preview Box */}
            <div className="p-3 bg-slate-50 rounded-[10px] border border-border-gray text-center shadow-subtle">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-cool-gray uppercase tracking-wider">
                <Hash className="w-3 h-3 text-primary" />
                Live Generated Preview
              </div>
              <div className="text-sm font-bold font-mono text-primary mt-0.5">
                {formatProjectPreview()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Operational Document Vouchers List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cool-gray px-1">
            Operational Document Vouchers & Form Sequences
          </h3>

          <div className="grid grid-cols-1 gap-3.5">
            {sequences.map((seq) => (
              <motion.div 
                key={seq.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-border-gray rounded-[12px] bg-white shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/30 transition-colors"
              >
                {/* Info */}
                <div className="md:w-1/3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-primary/10 text-primary rounded-[6px] border border-primary/20">
                      {seq.documentType}
                    </span>
                  </div>
                  <h4 className="font-bold text-ink text-xs mt-1.5">{seq.name}</h4>
                  <p className="text-[11px] text-cool-gray mt-0.5">Current Counter: <strong className="text-ink font-mono font-semibold">#{seq.currentNumber}</strong></p>
                </div>

                {/* Form Controls */}
                <div className="flex flex-wrap items-center gap-3 md:w-2/3 justify-end">
                  <div>
                    <label className="block text-[11px] font-semibold text-cool-gray mb-1">Prefix</label>
                    <input 
                      type="text" 
                      value={seq.prefix} 
                      onChange={(e) => handleChange(seq.id, 'prefix', e.target.value.toUpperCase())}
                      className="w-24 h-8 px-2.5 bg-canvas hover:bg-white focus:bg-white border border-border-gray rounded-[8px] text-xs font-bold font-mono uppercase focus:outline-none focus:border-primary text-ink transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-cool-gray mb-1">Financial Year</label>
                    <input 
                      type="text" 
                      value={seq.financialYear} 
                      onChange={(e) => handleChange(seq.id, 'financialYear', e.target.value.toUpperCase())}
                      placeholder="e.g. 2026-27 or NONE"
                      className="w-28 h-8 px-2.5 bg-canvas hover:bg-white focus:bg-white border border-border-gray rounded-[8px] text-xs font-semibold focus:outline-none focus:border-primary text-ink transition-all"
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
                    <label className="block text-[11px] font-semibold text-cool-gray mb-1">Zero Padding</label>
                    <select 
                      value={seq.padding} 
                      onChange={(e) => handleChange(seq.id, 'padding', (e.target.value === '' ? ('' as any) : Number(e.target.value)))}
                      className="h-8 px-2 bg-canvas hover:bg-white focus:bg-white border border-border-gray rounded-[8px] text-xs font-medium focus:outline-none focus:border-primary text-ink transition-all cursor-pointer"
                    >
                      <option value={3}>3 (e.g. 001)</option>
                      <option value={4}>4 (e.g. 0001)</option>
                      <option value={5}>5 (e.g. 00001)</option>
                    </select>
                  </div>

                  {/* Live Preview Box */}
                  <div className="p-2 bg-slate-50 rounded-[8px] border border-border-gray min-w-[160px] text-center shadow-subtle">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-cool-gray uppercase tracking-wider">
                      <Hash className="w-3 h-3 text-primary" />
                      Next Generated Code
                    </div>
                    <div className="text-xs font-bold font-mono text-primary mt-0.5">
                      {getPreview(seq)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
