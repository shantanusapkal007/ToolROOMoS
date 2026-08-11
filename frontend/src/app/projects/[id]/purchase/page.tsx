"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import { useProject } from "@/hooks/useProjects";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Eye, PackageCheck, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SmartTable } from "@/components/ui/SmartTable";
import { Modal } from "@/components/ui/Modal";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { PurchaseOrderForm } from "@/components/purchase/PurchaseOrderForm";
import { ReceiveGrnModal } from "@/components/purchase/ReceiveGrnModal";
import { ProcurementService } from "@/services/procurement.service";
import { AuthenticPoDocument } from "@/modules/procurement/AuthenticPoDocument";

export default function ProjectPurchasePage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: project, isLoading: isLoadingProject, refetch: refetchProject } = useProject(id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [previewPo, setPreviewPo] = useState<any | null>(null);
  const [grnTargetPo, setGrnTargetPo] = useState<any | null>(null);
  const [editingPo, setEditingPo] = useState<any | null>(null);

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
    { key: 'poNumber', label: 'PO #', render: (val: string) => <span className="font-mono font-semibold text-zinc-950">{val}</span> },
    { 
      key: 'supplierName', 
      label: 'Vendor / Supplier', 
      render: (val: string, row: any) => {
        const vendorName = val || row.vendor?.vendorName || (row.customFields as any)?.vendorName || 'Primary Material Supplier';
        return <span className="font-semibold text-zinc-800">{vendorName}</span>;
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val: string) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
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
            return {
              toolNo: itemCustom.toolNo || project?.projectNumber || 'TOOL',
              detNo: itemCustom.detNo || `${idx + 1}`,
              dimensions: i.dimensions || itemCustom.rawMaterialSize || itemCustom.rawSize || '',
              length: itemCustom.length || '',
              width: itemCustom.width || '',
              height: itemCustom.height || '',
              materialGrade: itemCustom.materialGrade || i.material?.materialGrade || 'MS',
              orderedQty: Number(i.orderedQty) || 1,
              apWt: Number(itemCustom.apWt) || 0,
              totalWt: Number(itemCustom.totalWt) || 0,
              agreedRate: Number(i.agreedRate) || 0,
              basicValue: Number(i.basicValue) || Number(i.lineTotal) || 0,
              gstAmount: Number(itemCustom.gstAmount) || 0,
              lineTotal: Number(i.lineTotal) || 0,
              remarks: i.remarks || '',
            };
          })
        };

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewPo(poData)}
              className="p-1.5 rounded-[12px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
              title="View Authentic PO Sheet"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </button>
            <button
              onClick={() => {
                setEditingPo(row);
                setIsFormOpen(true);
              }}
              className="p-1.5 rounded-[12px] bg-primary-subtle hover:bg-blue-100 text-primary-dark border border-blue-200 transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
              title="Edit Purchase Order"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setGrnTargetPo(row)}
              className="p-1.5 rounded-[12px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
              title="Receive Material (GRN)"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Receive</span>
            </button>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                <span>Purchase Orders & Procurement</span>
              </h2>
              <p className="text-xs text-mute">Manage supplier purchase orders, steel raw material requisitions, and GRNs.</p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setEditingPo(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Generate New PO</span>
            </Button>
          </div>

          <SmartTable 
            title="Project Purchase Orders"
            columns={columns}
            data={purchaseOrders}
            isLoading={isLoadingPos}
            exportFilename="Purchase_Orders"
          />

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
