"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../components/layout/AppLayout';
import { Button } from '../../components/ui/Button';
import { useInventoryLedger } from '../../hooks/useInventory';
import { useMasterData } from '../../hooks/useMasterData';
import { useProjects } from '../../hooks/useProjects';
import { InventoryService } from '../../services/inventory.service';
import { ProcurementService } from '../../services/procurement.service';
import { ProductionService } from '../../services/production.service';
import { 
  Package, Search, Filter, AlertTriangle, Plus, ArrowRight, Wrench, 
  CheckCircle2, X, PackageMinus, AlertCircle, Trash2, Factory,
  PackageCheck, FileText, Printer, Download, Eye, Layers, ArrowUpRight,
  TrendingUp, ShieldCheck
} from 'lucide-react';
import { formatDate } from '../../lib/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTION_SHOPS } from '@/constants/productionShops';
import { AuthenticMaterialIssueDocument } from "@/modules/production/AuthenticMaterialIssueDocument";
import { exportGrnToExcel } from "@/modules/procurement/grnExcelExporter";
import { exportMaterialIssueToExcel } from "@/modules/production/materialIssueExcelExporter";

export default function InventoryPage() {
  const { data: ledger = [], isLoading: isLedgerLoading, refetch: refetchLedger } = useInventoryLedger();
  const { data: materials = [] } = useMasterData('materials');
  const { data: employees = [] } = useMasterData('employees');
  const { data: projects = [] } = useProjects();

  const [activeTab, setActiveTab] = useState<'grn' | 'ledger' | 'issues'>('ledger');
  const [searchTerm, setSearchTerm] = useState('');

  // Global GRNs & Material Issues State
  const [grns, setGrns] = useState<any[]>([]);
  const [isGrnsLoading, setIsGrnsLoading] = useState(false);
  
  const [materialIssues, setMaterialIssues] = useState<any[]>([]);
  const [isIssuesLoading, setIsIssuesLoading] = useState(false);

  // Modals & Previews State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isIssueMaterialOpen, setIsIssueMaterialOpen] = useState(false);
  const [viewingGrnDetails, setViewingGrnDetails] = useState<any | null>(null);
  const [printIssueData, setPrintIssueData] = useState<any | null>(null);

  // Forms State
  const [stockForm, setStockForm] = useState({
    materialId: '',
    batchNumber: '',
    heatNumber: '',
    currentQty: 1,
    unitCost: 0,
  });

  const [issueForm, setIssueForm] = useState({
    projectId: '',
    issueNumber: `ISS-${Date.now().toString().slice(-6)}`,
    productionSection: 'MACHINE_SHOP',
    issuedToEmployeeId: '',
    issuedTo: '',
    remarks: '',
    expectedManufactureQty: '' as string | number,
    items: [{ batchId: '', qty: 1, remarks: '' }]
  });

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchGrns = async () => {
    try {
      setIsGrnsLoading(true);
      const data = await ProcurementService.getAllGoodsReceipts();
      setGrns(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Failed to load global GRNs:", err);
    } finally {
      setIsGrnsLoading(false);
    }
  };

  const fetchMaterialIssues = async () => {
    try {
      setIsIssuesLoading(true);
      const data = await ProductionService.getAllMaterialIssues();
      setMaterialIssues(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Failed to load global Material Issues:", err);
    } finally {
      setIsIssuesLoading(false);
    }
  };

  useEffect(() => {
    fetchGrns();
    fetchMaterialIssues();
  }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockForm.materialId || stockForm.currentQty <= 0) {
      return showToast('error', 'Please select a material and enter quantity.');
    }
    try {
      await InventoryService.createBatch(stockForm);
      showToast('success', 'Stock batch added to Inventory Ledger!');
      setIsAddStockOpen(false);
      setStockForm({ materialId: '', batchNumber: '', heatNumber: '', currentQty: 1, unitCost: 0 });
      refetchLedger();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add stock batch.');
    }
  };

  const handleOpenIssueDrawer = (batch?: any) => {
    setIssueForm({
      projectId: projects[0]?.id || '',
      issueNumber: `ISS-${Date.now().toString().slice(-6)}`,
      productionSection: 'MACHINE_SHOP',
      issuedToEmployeeId: '',
      issuedTo: '',
      remarks: batch ? `Material issue from batch ${batch.batchNumber}` : '',
      expectedManufactureQty: '',
      items: [{ batchId: batch ? batch.id : '', qty: 1, remarks: '' }]
    });
    setIsIssueMaterialOpen(true);
  };

  const handleIssueMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.projectId) {
      return showToast('error', 'Please select a target project for material issuing.');
    }

    if (!issueForm.productionSection) {
      return showToast('error', 'Please select the target Production Shop.');
    }

    if (issueForm.productionSection === 'PRESS_SHOP') {
      const qty = Number(issueForm.expectedManufactureQty);
      if (!qty || !Number.isInteger(qty) || qty < 1) {
        return showToast('error', 'Press Shop requires a valid Expected Manufacture Quantity (>= 1).');
      }
    }

    for (const item of issueForm.items) {
      if (!item.batchId) {
        return showToast('error', 'Please select an inventory batch for all items.');
      }
      const targetBatch = ledger?.find((b: any) => b.id === item.batchId);
      const avail = Number(targetBatch?.availableQty ?? targetBatch?.currentQty ?? 0);
      if (item.qty <= 0) {
        return showToast('error', 'Issued quantity must be greater than 0.');
      }
      if (item.qty > avail) {
        return showToast('error', `Requested ${item.qty} units, but Batch ${targetBatch?.batchNumber || ''} only has ${avail} available.`);
      }
    }

    try {
      await ProductionService.issueMaterial(issueForm.projectId, {
        issueNumber: issueForm.issueNumber,
        productionSection: issueForm.productionSection,
        remarks: issueForm.remarks,
        ...(issueForm.productionSection === 'PRESS_SHOP' && issueForm.expectedManufactureQty
          ? { expectedManufactureQty: Number(issueForm.expectedManufactureQty) }
          : {}),
        items: issueForm.items.map(i => ({
          inventoryBatchId: i.batchId,
          issuedQty: Number(i.qty),
          remarks: i.remarks
        }))
      });
      showToast('success', 'Material issued successfully in inventory ledger!');
      setIsIssueMaterialOpen(false);
      refetchLedger();
      fetchMaterialIssues();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to issue material.');
    }
  };

  const handleExportGrnRow = (rawGrn: any) => {
    exportGrnToExcel({
      grnNumber: rawGrn.grnNumber || 'GRN-001',
      poNumber: rawGrn.poHeader?.poNumber || rawGrn.documentNumber || 'PO-001',
      supplierChallan: rawGrn.supplierChallan || '',
      date: new Date(rawGrn.createdAt || Date.now()).toLocaleDateString('en-GB'),
      vendorName: rawGrn.poHeader?.vendor?.vendorName || rawGrn.project?.customer?.companyName || 'Primary Supplier',
      items: (rawGrn.items || []).map((item: any) => ({
        toolNo: item.toolNo || rawGrn.project?.projectNumber || 'TOOL',
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

  const handleExportIssueRow = (rawIssue: any) => {
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

  // Filtered lists
  const filteredLedger = ledger?.filter((batch: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      batch.material?.materialCode?.toLowerCase().includes(term) ||
      batch.material?.materialGrade?.toLowerCase().includes(term) ||
      batch.batchNumber?.toLowerCase().includes(term) ||
      batch.heatNumber?.toLowerCase().includes(term) ||
      batch.location?.warehouse?.warehouseName?.toLowerCase().includes(term)
    );
  });

  const filteredGrns = grns.filter((g: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      g.grnNumber?.toLowerCase().includes(term) ||
      g.poHeader?.poNumber?.toLowerCase().includes(term) ||
      g.project?.projectNumber?.toLowerCase().includes(term) ||
      g.supplierChallan?.toLowerCase().includes(term) ||
      g.poHeader?.vendor?.vendorName?.toLowerCase().includes(term)
    );
  });

  const filteredIssues = materialIssues.filter((i: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      i.issueNumber?.toLowerCase().includes(term) ||
      i.project?.projectNumber?.toLowerCase().includes(term) ||
      i.productionSection?.toLowerCase().includes(term) ||
      i.issuedTo?.toLowerCase().includes(term)
    );
  });

  // Calculate live statistics
  const totalLedgerBatches = ledger?.length || 0;
  const totalStockQty = ledger?.reduce((sum: number, b: any) => sum + Number(b.availableQty ?? b.currentQty ?? 0), 0) || 0;
  const totalStockValuation = ledger?.reduce((sum: number, b: any) => sum + (Number(b.availableQty ?? b.currentQty ?? 0) * Number(b.unitCost || 0)), 0) || 0;
  const lowStockCount = ledger?.filter((b: any) => Number(b.availableQty ?? b.currentQty ?? 0) <= Number(b.material?.minStockLevel || 0)).length || 0;

  return (
    <AppLayout>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-md shadow-level-4 backdrop-blur-xl border flex items-center space-x-3 text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200'
                : 'bg-rose-50/90 text-rose-800 border-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
            <span>{toastMessage.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex flex-col space-y-6">
        
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-border-gray p-6 rounded-[12px] shadow-subtle">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
                ToolRoom Enterprise Inventory
              </span>
            </div>
            <h1 className="text-section-heading font-bold text-ink tracking-tight">
              Inventory & Stores Management
            </h1>
            <p className="text-body text-silver-blue mt-1">
              End-to-end material flow control: Goods Receipts (GRN) In $\rightarrow$ Live Stock Ledger $\rightarrow$ Material Issues Out.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => handleOpenIssueDrawer()}
            >
              <PackageMinus className="w-4 h-4 mr-1.5" />
              <span>Issue Material</span>
            </Button>

            <Button
              variant="white"
              onClick={() => setIsAddStockOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5 text-primary" />
              <span>Add Stock Batch</span>
            </Button>

            <Link href="/assets">
              <Button variant="white">
                <Wrench className="w-4 h-4 mr-1.5 text-silver-blue" />
                <span>Assets & Tools</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 3 Interactive Primary Tabs */}
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
              {grns.length}
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
            <span>Live Inventory Ledger</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'ledger' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-700'
            }`}>
              {totalLedgerBatches}
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
              {materialIssues.length}
            </span>
          </button>
        </div>

        {/* Global Summary KPI Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-border-gray p-4 rounded-[12px] shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-cool-gray">Total Stock Batches</span>
              <p className="text-xl font-bold font-mono text-ink mt-0.5">{totalLedgerBatches}</p>
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-primary-subtle border border-primary/20 flex items-center justify-center text-primary">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-border-gray p-4 rounded-[12px] shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-cool-gray">Total Stock Qty</span>
              <p className="text-xl font-bold font-mono text-ink mt-0.5">{totalStockQty.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-border-gray p-4 rounded-[12px] shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-cool-gray">Total Valuation</span>
              <p className="text-xl font-bold font-mono text-ink mt-0.5">
                ₹{totalStockValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-border-gray p-4 rounded-[12px] shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-cool-gray">Low Stock Alerts</span>
              <p className="text-xl font-bold font-mono text-rose-600 mt-0.5">{lowStockCount}</p>
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex justify-between items-center gap-4 bg-white border border-border-gray p-3 rounded-[12px] shadow-subtle">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-silver-blue" />
            <input 
              type="text" 
              placeholder={
                activeTab === 'grn' 
                  ? "Search by GRN #, PO #, Project, Heat # or Supplier..." 
                  : activeTab === 'issues' 
                  ? "Search by Issue #, Project, Section, or Recipient..." 
                  : "Search by material code, grade, heat # or batch..."
              }
              className="w-full bg-canvas border border-border-gray rounded-[10px] pl-10 pr-4 py-2 text-xs text-ink placeholder:text-silver-blue focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="text-xs font-semibold text-cool-gray">
            Showing {
              activeTab === 'grn' ? filteredGrns.length : activeTab === 'issues' ? filteredIssues.length : filteredLedger?.length
            } records
          </div>
        </div>

        {/* TAB 1: GOODS RECEIPTS (GRN) */}
        {activeTab === 'grn' && (
          <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
            {isGrnsLoading ? (
              <div className="p-12 text-center text-silver-blue">Loading Goods Receipts...</div>
            ) : filteredGrns.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <PackageCheck className="w-12 h-12 text-silver-blue mx-auto" />
                <p className="text-sm font-semibold text-ink">No Goods Receipt Notes found</p>
                <p className="text-xs text-silver-blue">GRNs are created when receiving material against Purchase Orders.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-canvas text-ink/70 font-semibold border-b border-border-gray text-[11px] uppercase tracking-wider">
                      <th className="p-3.5">GRN #</th>
                      <th className="p-3.5">Project</th>
                      <th className="p-3.5">PO Number</th>
                      <th className="p-3.5">Supplier / Challan</th>
                      <th className="p-3.5 text-center">Items</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-gray">
                    {filteredGrns.map((grn: any) => (
                      <tr key={grn.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">
                          {grn.grnNumber}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 border border-border-gray text-ink">
                            {grn.project?.projectNumber || 'PROJECT'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-ink">
                          {grn.poHeader?.poNumber || '-'}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-ink">{grn.poHeader?.vendor?.vendorName || 'Primary Supplier'}</div>
                          <div className="text-[10px] text-mute">{grn.supplierChallan ? `Challan: ${grn.supplierChallan}` : 'Direct Receipt'}</div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-semibold text-ink">
                          {grn.items?.length || 0}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                            {grn.status || 'COMPLETED'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-mute text-[11px]">
                          {new Date(grn.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingGrnDetails(grn)}
                              className="p-1.5 rounded-[10px] bg-primary-subtle hover:bg-primary-subtle/80 text-primary border border-primary/20 text-[10px] uppercase font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="View Full GRN Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => handleExportGrnRow(grn)}
                              className="p-1.5 rounded-[10px] bg-semantic-success-subtle hover:bg-semantic-success-subtle/80 text-semantic-success-dark border border-semantic-success/20 text-[10px] uppercase font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Export GRN Excel"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Excel</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE INVENTORY LEDGER */}
        {activeTab === 'ledger' && (
          <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
            {isLedgerLoading ? (
              <div className="p-12 text-center text-silver-blue">Loading Inventory Ledger...</div>
            ) : filteredLedger?.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package className="w-12 h-12 text-silver-blue mx-auto" />
                <p className="text-sm font-semibold text-ink">No Stock Batches found</p>
                <p className="text-xs text-silver-blue">Add stock batches or process GRNs to populate the ledger.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-canvas text-ink/70 font-semibold border-b border-border-gray text-[11px] uppercase tracking-wider">
                      <th className="p-3.5">Material & Batch</th>
                      <th className="p-3.5">Warehouse & Location</th>
                      <th className="p-3.5 text-right">Available Qty</th>
                      <th className="p-3.5 text-right">Unit Rate (₹)</th>
                      <th className="p-3.5 text-right">Total Valuation (₹)</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-gray font-medium">
                    {filteredLedger?.map((batch: any) => {
                      const availQty = Number(batch.availableQty ?? batch.currentQty ?? 0);
                      const isLowStock = availQty <= Number(batch.material?.minStockLevel || 0);
                      return (
                        <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-[8px] bg-amber-50 border border-amber-200 flex items-center justify-center mr-3 shrink-0">
                                <Package className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-ink text-sm">
                                  {batch.material?.materialCode} <span className="text-mute font-normal">· {batch.material?.materialGrade || batch.material?.materialName}</span>
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono uppercase flex items-center gap-1.5 mt-0.5">
                                  <span className="font-bold text-zinc-600">{batch.batchNumber}</span>
                                  {batch.heatNumber && <span>· Heat: {batch.heatNumber}</span>}
                                  <span>· {formatDate(batch.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="text-xs font-semibold text-zinc-800">{batch.location?.warehouse?.warehouseName || 'Main Stores'}</div>
                            <div className="text-[10px] text-zinc-400 uppercase font-semibold">{batch.location?.locationName || 'Bin A-1'}</div>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end space-x-1.5 font-mono">
                              {isLowStock && <span title="Low stock threshold"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></span>}
                              <span className="font-bold text-ink text-sm">{availQty}</span>
                              <span className="text-[10px] text-mute uppercase font-semibold">{batch.material?.defaultUom || 'NOS'}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right font-mono text-zinc-600">
                            ₹{Number(batch.unitCost).toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right font-mono font-semibold text-primary-dark text-sm">
                            ₹{(availQty * Number(batch.unitCost)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                              batch.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              batch.status === 'RESERVED' ? 'bg-primary-subtle text-primary-dark border-primary/20' : 
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {batch.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {batch.status === 'AVAILABLE' && availQty > 0 && (
                              <button
                                onClick={() => handleOpenIssueDrawer(batch)}
                                className="text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-[10px] transition-all inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <PackageMinus className="w-3.5 h-3.5 mr-1 text-purple-600" />
                                <span>Issue Stock</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MATERIAL ISSUES (MIN) */}
        {activeTab === 'issues' && (
          <div className="bg-white border border-border-gray rounded-[12px] shadow-subtle overflow-hidden">
            {isIssuesLoading ? (
              <div className="p-12 text-center text-silver-blue">Loading Material Issues...</div>
            ) : filteredIssues.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <PackageMinus className="w-12 h-12 text-silver-blue mx-auto" />
                <p className="text-sm font-semibold text-ink">No Material Issues found</p>
                <p className="text-xs text-silver-blue">Click "Issue Material" above to issue raw materials to shopfloor operations.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-canvas text-ink/70 font-semibold border-b border-border-gray text-[11px] uppercase tracking-wider">
                      <th className="p-3.5">Issue Slip #</th>
                      <th className="p-3.5">Project</th>
                      <th className="p-3.5">Production Section</th>
                      <th className="p-3.5">Issued To</th>
                      <th className="p-3.5 text-center">Items Count</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-gray">
                    {filteredIssues.map((issue: any) => (
                      <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-purple-700">
                          {issue.issueNumber}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 border border-border-gray text-ink">
                            {issue.project?.projectNumber || 'PROJECT'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                            {issue.productionSection?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-ink">
                          {issue.issuedTo || 'Shopfloor Operator'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-semibold text-ink">
                          {issue.items?.length || 0}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                            {issue.status || 'ISSUED'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-mute text-[11px]">
                          {new Date(issue.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setPrintIssueData(issue)}
                              className="p-1.5 rounded-[10px] bg-canvas hover:bg-white text-ink border border-border-gray text-[10px] uppercase font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Print Material Issue Slip"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print Slip</span>
                            </button>
                            <button
                              onClick={() => handleExportIssueRow(issue)}
                              className="p-1.5 rounded-[10px] bg-semantic-success-subtle hover:bg-semantic-success-subtle/80 text-semantic-success-dark border border-semantic-success/20 text-[10px] uppercase font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Export Issue Excel"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Excel</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* VIEW GRN DETAILS MODAL */}
      {viewingGrnDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[12px] shadow-level-4 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center bg-canvas/50">
              <div>
                <h2 className="text-base font-bold text-ink flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" />
                  <span>Goods Receipt Note Details: {viewingGrnDetails.grnNumber}</span>
                </h2>
                <p className="text-xs text-silver-blue mt-0.5">
                  PO: <span className="font-mono font-semibold text-ink">{viewingGrnDetails.poHeader?.poNumber || 'N/A'}</span> · Date: {new Date(viewingGrnDetails.createdAt).toLocaleDateString('en-GB')}
                </p>
              </div>
              <button onClick={() => setViewingGrnDetails(null)} className="p-2 hover:bg-zinc-200 rounded-[10px] text-silver-blue hover:text-ink transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-3 gap-4 p-4 bg-canvas/60 rounded-[10px] border border-border-gray text-xs">
                <div>
                  <span className="text-cool-gray uppercase font-semibold">Vendor:</span>
                  <p className="font-bold text-ink mt-0.5">{viewingGrnDetails.poHeader?.vendor?.vendorName || 'Primary Supplier'}</p>
                </div>
                <div>
                  <span className="text-cool-gray uppercase font-semibold">Supplier Challan:</span>
                  <p className="font-mono font-bold text-ink mt-0.5">{viewingGrnDetails.supplierChallan || '-'}</p>
                </div>
                <div>
                  <span className="text-cool-gray uppercase font-semibold">Status:</span>
                  <p className="font-bold text-emerald-700 mt-0.5">{viewingGrnDetails.status || 'COMPLETED'}</p>
                </div>
              </div>

              <div className="border border-border-gray rounded-[10px] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-zinc-100 text-ink/70 font-semibold border-b border-border-gray text-[10px] uppercase">
                      <th className="p-2">DET</th>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-center">Dimensions (mm)</th>
                      <th className="p-2 text-center">Heat #</th>
                      <th className="p-2 text-right">Recv Qty</th>
                      <th className="p-2 text-right">Total Wt (kg)</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Basic (₹)</th>
                      <th className="p-2 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-gray font-mono text-[11px]">
                    {(viewingGrnDetails.items || []).map((item: any, idx: number) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-bold text-ink">{item.detNo || idx + 1}</td>
                        <td className="p-2 font-sans font-semibold text-ink">{item.remarks || item.poItem?.material?.materialGrade || 'Raw Material'}</td>
                        <td className="p-2 text-center text-zinc-600">
                          {item.length && item.width && item.height ? `${item.length}×${item.width}×${item.height}` : '-'}
                        </td>
                        <td className="p-2 text-center font-bold text-amber-700">{item.heatNumber || '-'}</td>
                        <td className="p-2 text-right font-bold text-ink">{item.receivedQty}</td>
                        <td className="p-2 text-right text-emerald-700">{item.totalWeight ? Number(item.totalWeight).toFixed(2) : '-'}</td>
                        <td className="p-2 text-right text-zinc-700">{item.actualRate ? Number(item.actualRate).toFixed(2) : '-'}</td>
                        <td className="p-2 text-right font-semibold text-ink">{item.basicCost ? Number(item.basicCost).toFixed(2) : '-'}</td>
                        <td className="p-2 text-right font-bold text-primary">{item.total ? Number(item.total).toFixed(2) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border-gray bg-canvas/50 flex justify-end gap-2">
              <Button variant="white" onClick={() => handleExportGrnRow(viewingGrnDetails)}>
                <Download className="w-4 h-4 mr-1.5" />
                <span>Export Excel</span>
              </Button>
              <Button variant="primary" onClick={() => setViewingGrnDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT MATERIAL ISSUE SLIP MODAL */}
      {printIssueData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[12px] shadow-level-4 max-w-4xl w-full p-6 my-8 space-y-4">
            <div className="flex justify-between items-center border-b border-border-gray pb-3 hide-on-print">
              <h3 className="font-bold text-ink">Material Issue Slip: {printIssueData.issueNumber}</h3>
              <button onClick={() => setPrintIssueData(null)} className="p-1 hover:bg-zinc-100 rounded text-silver-blue hover:text-ink cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <AuthenticMaterialIssueDocument
              data={{
                issueNumber: printIssueData.issueNumber || "ISS-001",
                jobCardNumber: printIssueData.jobCard?.jobCardNumber || "JC-GENERAL",
                operationName: printIssueData.productionSection || "MACHINE_SHOP",
                operatorName: printIssueData.issuedTo || "General Operator",
                date: new Date(printIssueData.createdAt || Date.now()).toLocaleDateString("en-GB"),
                remarks: printIssueData.remarks || "",
                items: (printIssueData.items || []).map((i: any) => ({
                  materialName: i.inventoryBatch?.material?.materialName || i.inventoryBatch?.material?.materialGrade || "Raw Steel",
                  batchNumber: i.inventoryBatch?.batchNumber || "BATCH-001",
                  heatNumber: i.inventoryBatch?.heatNumber || "HT-001",
                  issuedQty: Number(i.issuedQty || 1),
                  unitCost: Number(i.inventoryBatch?.unitCost || 0),
                  totalValue: Number(i.materialValue || 0),
                  remarks: i.remarks || ""
                }))
              }}
              onBack={() => setPrintIssueData(null)}
            />
          </div>
        </div>
      )}

      {/* ADD STOCK BATCH MODAL */}
      <AnimatePresence>
        {isAddStockOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-md shadow-level-4 max-w-lg w-full overflow-hidden border border-hairline/80"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-ink">Add Stock Batch</h3>
                    <p className="text-xs text-mute">Record manual intake of raw material batch to Inventory Ledger.</p>
                  </div>
                </div>
                <button onClick={() => setIsAddStockOpen(false)} className="text-zinc-400 hover:text-ink transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStock} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Material Grade</label>
                  <select 
                    value={stockForm.materialId}
                    onChange={(e) => setStockForm({ ...stockForm, materialId: e.target.value })}
                    required
                    className="w-full border border-border-gray rounded-[10px] px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Material Grade --</option>
                    {materials.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.materialCode} - {m.materialGrade || m.materialName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Batch Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. BATCH-2026-01"
                      value={stockForm.batchNumber}
                      onChange={(e) => setStockForm({ ...stockForm, batchNumber: e.target.value })}
                      className="w-full border border-border-gray rounded-[10px] px-3.5 py-2 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Heat Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. HEAT-9942"
                      value={stockForm.heatNumber}
                      onChange={(e) => setStockForm({ ...stockForm, heatNumber: e.target.value })}
                      className="w-full border border-border-gray rounded-[10px] px-3.5 py-2 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Quantity</label>
                    <input 
                      type="number"
                      min="1"
                      value={stockForm.currentQty}
                      onChange={(e) => setStockForm({ ...stockForm, currentQty: parseInt(e.target.value) || 1 })}
                      required
                      className="w-full border border-border-gray rounded-[10px] px-3.5 py-2 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Unit Cost (₹)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={stockForm.unitCost}
                      onChange={(e) => setStockForm({ ...stockForm, unitCost: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-border-gray rounded-[10px] px-3.5 py-2 text-xs font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-border-gray">
                  <Button type="button" variant="white" onClick={() => setIsAddStockOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Add to Ledger</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ISSUE MATERIAL MODAL */}
      <AnimatePresence>
        {isIssueMaterialOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-md shadow-level-4 max-w-2xl w-full overflow-hidden border border-hairline/80"
            >
              <div className="p-6 border-b border-hairline flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-md bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <PackageMinus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-ink">Material Requisition & Issue</h3>
                    <p className="text-xs text-mute">Issue material batches to shopfloor operations and projects.</p>
                  </div>
                </div>
                <button onClick={() => setIsIssueMaterialOpen(false)} className="text-zinc-400 hover:text-ink transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleIssueMaterial} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Target Project</label>
                    <select 
                      value={issueForm.projectId}
                      onChange={(e) => setIssueForm({ ...issueForm, projectId: e.target.value })}
                      required
                      className="w-full border border-border-gray rounded-[10px] px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Project --</option>
                      {projects.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.projectNumber} - {p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Production Section</label>
                    <select 
                      value={issueForm.productionSection}
                      onChange={(e) => setIssueForm({ ...issueForm, productionSection: e.target.value })}
                      required
                      className="w-full border border-border-gray rounded-[10px] px-3.5 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                    >
                      {PRODUCTION_SHOPS.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {issueForm.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-canvas/60 border border-border-gray rounded-[10px] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-ink uppercase">Item #{idx + 1}</span>
                      {issueForm.items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setIssueForm({ ...issueForm, items: issueForm.items.filter((_, i) => i !== idx) })}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-8">
                        <label className="block text-[10px] font-semibold text-cool-gray uppercase mb-1">Select Batch</label>
                        <select 
                          value={item.batchId}
                          onChange={(e) => {
                            const newItems = [...issueForm.items];
                            newItems[idx].batchId = e.target.value;
                            setIssueForm({ ...issueForm, items: newItems });
                          }}
                          required
                          className="w-full border border-border-gray rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- Choose Stock Batch --</option>
                          {ledger?.filter((b: any) => Number(b.availableQty ?? b.currentQty ?? 0) > 0).map((b: any) => (
                            <option key={b.id} value={b.id}>
                              {b.batchNumber} ({b.material?.materialCode} · Avail: {b.availableQty ?? b.currentQty} {b.material?.defaultUom || 'NOS'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <label className="block text-[10px] font-semibold text-cool-gray uppercase mb-1">Issue Qty</label>
                        <input 
                          type="number" 
                          min="1"
                          value={item.qty}
                          onChange={(e) => {
                            const newItems = [...issueForm.items];
                            newItems[idx].qty = parseInt(e.target.value) || 1;
                            setIssueForm({ ...issueForm, items: newItems });
                          }}
                          required
                          className="w-full border border-border-gray rounded px-2.5 py-1.5 text-xs font-mono bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    onClick={() => setIssueForm({ ...issueForm, items: [...issueForm.items, { batchId: '', qty: 1, remarks: '' }] })}
                    className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Item</span>
                  </button>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-border-gray">
                  <Button type="button" variant="white" onClick={() => setIsIssueMaterialOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Confirm Issue</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppLayout>
  );
}
