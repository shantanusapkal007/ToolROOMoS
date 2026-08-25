"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/useProjects";
import { PackageCheck, Plus, ShoppingCart, Printer, Download, Eye, Layers, PackageMinus } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<'grn' | 'ledger' | 'issues'>('grn');
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
            className="p-1.5 rounded-[10px] bg-canvas hover:bg-white text-ink border border-border-gray transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
            title="Print Issue Slip"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={() => handleExportIssueRow(row)}
            className="p-1.5 rounded-[10px] bg-semantic-success-subtle hover:bg-semantic-success-subtle/80 text-semantic-success-dark border border-semantic-success/20 transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
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
              className="p-1.5 rounded-[10px] bg-primary-subtle hover:bg-primary-subtle/80 text-primary border border-primary/20 transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
              title="View GRN Details"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>
            <button
              onClick={() => handleExportGrnRow(row)}
              className="p-1.5 rounded-[10px] bg-semantic-success-subtle hover:bg-semantic-success-subtle/80 text-semantic-success-dark border border-semantic-success/20 transition-colors flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
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

  const isProjectClosed = project?.currentStage === 'CLOSED' || project?.currentStage === 'COMPLETED';

  return (
    <div className="space-y-6">
      
      {/* 3 Interactive Tabs */}
      <div className="flex items-center gap-2 border-b border-border-gray pb-px">
        <button
          onClick={() => setActiveTab('grn')}
          className={`px-5 py-3 rounded-t-[10px] text-xs font-semibold flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
            activeTab === 'grn'
              ? 'bg-white border-border-gray text-primary border-b-2 border-b-white shadow-subtle font-bold translate-y-[1px]'
              : 'bg-canvas/50 border-transparent text-silver-blue hover:text-ink hover:bg-canvas'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Goods Receipts (GRN)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'grn' ? 'bg-primary-subtle text-primary' : 'bg-zinc-200 text-zinc-700'
          }`}>
            {grnHeaders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-5 py-3 rounded-t-[10px] text-xs font-semibold flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-white border-border-gray text-primary border-b-2 border-b-white shadow-subtle font-bold translate-y-[1px]'
              : 'bg-canvas/50 border-transparent text-silver-blue hover:text-ink hover:bg-canvas'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Live Stock Movements</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'ledger' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'
          }`}>
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`px-5 py-3 rounded-t-[10px] text-xs font-semibold flex items-center gap-2 border-t border-x transition-all cursor-pointer ${
            activeTab === 'issues'
              ? 'bg-white border-border-gray text-primary border-b-2 border-b-white shadow-subtle font-bold translate-y-[1px]'
              : 'bg-canvas/50 border-transparent text-silver-blue hover:text-ink hover:bg-canvas'
          }`}
        >
          <PackageMinus className="w-4 h-4" />
          <span>Material Issues (MIN)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'issues' ? 'bg-purple-100 text-purple-800' : 'bg-zinc-200 text-zinc-700'
          }`}>
            {materialHeaders.length}
          </span>
        </button>
      </div>

      {/* TAB 1: GRN */}
      {activeTab === 'grn' && (
        <div className="space-y-4">
          <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="h-8 w-8 rounded-[10px] bg-primary-subtle border border-primary/20 flex items-center justify-center text-primary shadow-sm shrink-0">
                  <PackageCheck className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-ink tracking-tight">Goods Receipt Notes (GRN)</h2>
              </div>
              <p className="text-xs text-silver-blue ml-[42px]">Inward raw materials and parts received against Purchase Orders for this project.</p>
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
      )}

      {/* TAB 2: LIVE STOCK LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="h-8 w-8 rounded-[10px] bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <Layers className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-ink tracking-tight">Stock Movements Ledger</h2>
              </div>
              <p className="text-xs text-silver-blue ml-[42px]">Real-time ledger of all stock additions (GRNs) and deductions (Shopfloor Issues).</p>
            </div>
          </div>
          <SmartTable 
            title="Stock Movement Ledger"
            columns={txColumns}
            data={transactions}
            isLoading={false}
            exportFilename="Inventory_Ledger"
          />
        </div>
      )}

      {/* TAB 3: MATERIAL ISSUES */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="h-8 w-8 rounded-[10px] bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                  <PackageMinus className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-ink tracking-tight">Material Issues & Requisitions</h2>
              </div>
              <p className="text-xs text-silver-blue ml-[42px]">Track raw material blocks, standard hardware, and parts issued to machine shop sections.</p>
            </div>
            {!isProjectClosed && (
              <Button variant="primary" size="md" onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Issue Material</span>
              </Button>
            )}
          </div>
          <SmartTable 
            title="Material Issues"
            columns={issueColumns}
            data={materialHeaders}
            isLoading={false}
            exportFilename="Material_Requisitions"
          />
        </div>
      )}

      {/* MODALS */}
      {isFormOpen && (
        <Modal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)}
          title="Material Issue Requisition"
          subtitle="Dispatch raw materials and inventory batches from stores to shopfloor sections."
          maxWidth="3xl"
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
        <div className="fixed inset-0 z-[200] bg-canvas overflow-y-auto">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-canvas rounded-[12px] border border-border-gray text-xs">
              <div>
                <span className="text-cool-gray font-semibold block uppercase tracking-wider text-[10px]">GRN Number</span>
                <span className="font-mono font-semibold text-ink">{viewingGrnDetails.grnNumber}</span>
              </div>
              <div>
                <span className="text-cool-gray font-semibold block uppercase tracking-wider text-[10px]">PO Reference</span>
                <span className="font-mono font-semibold text-ink">{viewingGrnDetails.poHeader?.poNumber || viewingGrnDetails.documentNumber || 'PO-001'}</span>
              </div>
              <div>
                <span className="text-cool-gray font-semibold block uppercase tracking-wider text-[10px]">Supplier Challan</span>
                <span className="font-mono text-ink">{viewingGrnDetails.supplierChallan || '-'}</span>
              </div>
              <div>
                <span className="text-cool-gray font-semibold block uppercase tracking-wider text-[10px]">Date Received</span>
                <span className="font-mono text-ink">{new Date(viewingGrnDetails.createdAt || Date.now()).toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            {/* Received Items Table */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink mb-2">Received Goods Line Items</h4>
              <div className="border border-border-gray rounded-[12px] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-canvas text-cool-gray font-semibold text-[10px] uppercase tracking-wider border-b border-border-gray">
                    <tr>
                      <th className="p-2.5">Det #</th>
                      <th className="p-2.5">Tool #</th>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5 text-right">Ordered</th>
                      <th className="p-2.5 text-right">Received</th>
                      <th className="p-2.5 text-right">Accepted</th>
                      <th className="p-2.5 text-right">Rejected</th>
                      <th className="p-2.5 text-right">Rate (₹)</th>
                      <th className="p-2.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-gray">
                    {(viewingGrnDetails.items || []).map((item: any, idx: number) => (
                      <tr key={item.id || idx} className="hover:bg-canvas font-mono">
                        <td className="p-2.5 font-semibold text-ink">{item.detNo || idx + 1}</td>
                        <td className="p-2.5">{item.toolNo || project?.projectNumber || 'TOOL'}</td>
                        <td className="p-2.5 font-sans font-medium text-ink">{item.poItem?.material?.materialGrade || item.poItem?.material?.materialName || 'Raw Material'}</td>
                        <td className="p-2.5 text-right">{item.poItem?.orderedQty || item.receivedQty || 0}</td>
                        <td className="p-2.5 text-right font-semibold text-primary-dark">{item.receivedQty || 0}</td>
                        <td className="p-2.5 text-right font-semibold text-semantic-success-dark">{item.acceptedQty || 0}</td>
                        <td className="p-2.5 text-right font-semibold text-semantic-danger-dark">{item.rejectedQty || 0}</td>
                        <td className="p-2.5 text-right">₹{Number(item.actualRate || 0).toLocaleString()}</td>
                        <td className="p-2.5 text-right font-semibold text-ink">₹{Number(item.total || item.basicCost || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="white"
                size="sm"
                onClick={() => handleExportGrnRow(viewingGrnDetails)}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Export Excel
              </Button>
              <Button variant="white" size="sm" onClick={() => setViewingGrnDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
