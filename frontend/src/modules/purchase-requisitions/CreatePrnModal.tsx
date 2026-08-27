"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Layers, AlertCircle, Building, Calendar, User } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useMasterData } from '@/hooks/useMasterData';
import { PurchaseRequisitionsService } from '@/services/purchase-requisitions.service';
import { useToast } from '@/components/ui/Toast';

interface CreatePrnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProjectId?: string;
}

interface FormItem {
  id: string;
  materialId?: string;
  itemCode?: string;
  itemName: string;
  materialGrade: string;
  dimensions: string;
  requiredQuantity: number;
  uom: string;
  estimatedRate: number;
  detNo?: string;
  suggestedVendor?: string;
  remarks?: string;
}

const DEPARTMENTS = [
  'Stores / Tool Crib',
  'Engineering / Tool Design',
  'CNC Machining & Milling',
  'EDM & Wirecut',
  'Tool Room Fitting & Assembly',
  'Maintenance & Utilities',
  'Quality Assurance',
];

const CATEGORIES = [
  { id: 'RAW_MATERIAL', label: 'Raw Steel & Material' },
  { id: 'STANDARD_PARTS', label: 'Standard Parts & Fasteners' },
  { id: 'TOOLING', label: 'Cutting Tools & Inserts' },
  { id: 'CONSUMABLES', label: 'Shop Consumables & Oils' },
  { id: 'SERVICE', label: 'Outsourced Machining / HT' },
  { id: 'MAINTENANCE', label: 'Machine Maintenance Spares' },
];

