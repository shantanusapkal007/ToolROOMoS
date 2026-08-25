"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, 
  X, 
  Send, 
  Layers, 
  Building2, 
  Package, 
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Boxes
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useMasterData } from '@/hooks/useMasterData';

export interface MaterialTransferRecord {
  id: string;
  transferDate: string;
  projectCode: string;
  partName: string;
  materialName?: string;
  batchNumber?: string;
  sourceSection: string;
  targetSection: string;
  quantity: number;
  transferReason: string;
  transferredBy: string;
  status: 'TRANSFERRED';
}

interface AvailableSectionStockItem {
  id: string;
  partName: string;
  materialName: string;
  batchNumber: string;
  totalIssued: number;
  transferredOut: number;
  transferredIn: number;
  availableQty: number;
  section: string;
}

interface InterSectionTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (record: MaterialTransferRecord) => void;
  defaultProjectCode?: string;
  materialIssues?: any[];
  existingTransfers?: MaterialTransferRecord[];
}

const SECTIONS = [
  { id: 'MACHINE_SHOP', label: 'Machine Shop' },
  { id: 'TOOL_ROOM_FITTING', label: 'Toolroom Fitting & Assembly' },
  { id: 'PRESS_SHOP', label: 'Press Shop & Tryout' },
  { id: 'FABRICATION_INDIAN', label: 'Fabrication (Domestic / India)' },
  { id: 'FABRICATION_EXPORT', label: 'Fabrication (Foreign / Export)' },
];

