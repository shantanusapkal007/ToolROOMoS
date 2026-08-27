"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import { useProject } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Eye, PackageCheck, Edit3, Trash2, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SmartTable } from "@/components/ui/SmartTable";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { PurchaseOrderForm } from "@/components/purchase/PurchaseOrderForm";
import { ReceiveGrnModal } from "@/components/purchase/ReceiveGrnModal";
import { ProcurementService } from "@/services/procurement.service";
import { AuthenticPoDocument } from "@/modules/procurement/AuthenticPoDocument";
import { PurchaseRequisitionsModule } from "@/modules/purchase-requisitions/PurchaseRequisitionsModule";
import { useToast } from "@/components/ui/Toast";

export default function ProjectPurchasePage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: project, isLoading: isLoadingProject, refetch: refetchProject } = useProject(id);
  const isProjectClosed = project?.currentStage === 'CLOSED' || project?.currentStage === 'COMPLETED';
  const { success, error } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'po' | 'prn'>('po');
  const [previewPo, setPreviewPo] = useState<any | null>(null);
  const [grnTargetPo, setGrnTargetPo] = useState<any | null>(null);
  const [editingPo, setEditingPo] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeletePo = async (po: any) => {
    const poNum = po.poNumber || po.id;
    if (!window.confirm(`Are you sure you want to delete Purchase Order "${poNum}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(po.id || po.poNumber);
      await ProcurementService.deletePurchaseOrder(id, po.id || po.poNumber);
      success("Purchase Order Deleted", `PO ${poNum} has been permanently deleted.`);
      refetchProject();
      refetchPos();
    } catch (err: any) {
      error("Delete Failed", err?.response?.data?.message || err?.message || "Failed to delete purchase order.");
    } finally {
      setIsDeleting(null);
    }
  };

  // Fetch live purchase orders directly from procurement API
  const { data: poResponse, isLoading: isLoadingPos, refetch: refetchPos } = useQuery({
    queryKey: ['project-pos', id],
    queryFn: () => ProcurementService.getPurchaseOrders(id),
    enabled: !!id,
    staleTime: 0,
  });

  useEffect(() => {
    if (id) {
      refetchProject();
      refetchPos();
    }
  }, [id, refetchProject, refetchPos]);

  const extractPos = (res: any) => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  const fetchedPos = extractPos(poResponse);
  const projectPos = project?.purchaseOrderHeaders || [];

  // Combine unique POs by id/poNumber
  const poMap = new Map();
  [...fetchedPos, ...projectPos].forEach(po => {
    if (po && (po.id || po.poNumber)) {
      poMap.set(po.id || po.poNumber, po);
    }
  });
  const purchaseOrders = Array.from(poMap.values());

  const columns = [
    { key: 'poNumber', label: 'PO #', render: (val: string) => <span className="font-mono font-semibold text-ink">{val}</span> },
    { 
      key: 'supplierName', 
      label: 'Vendor / Supplier', 
      render: (val: string, row: any) => {
        const vendorName = val || row.vendor?.vendorName || (row.customFields as any)?.vendorName || 'Primary Material Supplier';
        return <span className="font-semibold text-ink">{vendorName}</span>;
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val: string) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-semantic-success-subtle text-semantic-success-dark border border-semantic-success/20 uppercase tracking-wider">
          {val || 'ISSUED'}
        </span>
      ) 
    },
    { 
      key: 'totalAmount', 
      label: 'Amount (₹)', 
      render: (val: number) => (
        <span className="font-mono font-semibold text-ink">
          ₹{Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ) 
    },
    { 
      key: 'createdAt', 
      label: 'Date', 
      render: (val: string) => <span className="font-mono text-mute text-xs">{val ? new Date(val).toLocaleDateString('en-GB') : '-'}</span> 
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_: any, row: any) => {
        const custom = (row.customFields as any) || {};
        const items = row.items || [];
        const poData = {
          poNumber: row.poNumber,
          rmSlipNo: custom.rmSlipNo || row.poNumber,
          date: row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          vendorName: row.vendor?.vendorName || custom.vendorName || "Primary Supplier",
          vendorAddress: row.vendor?.address || custom.vendorAddress || "Tooling Hub",
          deliveryTerms: custom.deliveryTerms || "Standard Delivery",
          items: items.map((i: any, idx: number) => {
            const itemCustom = (i.customFields as any) || {};
            const qty = Number(i.orderedQty) || 1;
            let apWt = Number(itemCustom.apWt ?? (i as any).calculatedWeight ?? 0);
            let totalWt = Number(itemCustom.totalWt ?? 0);

            if (apWt === 0 && totalWt === 0) {
              const density = Number(i.material?.density || 7.85);
              const lStr = String(itemCustom.length || '');
              if (lStr === 'Ø' || lStr.startsWith('Ø')) {
                const d = parseFloat(itemCustom.width || '');
                const l = parseFloat(itemCustom.height || '');
                if (!isNaN(d) && !isNaN(l) && d > 0 && l > 0) {
                  const vol = Math.PI * Math.pow(d / 2, 2) * l;
                  apWt = Number(((vol * density) / 1000000).toFixed(2));
                  totalWt = Number((apWt * qty).toFixed(2));
                }
              } else {
                const l = parseFloat(lStr);
                const w = parseFloat(itemCustom.width || '');
                const h = parseFloat(itemCustom.height || '');
                if (!isNaN(l) && !isNaN(w) && !isNaN(h) && l > 0 && w > 0 && h > 0) {
                  apWt = Number(((l * w * h * density) / 1000000).toFixed(2));
                  totalWt = Number((apWt * qty).toFixed(2));
                }
              }
            } else if (totalWt === 0 && apWt > 0) {
              totalWt = Number((apWt * qty).toFixed(2));
            } else if (apWt === 0 && totalWt > 0 && qty > 0) {
              apWt = Number((totalWt / qty).toFixed(2));
            }

            const rate = Number(i.agreedRate) || 0;
            const basicValue = Number(i.basicValue) || Number((totalWt > 0 ? totalWt * rate : qty * rate).toFixed(2));
            const gstPercent = Number(i.gstPercent || itemCustom.gstPercent || 18);
            const gstAmount = Number(itemCustom.gstAmount) || Number((basicValue * (gstPercent / 100)).toFixed(2));
            const lineTotal = Number((basicValue + gstAmount).toFixed(2));

            return {
              toolNo: itemCustom.toolNo || project?.projectNumber || 'TOOL',
              detNo: itemCustom.detNo || `${idx + 1}`,
              dimensions: i.dimensions || itemCustom.rawMaterialSize || itemCustom.rawSize || '',
              length: itemCustom.length || '',
              width: itemCustom.width || '',
              height: itemCustom.height || '',
              materialGrade: itemCustom.materialGrade || i.material?.materialGrade || 'MS',
              orderedQty: qty,
              apWt,
              totalWt,
              agreedRate: rate,
              basicValue,
              gstPercent,
              gstAmount,
              lineTotal,
              remarks: i.remarks || '',
            };
          })
        };

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewPo(poData)}
              className="p-1.5 rounded-[12px] bg-canvas hover:bg-white text-ink border border-border-gray transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
              title="View Authentic PO Sheet"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </button>
            {!isProjectClosed && (
              <>
                <button
                  onClick={() => {
                    setEditingPo(row);
                    setIsFormOpen(true);
                  }}
                  className="p-1.5 rounded-[12px] bg-primary-subtle hover:bg-primary-subtle/80 text-primary border border-primary/20 transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
                  title="Edit Purchase Order"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setGrnTargetPo(row)}
                  className="p-1.5 rounded-[12px] bg-semantic-success-subtle hover:bg-semantic-success-subtle/80 text-semantic-success-dark border border-semantic-success/20 transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
                  title="Receive Material (GRN)"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Receive</span>
                </button>
                <button
                  onClick={() => handleDeletePo(row)}
                  disabled={isDeleting === (row.id || row.poNumber)}
                  className="p-1.5 rounded-[12px] bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 border border-rose-200 transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer disabled:opacity-50"
                  title="Delete Purchase Order"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting === (row.id || row.poNumber) ? 'Deleting...' : 'Delete'}</span>
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  if (isLoadingProject && isLoadingPos && purchaseOrders.length === 0) {
    return <SkeletonBox className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      {previewPo ? (
        <AuthenticPoDocument
          data={previewPo}
          onBack={() => setPreviewPo(null)}
        />
      ) : (
        <>
          <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="h-8 w-8 rounded-[12px] bg-primary flex items-center justify-center shadow-sm shrink-0">
                  <ShoppingCart className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-ink tracking-tight">Procurement &amp; Materials</h1>
              </div>
              <p className="text-xs text-mute ml-[42px]">Manage supplier purchase orders, material requisitions (PRN), and goods receipts.</p>
            </div>

            <div className="flex items-center gap-3">
              <Tabs
                activeTab={activeTab}
                onChange={(t) => setActiveTab(t as any)}
                tabs={[
                  { id: 'po', label: `Purchase Orders (${purchaseOrders.length})`, icon: <ShoppingCart className="w-3.5 h-3.5" /> },
                  { id: 'prn', label: 'Requisitions (PRN)', icon: <FileText className="w-3.5 h-3.5" /> },
                ]}
              />

              {activeTab === 'po' && !isProjectClosed && (
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingPo(null);
                    setIsFormOpen(true);
                  }}
                >
                  Generate PO
                </Button>
              )}
            </div>
          </div>

          {activeTab === 'prn' ? (
            <PurchaseRequisitionsModule projectId={id} />
          ) : (
            <SmartTable 
              title="Project Purchase Orders"
              columns={columns}
              data={purchaseOrders}
              isLoading={isLoadingPos}
              exportFilename="Purchase_Orders"
            />
          )}

          {isFormOpen && (
            <Modal 
              isOpen={isFormOpen} 
              onClose={() => {
                setIsFormOpen(false);
                setEditingPo(null);
              }}
              title={editingPo ? `Edit Purchase Order (${editingPo.poNumber})` : "Create Purchase Order"}
              maxWidth="2xl"
            >
              <PurchaseOrderForm 
                projectId={id} 
                editingPo={editingPo}
                onClose={() => {
                  setIsFormOpen(false);
                  setEditingPo(null);
                }}
                onSuccess={() => {
                  setIsFormOpen(false);
                  setEditingPo(null);
                  refetchProject();
                  refetchPos();
                }}
              />
            </Modal>
          )}

          {grnTargetPo && (
            <Modal
              isOpen={!!grnTargetPo}
              onClose={() => setGrnTargetPo(null)}
              title={`Goods Receipt Note (GRN) for ${grnTargetPo.poNumber}`}
              maxWidth="3xl"
            >
              <ReceiveGrnModal
                projectId={id}
                po={grnTargetPo}
                onClose={() => setGrnTargetPo(null)}
                onSuccess={() => {
                  setGrnTargetPo(null);
                  refetchProject();
                  refetchPos();
                }}
              />
            </Modal>
          )}
        </>
      )}
    </div>
  );
}
