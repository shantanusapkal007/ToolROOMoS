"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Calendar, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useMasterData } from '@/hooks/useMasterData';
import { PurchaseRequisitionsService, PurchaseRequisition } from '@/services/purchase-requisitions.service';
import { useToast } from '@/components/ui/Toast';

interface ConvertToPoModalProps {
  isOpen: boolean;
  onClose: () => void;
  prn: PurchaseRequisition | null;
  onSuccess: () => void;
}

export function ConvertToPoModal({ isOpen, onClose, prn, onSuccess }: ConvertToPoModalProps) {
  const { success, error } = useToast();
  const { data: vendors = [] } = useMasterData('vendors');

  const [vendorId, setVendorId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('Door Delivery / CIF Factory Gate (Chakan)');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (prn && prn.items) {
      setItems(
        prn.items.map((item) => {
          const remQty = Math.max(0, Number(item.requiredQuantity || 1) - Number(item.orderedQty || 0));
          return {
            prItemId: item.id,
            detNo: item.detNo || '-',
            itemName: item.itemName || item.materialGrade || 'Component',
            materialGrade: item.materialGrade || '-',
            dimensions: item.dimensions || item.rawSize || '-',
            requiredQuantity: Number(item.requiredQuantity),
            orderedQty: remQty > 0 ? remQty : Number(item.requiredQuantity),
            agreedRate: Number(item.estimatedRate) || 100,
            gstPercent: 18,
            uom: item.uom || 'PCS',
            remarks: item.remarks || '',
          };
        })
      );

      // Auto-match vendor if suggested
      const suggested = prn.items.find((i) => i.suggestedVendor)?.suggestedVendor;
      if (suggested && vendors.length > 0) {
        const matched = vendors.find((v: any) => v.vendorName?.toLowerCase().includes(suggested.toLowerCase()));
        if (matched) setVendorId(matched.id);
      }
    }
  }, [prn, vendors]);

  if (!prn) return null;

  const handleItemChange = (idx: number, field: string, val: any) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it))
    );
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      const basic = (Number(item.orderedQty) || 1) * (Number(item.agreedRate) || 0);
      const gst = basic * ((Number(item.gstPercent) || 18) / 100);
      return sum + basic + gst;
    }, 0);
  };

  const handleConvert = async () => {
    if (!vendorId) {
      error('Vendor Required', 'Please select a supplier / vendor for the Purchase Order.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        vendorId,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        deliveryTerms,
        remarks: remarks || undefined,
        items: items.map((i) => ({
          prItemId: i.prItemId,
          orderedQty: Number(i.orderedQty) || 1,
          agreedRate: Number(i.agreedRate) || 0,
          gstPercent: Number(i.gstPercent) || 18,
          remarks: i.remarks || undefined,
        })),
      };

      const po = await PurchaseRequisitionsService.convertToPo(prn.id, payload);
      success(
        'Purchase Order Generated',
        `Official PO ${po.poNumber} has been generated from ${prn.prNumber}!`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Conversion Failed', err?.response?.data?.message || err?.message || 'Failed to generate Purchase Order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Convert ${prn.prNumber} to Purchase Order (PO)`}
      subtitle="Issue an official Supplier Purchase Order for approved requisition line items"
      maxWidth="4xl"
    >
      <div className="space-y-6 text-ink">
        {/* Vendor & Delivery Card */}
        <div className="bg-canvas p-4 rounded-[12px] border border-border-gray space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1">
                Select Supplier / Vendor *
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-9 bg-white border border-border-gray rounded-[8px] px-3 text-xs font-semibold text-ink focus:outline-none focus:border-primary"
              >
                <option value="">-- Choose Vendor --</option>
                {vendors.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.vendorName} ({v.vendorCode || v.vendorType || 'Supplier'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full h-9 bg-white border border-border-gray rounded-[8px] px-3 text-xs font-medium text-ink focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cool-gray mb-1">
                Delivery Terms
              </label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                placeholder="e.g. Delivery within 2 days"
                className="w-full h-9 bg-white border border-border-gray rounded-[8px] px-3 text-xs font-medium text-ink focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* PO Items Table */}
        <div className="border border-border-gray rounded-[10px] overflow-hidden bg-white">
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-canvas border-b border-border-gray text-cool-gray font-semibold sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-2 text-center w-10">#</th>
                  <th className="py-2 px-2 w-14 text-center">Det #</th>
                  <th className="py-2 px-2 min-w-[140px]">Part Description</th>
                  <th className="py-2 px-2 min-w-[100px]">Grade</th>
                  <th className="py-2 px-2 min-w-[100px]">Dimensions</th>
                  <th className="py-2 px-2 w-20 text-right">Order Qty</th>
                  <th className="py-2 px-2 w-14 text-center">UOM</th>
                  <th className="py-2 px-2 w-24 text-right">Agreed Rate (₹)</th>
                  <th className="py-2 px-2 w-16 text-center">GST %</th>
                  <th className="py-2 px-2 w-24 text-right">Line Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {items.map((item, index) => {
                  const basic = (Number(item.orderedQty) || 1) * (Number(item.agreedRate) || 0);
                  const gst = basic * ((Number(item.gstPercent) || 18) / 100);
                  const total = basic + gst;

                  return (
                    <tr key={index} className="hover:bg-canvas/50">
                      <td className="py-2 px-2 text-center font-mono text-mute">{index + 1}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-cool-gray">{item.detNo}</td>
                      <td className="py-2 px-2 font-medium text-ink">{item.itemName}</td>
                      <td className="py-2 px-2 font-mono text-cool-gray">{item.materialGrade}</td>
                      <td className="py-2 px-2 font-mono text-cool-gray">{item.dimensions}</td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          value={item.orderedQty}
                          onChange={(e) => handleItemChange(index, 'orderedQty', parseFloat(e.target.value) || 1)}
                          className="w-full text-right bg-white border border-border-gray rounded px-1.5 py-0.5 font-mono text-xs font-bold text-ink"
                        />
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-mute">{item.uom}</td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.agreedRate}
                          onChange={(e) => handleItemChange(index, 'agreedRate', parseFloat(e.target.value) || 0)}
                          className="w-full text-right bg-white border border-border-gray rounded px-1.5 py-0.5 font-mono text-xs font-semibold text-ink"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="28"
                          value={item.gstPercent}
                          onChange={(e) => handleItemChange(index, 'gstPercent', parseFloat(e.target.value) || 0)}
                          className="w-12 text-center bg-white border border-border-gray rounded px-1 py-0.5 font-mono text-xs text-cool-gray"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-ink">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-canvas border-t border-border-gray p-3 flex items-center justify-between text-xs font-semibold">
            <span className="text-cool-gray">Total Purchase Order Value (Incl. GST):</span>
            <span className="font-mono text-base font-bold text-primary">
              ₹{calculateGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border-gray">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            variant="primary"
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            onClick={handleConvert}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Generating PO...' : 'Confirm & Issue Purchase Order'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