export function InterSectionTransferModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectCode = 'KTD-433',
  materialIssues = [],
  existingTransfers = []
}: InterSectionTransferModalProps) {
  const { success, error } = useToast();
  const { data: employees = [] } = useMasterData('employees');

  const [projectCode, setProjectCode] = useState(defaultProjectCode);
  const [sourceSection, setSourceSection] = useState('MACHINE_SHOP');
  const [targetSection, setTargetSection] = useState('TOOL_ROOM_FITTING');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [transferReason, setTransferReason] = useState('Transferred for progressive machining / assembly operations.');
  const [transferredBy, setTransferredBy] = useState('');

  useEffect(() => {
    setProjectCode(defaultProjectCode);
  }, [defaultProjectCode]);

  // Compute live available stock per section
  const availableStockInSource = useMemo(() => {
    // 1. Group base issued materials by item & section
    const stockMap = new Map<string, AvailableSectionStockItem>();

    materialIssues.forEach((issue: any) => {
      const sec = issue.section || 'MACHINE_SHOP';
      const key = `${issue.materialName}-${issue.batchNumber}-${sec}`;
      
      const current = stockMap.get(key) || {
        id: key,
        partName: issue.remarks && issue.remarks !== '-' ? issue.remarks : issue.materialName,
        materialName: issue.materialName || 'Raw Material',
        batchNumber: issue.batchNumber || '-',
        totalIssued: 0,
        transferredOut: 0,
        transferredIn: 0,
        availableQty: 0,
        section: sec,
      };

      current.totalIssued += Number(issue.issuedQty || 0);
      stockMap.set(key, current);
    });

    // 2. Adjust for past transfers (Direct movement)
    existingTransfers.forEach((trf) => {
      // Deduct from source
      const srcKey = `${trf.materialName || trf.partName}-${trf.batchNumber || '-'}-${trf.sourceSection}`;
      if (stockMap.has(srcKey)) {
        const item = stockMap.get(srcKey)!;
        item.transferredOut += Number(trf.quantity || 0);
      }

      // Add to target
      const tgtKey = `${trf.materialName || trf.partName}-${trf.batchNumber || '-'}-${trf.targetSection}`;
      const tgtItem = stockMap.get(tgtKey) || {
        id: tgtKey,
        partName: trf.partName,
        materialName: trf.materialName || trf.partName,
        batchNumber: trf.batchNumber || '-',
        totalIssued: 0,
        transferredOut: 0,
        transferredIn: 0,
        availableQty: 0,
        section: trf.targetSection,
      };
      tgtItem.transferredIn += Number(trf.quantity || 0);
      stockMap.set(tgtKey, tgtItem);
    });

    // Calculate final available qty
    const items = Array.from(stockMap.values()).map((item) => {
      const netQty = Math.max(0, item.totalIssued + item.transferredIn - item.transferredOut);
      return {
        ...item,
        availableQty: netQty,
      };
    });

    // Filter strictly for the currently selected source section with positive balance
    return items.filter((item) => item.section === sourceSection && item.availableQty > 0);
  }, [materialIssues, existingTransfers, sourceSection]);

  // Set default selected stock item when source section changes
  useEffect(() => {
    if (availableStockInSource.length > 0) {
      const first = availableStockInSource[0];
      setSelectedStockId(first.id);
      setQuantity(Math.min(1, first.availableQty));
    } else {
      setSelectedStockId('');
      setQuantity(0);
    }
  }, [sourceSection, availableStockInSource]);

  const selectedStockItem = availableStockInSource.find((s) => s.id === selectedStockId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceSection === targetSection) {
      error("Transfer Invalid", "Source and Target sections cannot be identical.");
      return;
    }

    if (!selectedStockItem) {
      error("No Material Selected", `No available material stock exists in ${sourceSection.replace(/_/g, ' ')} to transfer.`);
      return;
    }

    if (quantity <= 0) {
      error("Invalid Quantity", "Transfer quantity must be at least 1.");
      return;
    }

    if (quantity > selectedStockItem.availableQty) {
      error(
        "Insufficient Section Stock",
        `Cannot transfer ${quantity} units. Only ${selectedStockItem.availableQty} units of ${selectedStockItem.partName} are available in ${sourceSection.replace(/_/g, ' ')}.`
      );
      return;
    }

    const record: MaterialTransferRecord = {
      id: `TRF-${Date.now().toString().slice(-6)}`,
      transferDate: new Date().toISOString().split('T')[0],
      projectCode,
      partName: selectedStockItem.partName,
      materialName: selectedStockItem.materialName,
      batchNumber: selectedStockItem.batchNumber,
      sourceSection,
      targetSection,
      quantity,
      transferReason: transferReason || `Direct inter-section movement from ${sourceSection} to ${targetSection}`,
      transferredBy: transferredBy || 'Shift Supervisor',
      status: 'TRANSFERRED',
    };

    // Store in localStorage for persistence across daily reports & views
    try {
      const existing = JSON.parse(localStorage.getItem('toolroom_material_transfers') || '[]');
      localStorage.setItem('toolroom_material_transfers', JSON.stringify([record, ...existing]));
    } catch (err) {
      console.warn("Storage error:", err);
    }

    success(
      "Material Transferred Directly",
      `${quantity}x ${selectedStockItem.partName} moved from ${sourceSection.replace(/_/g, ' ')} to ${targetSection.replace(/_/g, ' ')}.`
    );

    if (onSuccess) onSuccess(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-border-gray rounded-[16px] w-full max-w-xl shadow-level-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-border-gray flex items-center justify-between bg-canvas shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-primary-subtle text-primary flex items-center justify-center font-semibold shadow-micro">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-ink">Inter-Section Material Transfer</h3>
              <p className="text-xs text-silver-blue mt-0.5">Move WIP material & machined parts directly between shopfloor departments</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] hover:bg-[rgba(148,151,169,0.12)] text-silver-blue hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs font-sans overflow-y-auto flex-1">
          
          {/* Transfer Route Card */}
          <div className="rounded-[12px] border border-border-gray bg-[rgba(148,151,169,0.03)] p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Transfer Workflow Route
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-primary-subtle text-primary border border-primary/20">
                <Layers className="w-3 h-3" />
                Project: {projectCode}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-cool-gray mb-1.5 uppercase tracking-wider">
                  Source Section (Sending)
                </label>
                <select
                  value={sourceSection}
                  onChange={(e) => setSourceSection(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border-gray rounded-[10px] text-xs font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro cursor-pointer"
                >
                  {SECTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-cool-gray mb-1.5 uppercase tracking-wider">
                  Target Section (Receiving)
                </label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-border-gray rounded-[10px] text-xs font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro cursor-pointer"
                >
                  {SECTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Material / Part Selection (Bounded to Source Section Stock) */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-cool-gray uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-primary" />
                Material / Component in {sourceSection.replace(/_/g, ' ')}
              </span>
              {selectedStockItem && (
                <span className="text-semantic-success-dark font-medium text-[11px] bg-semantic-success-subtle px-2 py-0.5 rounded-[6px]">
                  Available: {selectedStockItem.availableQty} pcs
                </span>
              )}
            </label>

            {availableStockInSource.length === 0 ? (
              <div className="p-4 rounded-[10px] bg-[rgba(245,158,11,0.06)] border border-semantic-warning/20 text-center space-y-1">
                <AlertCircle className="w-5 h-5 text-semantic-warning mx-auto" />
                <p className="font-semibold text-ink text-xs">No Material Stock in this Section</p>
                <p className="text-[11px] text-cool-gray">
                  No materials are currently issued to or present in <strong>{sourceSection.replace(/_/g, ' ')}</strong> for project {projectCode}.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedStockId}
                  onChange={(e) => {
                    setSelectedStockId(e.target.value);
                    const item = availableStockInSource.find(s => s.id === e.target.value);
                    if (item) setQuantity(Math.min(1, item.availableQty));
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-border-gray rounded-[10px] text-xs font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro cursor-pointer"
                >
                  {availableStockInSource.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.partName} ({stock.materialName}) — {stock.availableQty} available (Batch: {stock.batchNumber})
                    </option>
                  ))}
                </select>

                {selectedStockItem && (
                  <div className="p-3 rounded-[10px] bg-[rgba(148,151,169,0.04)] border border-border-gray flex flex-wrap items-center justify-between gap-2 text-[11px] text-cool-gray font-mono">
                    <span>Batch: <strong className="text-ink">{selectedStockItem.batchNumber}</strong></span>
                    <span>Current WIP in Section: <strong className="text-primary">{selectedStockItem.availableQty} pcs</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity & Transferred By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-cool-gray mb-1.5 uppercase tracking-wider">
                Transfer Quantity (Max: {selectedStockItem?.availableQty || 0} pcs)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={selectedStockItem ? selectedStockItem.availableQty : 1}
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                  disabled={!selectedStockItem}
                  className="w-full px-3.5 py-2.5 bg-white border border-border-gray rounded-[10px] font-mono font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro disabled:opacity-50"
                  required
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-silver-blue text-xs">
                  pcs
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-cool-gray mb-1.5 uppercase tracking-wider">
                Authorized / Transferred By
              </label>
              <select
                value={transferredBy}
                onChange={(e) => setTransferredBy(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-border-gray rounded-[10px] text-xs font-semibold text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro cursor-pointer"
              >
                <option value="">Select Supervisor / Toolmaker...</option>
                {employees?.map((emp: any) => {
                  const displayName = emp.name || emp.employeeName || emp.code;
                  return (
                    <option key={emp.id} value={displayName}>
                      {displayName} {emp.designation ? `(${emp.designation})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Transfer Reason & Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-cool-gray mb-1.5 uppercase tracking-wider">
              Transfer Reason & Notes
            </label>
            <textarea
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Completed rough milling, sending to assembly bench for fitting..."
              className="w-full px-3.5 py-2.5 bg-white border border-border-gray rounded-[10px] text-xs text-ink placeholder:text-silver-blue focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-micro"
            />
          </div>

          {/* Direct Handover Summary Alert */}
          {selectedStockItem && quantity > 0 && (
            <div className="p-3 rounded-[10px] bg-primary-subtle border border-primary/20 flex items-center justify-between text-xs text-primary">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                Direct Transfer: {quantity}x {selectedStockItem.partName} will move directly to {targetSection.replace(/_/g, ' ')}
              </span>
              <span className="font-semibold font-mono">
                Remaining in {sourceSection.replace(/_/g, ' ')}: {selectedStockItem.availableQty - quantity}
              </span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border-gray">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[10px] text-xs font-semibold text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)] transition-all cursor-pointer shadow-micro"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedStockItem || quantity <= 0 || quantity > (selectedStockItem?.availableQty || 0)}
              className="px-5 py-2.5 rounded-[10px] text-xs font-semibold bg-primary hover:bg-primary-hover active:bg-primary-deep active:scale-[0.98] text-white shadow-subtle flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Direct Transfer to {targetSection.replace(/_/g, ' ')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
