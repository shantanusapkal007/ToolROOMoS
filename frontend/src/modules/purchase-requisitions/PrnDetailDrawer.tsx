"use client";

import React, { useState } from 'react';
import { PremiumDrawer } from '@/components/ui/PremiumDrawer';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Printer, 
  ShoppingCart, 
  Download, 
  Layers, 
  User, 
  Calendar, 
  AlertTriangle,
  Building,
  ArrowRight
} from 'lucide-react';
import { PurchaseRequisition, PurchaseRequisitionsService } from '@/services/purchase-requisitions.service';
import { useToast } from '@/components/ui/Toast';
import { exportPrnToExcel } from './prnExcelExporter';
import { ConvertToPoModal } from './ConvertToPoModal';

interface PrnDetailDrawerProps {
  prn: PurchaseRequisition | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onOpenPrintVoucher: (prn: PurchaseRequisition) => void;
}

export function PrnDetailDrawer({ prn, isOpen, onClose, onUpdate, onOpenPrintVoucher }: PrnDetailDrawerProps) {
  const { success, error } = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [showConvertToPo, setShowConvertToPo] = useState(false);

  if (!prn) return null;

  const handleSubmitForApproval = async () => {
    try {
      setIsSubmitting(true);
      await PurchaseRequisitionsService.submitPrn(prn.id);
      success('Submitted for Review', `PRN ${prn.prNumber} submitted for manager approval.`);
      onUpdate();
    } catch (err: any) {
      error('Submit Failed', err?.response?.data?.message || err?.message || 'Failed to submit PRN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await PurchaseRequisitionsService.approvePrn(prn.id);
      success('PRN Approved', `Purchase Requisition ${prn.prNumber} has been approved.`);
      onUpdate();
    } catch (err: any) {
      error('Approval Failed', err?.response?.data?.message || err?.message || 'Failed to approve PRN.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      error('Reason Required', 'Please enter a rejection reason.');
      return;
    }

    try {
      setIsRejecting(true);
      await PurchaseRequisitionsService.rejectPrn(prn.id, rejectionReason);
      success('PRN Rejected', `Purchase Requisition ${prn.prNumber} marked as rejected.`);
      setShowRejectInput(false);
      onUpdate();
    } catch (err: any) {
      error('Rejection Failed', err?.response?.data?.message || err?.message || 'Failed to reject PRN.');
    } finally {
      setIsRejecting(false);
    }
  };

  const isApproved = prn.status === 'APPROVED' || prn.status === 'PO_CREATED' || prn.status === 'PARTIALLY_CONVERTED';
  const isDraft = prn.status === 'DRAFT';
  const isPending = prn.status === 'SUBMITTED' || prn.approvalStatus === 'PENDING';

  return (
    <>
      <PremiumDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={prn.prNumber}
        subtitle={prn.project ? `Project: ${prn.project.projectNumber} - ${prn.project.partName}` : 'General Toolroom Requisition'}
        width="xl"
      >
        <div className="space-y-6 text-ink pb-10">
          
          {/* Header Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-canvas border border-border-gray rounded-[12px]">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                prn.status === 'APPROVED' ? 'bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/30' :
                prn.status === 'REJECTED' ? 'bg-semantic-danger-subtle text-semantic-danger-dark border border-semantic-danger/30' :
                prn.status === 'PO_CREATED' ? 'bg-primary-subtle text-primary border border-primary/30' :
                'bg-semantic-warning-subtle text-semantic-warning-dark border border-semantic-warning/30'
              }`}>
                {prn.status}
              </span>

              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                prn.priority === 'CRITICAL' ? 'bg-semantic-danger-subtle text-semantic-danger-dark' :
                prn.priority === 'URGENT' ? 'bg-semantic-warning-subtle text-semantic-warning-dark' :
                'bg-canvas border border-border-gray text-cool-gray'
              }`}>
                {prn.priority}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="white"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => exportPrnToExcel(prn)}
              >
                Excel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Printer className="w-3.5 h-3.5 text-primary" />}
                onClick={() => onOpenPrintVoucher(prn)}
              >
                Print Voucher
              </Button>
            </div>
          </div>

          {/* Workflow Decision Panel */}
          {isDraft && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-[12px] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">Draft Requisition</h4>
                <p className="text-caption text-amber-800 dark:text-amber-400">Ready to submit for manager review and commercial authorization?</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send className="w-3.5 h-3.5" />}
                onClick={handleSubmitForApproval}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </div>
          )}

          {isPending && !isDraft && (
            <div className="p-4 bg-primary-subtle border border-primary/20 rounded-[12px] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink">Pending Approval</h4>
                  <p className="text-caption text-cool-gray">Review items, specifications, and authorize for purchase order generation.</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() => setShowRejectInput(!showRejectInput)}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={handleApprove}
                    disabled={isApproving}
                  >
                    {isApproving ? 'Approving...' : 'Approve PRN'}
                  </Button>
                </div>
              </div>

              {showRejectInput && (
                <div className="pt-3 border-t border-border-gray flex items-center gap-2">
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejecting this requisition..."
                    className="flex-1 h-8 bg-white border border-border-gray rounded-[6px] px-2.5 text-xs text-ink focus:outline-none focus:border-semantic-danger"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleReject}
                    disabled={isRejecting}
                  >
                    {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {isApproved && prn.status !== 'PO_CREATED' && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[12px] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Approved &amp; Ready for PO
                </h4>
                <p className="text-caption text-emerald-800 dark:text-emerald-400">
                  Approved by {prn.approvedBy || 'Manager'}. Convert requisition line items into official supplier PO.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                onClick={() => setShowConvertToPo(true)}
              >
                Convert to PO
              </Button>
            </div>
          )}

          {/* Rejection Notice */}
          {prn.status === 'REJECTED' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-[12px]">
              <h4 className="text-xs font-bold text-red-900 dark:text-red-300">Requisition Rejected</h4>
              <p className="text-xs text-red-800 dark:text-red-400 mt-0.5">
                Reason: {prn.rejectionReason || 'Not approved by department management.'}
              </p>
            </div>
          )}

          {/* Details Overview Card */}
          <div className="bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle space-y-4">
            <h3 className="text-xs font-bold text-cool-gray uppercase tracking-wider">Requisition Metadata</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-mute block text-[11px]">Department:</span>
                <span className="font-semibold text-ink">{prn.department || 'Stores / Tool Crib'}</span>
              </div>

              <div>
                <span className="text-mute block text-[11px]">Requested By:</span>
                <span className="font-semibold text-ink">{prn.requestedBy || 'Supervisor'}</span>
              </div>

              <div>
                <span className="text-mute block text-[11px]">Required Date:</span>
                <span className="font-semibold text-ink font-mono">
                  {prn.requiredDate ? new Date(prn.requiredDate).toLocaleDateString('en-GB') : 'Immediate'}
                </span>
              </div>

              <div>
                <span className="text-mute block text-[11px]">Category:</span>
                <span className="font-semibold text-ink">{prn.category}</span>
              </div>

              <div>
                <span className="text-mute block text-[11px]">Created Date:</span>
                <span className="font-semibold text-ink font-mono">
                  {prn.createdAt ? new Date(prn.createdAt).toLocaleDateString('en-GB') : '-'}
                </span>
              </div>

              <div>
                <span className="text-mute block text-[11px]">Total Est. Value:</span>
                <span className="font-bold text-primary font-mono text-sm">
                  ₹{Number(prn.estimatedTotalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {prn.purpose && (
              <div className="pt-3 border-t border-border-gray text-xs">
                <span className="text-mute block text-[11px]">Purpose / Justification:</span>
                <span className="font-medium text-ink mt-0.5 block">{prn.purpose}</span>
              </div>
            )}
          </div>

          {/* Line Items Breakdown */}
          <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-border-gray flex items-center justify-between">
              <h3 className="text-xs font-bold text-cool-gray uppercase tracking-wider">
                Requisition Items ({prn.items?.length || 0})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-canvas text-cool-gray font-semibold border-b border-border-gray">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3 w-14 text-center">Det #</th>
                    <th className="py-2.5 px-3">Part / Description</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3 text-center">Dimensions</th>
                    <th className="py-2.5 px-3 text-right">Req Qty</th>
                    <th className="py-2.5 px-3 text-right">Ordered</th>
                    <th className="py-2.5 px-3 text-center">UOM</th>
                    <th className="py-2.5 px-3 text-right">Est. Rate</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-gray">
                  {prn.items?.map((item, idx) => {
                    const lineTotal = Number(item.estimatedTotal) || (Number(item.requiredQuantity || 1) * Number(item.estimatedRate || 0));
                    return (
                      <tr key={item.id || idx} className="hover:bg-canvas/50">
                        <td className="py-2.5 px-3 text-center font-mono text-mute">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-cool-gray">{item.detNo || '-'}</td>
                        <td className="py-2.5 px-3 font-semibold text-ink">{item.itemName}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-cool-gray">{item.materialGrade || '-'}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-cool-gray">{item.dimensions || item.rawSize || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-ink">{Number(item.requiredQuantity)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">{Number(item.orderedQty || 0)}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-mute">{item.uom || 'PCS'}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-cool-gray">
                          ₹{Number(item.estimatedRate || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-ink">
                          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Linked Purchase Orders */}
          {prn.purchaseOrders && prn.purchaseOrders.length > 0 && (
            <div className="bg-white p-5 rounded-[12px] border border-border-gray shadow-subtle space-y-3">
              <h3 className="text-xs font-bold text-cool-gray uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-3.5 h-3.5 text-primary" />
                Linked Supplier Purchase Orders ({prn.purchaseOrders.length})
              </h3>

              <div className="space-y-2">
                {prn.purchaseOrders.map((po) => (
                  <div key={po.id} className="p-3 bg-canvas border border-border-gray rounded-[8px] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-ink">{po.poNumber}</span>
                      <span className="text-[11px] text-mute block">{po.vendor?.vendorName || 'Supplier'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-ink">₹{Number(po.totalAmount || 0).toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-semantic-success-dark font-semibold block">{po.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </PremiumDrawer>

      {/* Convert To PO Modal */}
      {showConvertToPo && (
        <ConvertToPoModal
          isOpen={showConvertToPo}
          onClose={() => setShowConvertToPo(false)}
          prn={prn}
          onSuccess={() => {
            setShowConvertToPo(false);
            onUpdate();
          }}
        />
      )}
    </>
  );
}
