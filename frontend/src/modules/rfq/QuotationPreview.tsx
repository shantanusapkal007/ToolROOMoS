"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileCheck,
  Building2,
  Calendar,
  Clock,
  IndianRupee,
} from "lucide-react";
import { PremiumDrawer } from "@/components/ui/PremiumDrawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RfqService } from "@/services/rfq.service";

interface QuotationPreviewProps {
  quotationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuotationPreview({ quotationId, isOpen, onClose }: QuotationPreviewProps) {
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuotation = useCallback(async () => {
    setLoading(true);
    try {
      const data = await RfqService.getQuotationById(quotationId);
      setQuotation(data);
    } catch {
      setQuotation(null);
    } finally {
      setLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    if (isOpen && quotationId) fetchQuotation();
  }, [isOpen, quotationId, fetchQuotation]);

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatCurrency = (v: number | string) => {
    const n = Number(v || 0);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);
  };

  if (!isOpen) return null;

  return (
    <PremiumDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={quotation ? `Quotation ${quotation.quotationNumber}` : "Loading..."}
      subtitle={quotation ? `Revision ${quotation.revision} • ${quotation.status}` : undefined}
      width="xl"
    >
      {loading || !quotation ? (
        <div className="flex items-center justify-center py-16 text-mute">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ─── Commercial Header ─────────────────────────── */}
          <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-feature-title text-ink font-semibold tracking-tight">QUOTATION</h2>
                <p className="text-body-sm text-primary font-mono font-medium mt-1">{quotation.quotationNumber}</p>
              </div>
              <StatusBadge status={quotation.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              {/* Customer */}
              <div>
                <p className="text-caption text-mute uppercase tracking-wider font-semibold mb-2">Bill To</p>
                <div className="space-y-1">
                  <p className="text-body-sm text-ink font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-mute" />
                    {quotation.rfqHeader?.customer?.companyName}
                  </p>
                  {quotation.rfqHeader?.customer?.gstNumber && (
                    <p className="text-caption text-cool-gray">GST: {quotation.rfqHeader.customer.gstNumber}</p>
                  )}
                  {quotation.rfqHeader?.customer?.billingAddress && (
                    <p className="text-caption text-cool-gray">{quotation.rfqHeader.customer.billingAddress}</p>
                  )}
                </div>
              </div>

              {/* Quote Meta */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-body-sm">
                  <Calendar className="h-4 w-4 text-mute" />
                  <span className="text-cool-gray">Date:</span>
                  <span className="text-ink font-medium">{formatDate(quotation.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm">
                  <Clock className="h-4 w-4 text-mute" />
                  <span className="text-cool-gray">Valid Until:</span>
                  <span className="text-ink font-medium">{formatDate(quotation.validUntil)}</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm">
                  <FileCheck className="h-4 w-4 text-mute" />
                  <span className="text-cool-gray">RFQ Ref:</span>
                  <span className="text-primary font-mono font-medium">{quotation.rfqHeader?.rfqNumber}</span>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="border-t border-border-gray pt-4">
              <p className="text-caption text-mute uppercase tracking-wider font-semibold mb-1">Subject</p>
              <p className="text-body-sm text-ink">{quotation.rfqHeader?.subject}</p>
            </div>
          </div>

          {/* ─── Line Items Table ──────────────────────────── */}
          <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="text-left px-5 py-3 text-caption font-semibold">#</th>
                    <th className="text-left px-5 py-3 text-caption font-semibold">Description</th>
                    <th className="text-right px-5 py-3 text-caption font-semibold">Qty</th>
                    <th className="text-left px-5 py-3 text-caption font-semibold">UOM</th>
                    <th className="text-right px-5 py-3 text-caption font-semibold">Unit Price</th>
                    <th className="text-right px-5 py-3 text-caption font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray">
                  {quotation.items?.map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-[rgba(148,151,169,0.04)]">
                      <td className="px-5 py-3.5 text-body-sm text-mute">{idx + 1}</td>
                      <td className="px-5 py-3.5 text-body-sm text-ink font-medium max-w-[280px]">{item.description}</td>
                      <td className="px-5 py-3.5 text-right text-body-sm text-ink font-mono">{Number(item.quantity)}</td>
                      <td className="px-5 py-3.5 text-body-sm text-mute">{item.uom}</td>
                      <td className="px-5 py-3.5 text-right text-body-sm text-ink font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-5 py-3.5 text-right text-body-sm text-ink font-mono font-semibold">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─── Totals ─────────────────────────────────── */}
            <div className="border-t border-border-gray bg-[rgba(148,151,169,0.04)] px-5 py-4">
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center gap-8 text-body-sm">
                  <span className="text-cool-gray w-32 text-right">Subtotal</span>
                  <span className="font-mono text-ink w-32 text-right">{formatCurrency(quotation.subtotal)}</span>
                </div>
                <div className="flex items-center gap-8 text-body-sm">
                  <span className="text-cool-gray w-32 text-right">Markup</span>
                  <span className="font-mono text-mute w-32 text-right">{Number(quotation.markupPercent)}%</span>
                </div>
                <div className="flex items-center gap-8 text-body-sm">
                  <span className="text-cool-gray w-32 text-right">GST ({Number(quotation.taxPercent)}%)</span>
                  <span className="font-mono text-ink w-32 text-right">{formatCurrency(quotation.taxAmount)}</span>
                </div>
                <div className="flex items-center gap-8 text-body font-semibold border-t border-border-gray pt-2 mt-1">
                  <span className="text-ink w-32 text-right flex items-center justify-end gap-2">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    Grand Total
                  </span>
                  <span className="font-mono text-ink w-32 text-right">{formatCurrency(quotation.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Terms & Conditions ────────────────────────── */}
          {quotation.termsAndConditions && (
            <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle p-5">
              <h3 className="text-body font-semibold text-ink mb-2">Terms & Conditions</h3>
              <p className="text-body-sm text-cool-gray whitespace-pre-line">{quotation.termsAndConditions}</p>
            </div>
          )}

          {/* ─── Validity Notice ───────────────────────────── */}
          <div className="bg-semantic-warning-subtle border border-semantic-warning/20 rounded-[12px] p-4">
            <p className="text-body-sm text-semantic-warning-dark">
              This quotation is valid for <strong>{quotation.validityDays} days</strong> from the date of issue
              {quotation.validUntil ? ` (until ${formatDate(quotation.validUntil)})` : ""}.
            </p>
          </div>
        </div>
      )}
    </PremiumDrawer>
  );
}
