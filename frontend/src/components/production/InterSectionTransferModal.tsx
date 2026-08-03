"use client";

import React, { useState } from 'react';
import { 
  RefreshCw, 
  X, 
  Check, 
  Send, 
  Layers, 
  Building2, 
  Package, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../ui/Toast';

export interface MaterialTransferRecord {
  id: string;
  transferDate: string;
  projectCode: string;
  partName: string;
  sourceSection: string;
  targetSection: string;
  quantity: number;
  transferReason: string;
  transferredBy: string;
  status: 'TRANSFERRED' | 'RECEIVED';
}

interface InterSectionTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (record: MaterialTransferRecord) => void;
  defaultProjectCode?: string;
}

const SECTIONS = [
  { id: 'TOOL_ROOM_FITTING', label: 'Toolroom Production (Fitting/Assembly)' },
  { id: 'MACHINE_SHOP', label: 'Toolroom Machine Shop' },
  { id: 'PRESS_SHOP', label: 'Press Shop & Stamping Tryout' },
  { id: 'FABRICATION_INDIAN', label: 'Fabrication (Domestic / Sheet Metal)' },
  { id: 'FABRICATION_EXPORT', label: 'Fabrication Export (Sea-Worthy)' },
];

export function InterSectionTransferModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectCode = 'KTD-322'
}: InterSectionTransferModalProps) {
  const { success, error } = useToast();
  const [projectCode, setProjectCode] = useState(defaultProjectCode);
  const [partName, setPartName] = useState('');
  const [sourceSection, setSourceSection] = useState('TOOL_ROOM_FITTING');
  const [targetSection, setTargetSection] = useState('FABRICATION_INDIAN');
  const [quantity, setQuantity] = useState(1);
  const [transferReason, setTransferReason] = useState('Transferred from Toolroom for structural frame welding & sub-assembly.');
  const [transferredBy, setTransferredBy] = useState('Lead Toolmaker');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) {
      error("Field Required", "Please specify the part / component name being transferred.");
      return;
    }

    if (sourceSection === targetSection) {
      error("Transfer Invalid", "Source and Target sections cannot be identical.");
      return;
    }

    const record: MaterialTransferRecord = {
      id: `TRF-${Date.now().toString().slice(-6)}`,
      transferDate: new Date().toISOString().split('T')[0],
      projectCode,
      partName,
      sourceSection,
      targetSection,
      quantity,
      transferReason,
      transferredBy,
      status: 'TRANSFERRED',
    };

    // Store in localStorage for persistent inter-section log state across daily reports
    try {
      const existing = JSON.parse(localStorage.getItem('toolroom_material_transfers') || '[]');
      localStorage.setItem('toolroom_material_transfers', JSON.stringify([record, ...existing]));
    } catch (err) {
      console.warn("Storage error:", err);
    }

    success("Material Transferred", `${quantity}x ${partName} transferred from ${sourceSection} to ${targetSection}`);
    if (onSuccess) onSuccess(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-slate-800 flex items-center justify-between bg-zinc-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold shadow-xs">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-950 dark:text-white">Inter-Section Material Transfer</h3>
              <p className="text-xs text-zinc-500">Transfer machined parts / assemblies between Toolroom, Press Shop & Fabrication</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-slate-800 text-zinc-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-sans">
          
          {/* Project & Part Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Tool Project Code
              </label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="e.g. KTD-322"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl font-mono font-bold text-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-zinc-900/10"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Part / Sub-Assembly Name
              </label>
              <input
                type="text"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g. Die Plate #4 / Base Frame"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl font-semibold text-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-zinc-900/10"
                required
              />
            </div>
          </div>

          {/* Source Section -> Target Section */}
          <div className="bg-zinc-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-zinc-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              <span>Transfer Workflow Route</span>
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 dark:text-slate-400 mb-1">
                  Source Section (Sending)
                </label>
                <select
                  value={sourceSection}
                  onChange={(e) => setSourceSection(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-lg text-xs font-bold text-zinc-950 dark:text-white outline-none"
                >
                  {SECTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-600 dark:text-slate-400 mb-1">
                  Target Section (Receiving)
                </label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-lg text-xs font-bold text-zinc-950 dark:text-white outline-none"
                >
                  {SECTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quantity & Transferred By */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Quantity (Units)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl font-mono font-bold text-zinc-950 dark:text-white outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Transferred By (Engineer / Supervisor)
              </label>
              <input
                type="text"
                value={transferredBy}
                onChange={(e) => setTransferredBy(e.target.value)}
                placeholder="e.g. Shift Supervisor"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl font-semibold text-zinc-950 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Reason / Notes */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              Transfer Reason & Specifications
            </label>
            <textarea
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Provide reason or specs for inter-section transfer..."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl text-xs text-zinc-900 dark:text-white outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Confirm Material Transfer</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
