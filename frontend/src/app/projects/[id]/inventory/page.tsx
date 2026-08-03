"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { PackageCheck, Plus, ShoppingCart, Printer, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SmartTable } from "@/components/ui/SmartTable";
import { Modal } from "@/components/ui/Modal";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";
import { MaterialIssueForm } from "@/components/inventory/MaterialIssueForm";
import { AuthenticMaterialIssueDocument } from "@/modules/production/AuthenticMaterialIssueDocument";
import { exportGrnToExcel } from "@/modules/procurement/grnExcelExporter";
import { exportMaterialIssueToExcel } from "@/modules/production/materialIssueExcelExporter";

export default function ProjectInventoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: project, isLoading, refetch } = useProject(id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [printIssueData, setPrintIssueData] = useState<any | null>(null);
  const [viewingGrnDetails, setViewingGrnDetails] = useState<any | null>(null);

  if (isLoading) return <SkeletonBox className="h-64 w-full" />;

  const handleExportGrnRow = (row: any) => {
    const rawGrn = (project?.goodsReceiptHeaders || []).find((g: any) => g.id === row.id) || row;
    exportGrnToExcel({
      grnNumber: rawGrn.grnNumber || 'GRN-001',
      poNumber: rawGrn.poHeader?.poNumber || rawGrn.documentNumber || 'PO-001',
      supplierChallan: rawGrn.supplierChallan || '',
      date: new Date(rawGrn.createdAt || Date.now()).toLocaleDateString('en-GB'),
      vendorName: rawGrn.poHeader?.vendor?.vendorName || project?.customer?.companyName || 'Primary Supplier',
      items: (rawGrn.items || []).map((item: any) => ({
        toolNo: item.toolNo || project?.projectNumber || 'TOOL',
        detNo: item.detNo || '1',
        length: item.length || '',
        width: item.width || '',
        height: item.height || '',
        materialGrade: item.poItem?.material?.materialGrade || 'MS',
        orderedQty: Number(item.poItem?.orderedQty || item.receivedQty || 1),
        receivedQty: Number(item.receivedQty || 1),
        acceptedQty: Number(item.acceptedQty || 1),
        rejectedQty: Number(item.rejectedQty || 0),
        heatNumber: item.heatNumber || 'HT-001',
        rate: Number(item.actualRate || 0),
        basicCost: Number(item.basicCost || 0),
        gst: Number(item.gst || 0),
        total: Number(item.total || 0),
        remarks: item.remarks || '',
      }))
    });
  };

  const handleExportIssueRow = (row: any) => {
    const rawIssue = (project?.materialIssueHeaders || []).find((m: any) => m.id === row.id) || row;
    exportMaterialIssueToExcel({
      issueNumber: rawIssue.issueNumber || 'ISSUE-001',
      productionSection: rawIssue.productionSection || 'MACHINE_SHOP',
      date: new Date(rawIssue.createdAt || Date.now()).toLocaleDateString('en-GB'),
      remarks: rawIssue.remarks || '',
      items: (rawIssue.items || []).map((item: any) => ({
        materialName: item.inventoryBatch?.material?.materialName || item.inventoryBatch?.material?.materialGrade || 'Raw Material',
        batchNumber: item.inventoryBatch?.batchNumber || '',
        heatNumber: item.inventoryBatch?.heatNumber || '',
        issuedQty: Number(item.issuedQty || 1),
        unitCost: Number(item.inventoryBatch?.unitCost || 0),
        totalValue: Number(item.materialValue || 0),
        remarks: item.remarks || '',
      }))
    });
  };

  const materialHeaders = (project?.materialIssueHeaders || []).map((m: any) => ({
    ...m,
    createdAt: new Date(m.createdAt).toLocaleDateString('en-GB')
  }));

  const issueColumns = [
    { key: 'issueNumber', label: 'Issue #' },
    { key: 'productionSection', label: 'Section' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Date' },
    { 
      key: 'actions', 
      label: 'Actions',
      render: (val: any, row: any) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPrintIssueData(row)}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold cursor-pointer"
            title="Print Issue Slip"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={() => handleExportIssueRow(row)}
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold cursor-pointer"
            title="Export Issue Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      )
    },
  ];

  const grnHeaders = (project?.goodsReceiptHeaders || []).map((g: any) => ({
    ...g,
    id: g.id,
    grnNumber: g.grnNumber,
    supplierChallan: g.supplierChallan || '-',
    itemsCount: g.items?.length || 0,
    status: g.status,
    createdAt: new Date(g.createdAt).toLocaleDateString('en-GB')
  }));

  const grnColumns = [
    { key: 'grnNumber', label: 'GRN Number' },
    { key: 'supplierChallan', label: 'Supplier Challan' },
    { key: 'itemsCount', label: 'Received Items' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Date' },
    {
      key: 'actions',
      label: 'Actions',
      render: (val: any, row: any) => {
        const rawGrn = (project?.goodsReceiptHeaders || []).find((g: any) => g.id === row.id) || row;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewingGrnDetails(rawGrn)}
              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold cursor-pointer"
              title="View GRN Details"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>
            <button
              onClick={() => handleExportGrnRow(row)}
              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1 text-[10px] uppercase font-bold cursor-pointer"
              title="Export GRN Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        );
      }
    }
  ];

  const transactions = (project?.inventoryTransactions || []).map((t: any) => ({
    id: t.id,
    date: new Date(t.createdAt).toLocaleString('en-GB'),
    movementType: t.movementType.replace('_', ' '),
    material: t.inventoryBatch?.material?.materialName || t.inventoryBatch?.material?.materialGrade || 'Raw Material',
    quantity: (t.movementType.includes('RECEIPT') || t.movementType.includes('RETURN')) ? `+${t.quantity}` : `-${t.quantity}`,
    reference: `${t.referenceDocType}`
  }));

  const txColumns = [
    { key: 'date', label: 'Date & Time' },
    { key: 'movementType', label: 'Movement' },
    { key: 'material', label: 'Material' },
    { key: 'quantity', label: 'Qty' },
    { key: 'reference', label: 'Reference Doc' },
  ];

  return (
    <div className="space-y-8">
      
      {/* GRN Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              <span>Goods Receipt Notes (GRN)</span>
            </h2>
            <p className="text-xs text-zinc-500">Inward materials received against Purchase Orders for this project.</p>
          </div>
        </div>
        <SmartTable 
          title="Project GRNs"
          columns={grnColumns}
          data={grnHeaders}
          isLoading={false}
          exportFilename="GRN_History"
        />
      </div>

      {/* Live Inventory Ledger Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <span>Live Inventory Ledger (Stock Movements)</span>
            </h2>
            <p className="text-xs text-zinc-500">Real-time ledger of all stock additions (GRNs) and deductions (Issues).</p>
          </div>
        </div>
        <SmartTable 
          title="Inventory Ledger"
          columns={txColumns}
          data={transactions}
          isLoading={false}
          exportFilename="Inventory_Ledger"
        />
      </div>

      {/* Material Issues Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-amber-600" />
              <span>Material Issues & Requisitions</span>
            </h2>
            <p className="text-xs text-zinc-500">Track raw material blocks, standard hardware, and consumables issued to shop floor.</p>
          </div>
          <Button variant="primary" size="md" onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Request Material Issue</span>
          </Button>
        </div>
        <SmartTable 
          title="Material Issues"
          columns={issueColumns}
          data={materialHeaders}
          isLoading={false}
          exportFilename="Material_Requisitions"
        />
      </div>

      {isFormOpen && (
        <Modal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)}
          title="Material Issue Requisition"
          maxWidth="2xl"
        >
          <MaterialIssueForm 
            projectId={id} 
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              refetch();
            }}
          />
        </Modal>
      )}

      {printIssueData && (
        <div className="fixed inset-0 z-[200] bg-zinc-200 overflow-y-auto">
          <AuthenticMaterialIssueDocument 
            data={printIssueData} 
            onBack={() => setPrintIssueData(null)} 
          />
        </div>
      )}

      {viewingGrnDetails && (
        <Modal
          isOpen={!!viewingGrnDetails}
          onClose={() => setViewingGrnDetails(null)}
          title={`Goods Receipt Note: ${viewingGrnDetails.grnNumber}`}
          maxWidth="4xl"
        >
          <div className="space-y-5 font-sans">
            {/* Header info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
              <div>
                <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">GRN Number</span>
                <span className="font-mono font-bold text-zinc-900">{viewingGrnDetails.grnNumber}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">PO Reference</span>
                <span className="font-mono font-bold text-zinc-900">{viewingGrnDetails.poHeader?.poNumber || viewingGrnDetails.documentNumber || 'PO-001'}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Supplier Challan</span>
                <span className="font-mono text-zinc-900">{viewingGrnDetails.supplierChallan || '-'}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-bold block uppercase tracking-wider text-[10px]">Date Received</span>
                <span className="font-mono text-zinc-900">{new Date(viewingGrnDetails.createdAt || Date.now()).toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            {/* Received Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Received Goods Line Items</h4>
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100/70 text-zinc-600 font-bold text-[10px] uppercase tracking-wider border-b border-zinc-200">
                    <tr>
                      <th className="p-2.5">Det #</th>
                      <th className="p-2.5">Tool #</th>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5">Heat #</th>
                      <th className="p-2.5 text-right">Ordered</th>
                      <th className="p-2.5 text-right">Received</th>
                      <th className="p-2.5 text-right">Accepted</th>
                      <th className="p-2.5 text-right">Rejected</th>
                      <th className="p-2.5 text-right">Rate (₹)</th>
                      <th className="p-2.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {(viewingGrnDetails.items || []).map((item: any, idx: number) => (
                      <tr key={item.id || idx} className="hover:bg-zinc-50 font-mono">
                        <td className="p-2.5 font-bold text-zinc-900">{item.detNo || idx + 1}</td>
                        <td className="p-2.5">{item.toolNo || project?.projectNumber || 'TOOL'}</td>
                        <td className="p-2.5 font-sans font-medium text-zinc-800">{item.poItem?.material?.materialGrade || item.poItem?.material?.materialName || 'Raw Material'}</td>
                        <td className="p-2.5">{item.heatNumber || '-'}</td>
                        <td className="p-2.5 text-right">{item.poItem?.orderedQty || item.receivedQty || 0}</td>
                        <td className="p-2.5 text-right font-bold text-blue-700">{item.receivedQty || 0}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">{item.acceptedQty || 0}</td>
                        <td className="p-2.5 text-right font-bold text-rose-600">{item.rejectedQty || 0}</td>
                        <td className="p-2.5 text-right">₹{Number(item.actualRate || 0).toLocaleString()}</td>
                        <td className="p-2.5 text-right font-bold text-zinc-900">₹{Number(item.total || item.basicCost || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExportGrnRow(viewingGrnDetails)}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Export Excel
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setViewingGrnDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