export function CreatePrnModal({ isOpen, onClose, onSuccess, defaultProjectId }: CreatePrnModalProps) {
  const { success, error } = useToast();
  const { data: projects = [] } = useProjects();
  const { data: materials = [] } = useMasterData('materials');
  const { data: vendors = [] } = useMasterData('vendors');

  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [department, setDepartment] = useState('Stores / Tool Crib');
  const [requestedBy, setRequestedBy] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [category, setCategory] = useState<'RAW_MATERIAL' | 'STANDARD_PARTS' | 'CONSUMABLES' | 'TOOLING' | 'SERVICE' | 'MAINTENANCE'>('RAW_MATERIAL');
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');

  const [items, setItems] = useState<FormItem[]>([
    {
      id: `item-${Date.now()}-1`,
      itemName: '',
      materialGrade: 'DIN 1.2738',
      dimensions: '',
      requiredQuantity: 1,
      uom: 'PCS',
      estimatedRate: 0,
      detNo: '01',
      suggestedVendor: '',
      remarks: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportingBom, setIsImportingBom] = useState(false);

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  const activeProjects = projects.filter((p: any) => p.status !== 'CLOSED' && p.status !== 'CANCELLED');

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        itemName: '',
        materialGrade: 'DIN 1.2738',
        dimensions: '',
        requiredQuantity: 1,
        uom: 'PCS',
        estimatedRate: 0,
        detNo: String(prev.length + 1).padStart(2, '0'),
        suggestedVendor: '',
        remarks: '',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof FormItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'materialGrade') {
            const matchedMat = materials.find((m: any) => m.materialGrade === value || m.materialCode === value);
            if (matchedMat) {
              updated.materialId = matchedMat.id;
              if (Number(matchedMat.standardCost) > 0 && updated.estimatedRate === 0) {
                updated.estimatedRate = Number(matchedMat.standardCost);
              }
              if (matchedMat.defaultUom) {
                updated.uom = matchedMat.defaultUom;
              }
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Import from project BOM
  const handleImportFromBom = async () => {
    if (!projectId) {
      error('Project Required', 'Please select a project first to import BOM items.');
      return;
    }

    try {
      setIsImportingBom(true);
      const selectedProject = projects.find((p: any) => p.id === projectId);
      const latestBom = selectedProject?.billOfMaterialHeaders?.[0];

      if (!latestBom || !latestBom.items || latestBom.items.length === 0) {
        error('No BOM Found', `No Bill of Materials found for ${selectedProject?.projectNumber || 'this project'}.`);
        return;
      }

      const importedItems: FormItem[] = latestBom.items.map((bItem: any, idx: number) => {
        const custom = (bItem.customFields as any) || {};
        return {
          id: `bom-${bItem.id || idx}`,
          materialId: bItem.materialId,
          itemCode: custom.detNo || `DET-${idx + 1}`,
          itemName: custom.partName || bItem.remarks || bItem.material?.materialGrade || `Part ${idx + 1}`,
          materialGrade: bItem.material?.materialGrade || 'Steel Material',
          dimensions: bItem.dimensions || bItem.rawSize || custom.size || '',
          requiredQuantity: Number(bItem.requiredQty) || 1,
          uom: (bItem.material?.defaultUom || 'PCS').toUpperCase(),
          estimatedRate: Number(bItem.estimatedCost) || Number(bItem.material?.standardCost) || 0,
          detNo: custom.detNo || String(idx + 1).padStart(2, '0'),
          suggestedVendor: '',
          remarks: bItem.remarks || '',
        };
      });

      setItems(importedItems);
      setPurpose(`BOM items requisition for project ${selectedProject?.projectNumber}`);
      success('BOM Imported', `Successfully imported ${importedItems.length} items from Project BOM.`);
    } catch (err: any) {
      error('Import Failed', err?.message || 'Failed to load BOM items.');
    } finally {
      setIsImportingBom(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((acc, i) => acc + (Number(i.requiredQuantity || 1) * Number(i.estimatedRate || 0)), 0);
  };

  const handleSubmit = async (isDirectSubmit = false) => {
    if (items.some((i) => !i.itemName && !i.materialGrade)) {
      error('Validation Error', 'All items must have a valid Item Name or Material Grade.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        projectId: projectId || undefined,
        department,
        requestedBy: requestedBy || 'Shop Floor Engineer',
        requiredDate: requiredDate || undefined,
        priority,
        category,
        purpose: purpose || undefined,
        remarks: remarks || undefined,
        items: items.map((i) => ({
          materialId: i.materialId || undefined,
          itemCode: i.itemCode || i.detNo || undefined,
          itemName: i.itemName || i.materialGrade || 'Component',
          materialGrade: i.materialGrade || undefined,
          dimensions: i.dimensions || undefined,
          requiredQuantity: Number(i.requiredQuantity) || 1,
          uom: (i.uom || 'PCS').toUpperCase(),
          estimatedRate: Number(i.estimatedRate) || 0,
          detNo: i.detNo || undefined,
          suggestedVendor: i.suggestedVendor || undefined,
          remarks: i.remarks || undefined,
        })),
      };

      const created = await PurchaseRequisitionsService.createPrn(payload);

      if (isDirectSubmit && created?.id) {
        await PurchaseRequisitionsService.submitPrn(created.id);
      }

      success(
        'Requisition Created',
        `PRN ${created.prNumber} generated successfully${isDirectSubmit ? ' and submitted for approval' : ' as Draft'}.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Creation Failed', err?.response?.data?.message || err?.message || 'Failed to create Purchase Requisition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Requisition Note (PRN)"
      subtitle="Raise a formal procurement request for raw steel, standard components, tools, or shop consumables"
      maxWidth="4xl"
    >
      <div className="space-y-6 text-ink">
        {/* Header Parameters Card */}
        <div className="bg-canvas p-4 rounded-[12px] border border-border-gray space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1">
                Project / Tool (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-9 bg-white border border-border-gray rounded-[8px] px-3 text-xs font-medium text-ink focus:outline-none focus:border-primary"
              >
                <option value="">General Toolroom / Stores (No Project)</option>
                {activeProjects.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.projectNumber} - {p.partName || p.customer?.companyName || 'Tool'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1">
                Originating Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-9 bg-white border border-border-gray rounded-[8px] px-3 text-xs font-medium text-ink focus:outline-none focus:border-primary"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-9 bg-white border border-border-gray rounded-[8px] px-3 text-xs font-medium text-ink focus:outline-none focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1">
                Requested By
              </label>
              <input
                type="text"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder="e.g. Rahul Sharma (Design Engg)"
                className="w-full h-9 bg-white border border-border-gray rounded-[8px] px-3 text-xs font-medium text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1">
                Required Target Date
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full h-9 bg-white border border-border-gray rounded-[8px] px-3 text-xs font-medium text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-9 bg-white border border-border-gray rounded-[8px] px-3 text-xs font-medium text-ink focus:outline-none focus:border-primary"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="URGENT">Urgent (Production Critical)</option>
                <option value="CRITICAL">Critical (Breakdown / Hot Order)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cool-gray mb-1">
              Purpose / Justification
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Core & Cavity blocks for 4-Cavity Mould Assembly, Carbide Milling Inserts replenishment"
              className="w-full h-9 bg-white border border-border-gray rounded-[8px] px-3 text-xs font-medium text-ink focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Action strip above items grid */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink">Requisition Line Items ({items.length})</h3>
            {projectId && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Layers className="w-3.5 h-3.5 text-primary" />}
                onClick={handleImportFromBom}
                disabled={isImportingBom}
              >
                {isImportingBom ? 'Importing BOM...' : 'Import from Project BOM'}
              </Button>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5 text-primary" />}
            onClick={handleAddItem}
          >
            Add Line Item
          </Button>
        </div>

        {/* Dynamic Line Items Grid */}
        <div className="border border-border-gray rounded-[10px] overflow-hidden bg-white">
          <div className="overflow-x-auto max-h-[320px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-canvas border-b border-border-gray text-cool-gray font-semibold sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-2 text-center w-10">#</th>
                  <th className="py-2 px-2 w-14 text-center">Det #</th>
                  <th className="py-2 px-2 min-w-[140px]">Part / Description</th>
                  <th className="py-2 px-2 min-w-[120px]">Material Grade</th>
                  <th className="py-2 px-2 min-w-[110px]">Dimensions (L×W×H)</th>
                  <th className="py-2 px-2 w-16 text-right">Qty</th>
                  <th className="py-2 px-2 w-16 text-center">UOM</th>
                  <th className="py-2 px-2 w-20 text-right">Est. Rate</th>
                  <th className="py-2 px-2 w-20 text-right">Line Total</th>
                  <th className="py-2 px-2 min-w-[150px]">Suggested Vendor</th>
                  <th className="py-2 px-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {items.map((item, index) => {
                  const lineTotal = (Number(item.requiredQuantity) || 1) * (Number(item.estimatedRate) || 0);
                  return (
                    <tr key={item.id} className="hover:bg-canvas/50">
                      <td className="py-2 px-2 text-center font-mono text-mute">{index + 1}</td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="text"
                          value={item.detNo || ''}
                          onChange={(e) => handleItemChange(item.id, 'detNo', e.target.value)}
                          placeholder="01"
                          className="w-full text-center bg-transparent border-b border-dashed border-border-gray focus:border-primary font-mono text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                          placeholder="Part Name / Component"
                          className="w-full bg-transparent border-b border-dashed border-border-gray focus:border-primary font-medium text-xs text-ink"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          list="prn-materials-datalist"
                          value={item.materialGrade}
                          onChange={(e) => handleItemChange(item.id, 'materialGrade', e.target.value)}
                          placeholder="e.g. DIN 1.2738 / P20"
                          className="w-full bg-transparent border-b border-dashed border-border-gray focus:border-primary text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.dimensions}
                          onChange={(e) => handleItemChange(item.id, 'dimensions', e.target.value)}
                          placeholder="120 x 80 x 45"
                          className="w-full bg-transparent border-b border-dashed border-border-gray focus:border-primary font-mono text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.requiredQuantity}
                          onChange={(e) => handleItemChange(item.id, 'requiredQuantity', parseFloat(e.target.value) || 1)}
                          className="w-full text-right bg-transparent border-b border-dashed border-border-gray focus:border-primary font-mono text-xs font-bold"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <select
                          value={item.uom}
                          onChange={(e) => handleItemChange(item.id, 'uom', e.target.value)}
                          className="bg-transparent border-b border-dashed border-border-gray focus:border-primary text-xs text-center font-mono"
                        >
                          <option value="PCS">PCS</option>
                          <option value="KG">KG</option>
                          <option value="MTR">MTR</option>
                          <option value="SET">SET</option>
                          <option value="NOS">NOS</option>
                        </select>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.estimatedRate}
                          onChange={(e) => handleItemChange(item.id, 'estimatedRate', parseFloat(e.target.value) || 0)}
                          className="w-full text-right bg-transparent border-b border-dashed border-border-gray focus:border-primary font-mono text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-ink">
                        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={item.suggestedVendor || ''}
                          onChange={(e) => handleItemChange(item.id, 'suggestedVendor', e.target.value)}
                          className="w-full bg-white dark:bg-canvas border border-border-gray rounded-[6px] px-2 py-1 text-xs text-ink focus:outline-none focus:border-primary font-medium"
                        >
                          <option value="">-- Choose Vendor --</option>
                          {vendors.map((v: any) => (
                            <option key={v.id || v.vendorName} value={v.vendorName}>
                              {v.vendorName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-mute hover:text-semantic-danger-dark transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Total Strip */}
          <div className="bg-canvas border-t border-border-gray p-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-cool-gray">Total Estimated Requisition Value:</span>
            <span className="font-mono text-base font-bold text-primary">
              ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Datalist for Materials master data */}
        <datalist id="prn-materials-datalist">
          {materials.map((m: any) => (
            <option key={m.id} value={m.materialGrade || m.materialCode}>
              {m.materialGrade} {m.materialCode && m.materialCode !== m.materialGrade ? `(${m.materialCode})` : ''}
            </option>
          ))}
        </datalist>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border-gray">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="white"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Create & Submit for Approval'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
