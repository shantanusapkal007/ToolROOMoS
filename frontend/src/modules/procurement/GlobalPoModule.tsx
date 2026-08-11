"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  FileText, 
  Building2, 
  Download, 
  Eye, 
  Search,
  Layers,
  ChevronRight,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Clock,
  Archive,
  RefreshCw,
  DollarSign,
  Package
} from 'lucide-react';
import { ProcurementService } from '@/services/procurement.service';
import { MultiProjectPoWizard, parseLwh } from './MultiProjectPoWizard';
import { AuthenticPoDocument } from './AuthenticPoDocument';
import { exportPoToExcel } from './poExcelExporter';
import { SkeletonBox } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';

export function GlobalPoModule() {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'dead'>('create');
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [deadMaterials, setDeadMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDead, setIsLoadingDead] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewPo, setPreviewPo] = useState<any | null>(null);

  useEffect(() => {
    fetchGlobalOrders();
    fetchDeadMaterials();
  }, []);

  const fetchGlobalOrders = async () => {
    setIsLoading(true);
    try {
      const res = await ProcurementService.getAllGlobalPurchaseOrders();
      setPurchaseOrders(res?.data || []);
    } catch (err) {
      console.warn("Could not fetch global POs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeadMaterials = async () => {
    setIsLoadingDead(true);
    try {
      const res = await ProcurementService.getDeadMaterials();
      setDeadMaterials(res?.data || res || []);
    } catch (err) {
      console.warn("Could not fetch dead materials:", err);
    } finally {
      setIsLoadingDead(false);
    }
  };

  const filteredOrders = purchaseOrders.filter(po => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      po.poNumber?.toLowerCase().includes(q) ||
      po.vendor?.vendorName?.toLowerCase().includes(q) ||
      po.project?.projectNumber?.toLowerCase().includes(q)
    );
  });

  const filteredDeadMaterials = deadMaterials.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.batchNumber?.toLowerCase().includes(q) ||
      item.heatNumber?.toLowerCase().includes(q) ||
      item.toolNo?.toLowerCase().includes(q) ||
      item.materialGrade?.toLowerCase().includes(q) ||
      item.grnNumber?.toLowerCase().includes(q)
    );
  });

  const totalValue = purchaseOrders.reduce((acc, po) => acc + (Number(po.totalAmount) || 0), 0);
  const totalCount = purchaseOrders.length;
  const deadCount = deadMaterials.length;
  const totalDeadValue = deadMaterials.reduce((acc, i) => acc + (Number(i.totalIdleValue) || 0), 0);

  const handleReallocateDead = (id: string, batchNumber: string) => {
    success("Material Reallocated", `Dead batch ${batchNumber} marked for active project reallocation.`);
    setDeadMaterials(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6 text-ink font-sans">
      
      {/* Top Header Bar */}
      <div className="bg-white p-5 rounded-[12px] border border-border-gray/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 hide-on-print">
        <div>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center text-xs font-semibold text-zinc-400 mb-1">
            <span className="hover:text-zinc-600 transition-colors">Procurement</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-zinc-300" />
            <span className="text-ink font-semibold bg-zinc-100 px-2 py-0.5 rounded-[12px] border border-border-gray/60">Multi-Project Purchase Orders</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-semibold shadow-subtle">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-ink tracking-tight flex items-center gap-2">
                <span>Global Purchase Order Module</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                  ENTERPRISE
                </span>
              </h1>
              <p className="text-xs text-mute">
                Consolidate material requirements across tool projects into authentic supplier Purchase Orders
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center p-1 bg-zinc-100 rounded-[12px] border border-border-gray/80 gap-1">
          <button
            onClick={() => { setActiveTab('create'); setPreviewPo(null); }}
            className={`px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'create'
                ? "bg-indigo-600 text-white shadow-subtle"
                : "text-zinc-600 hover:text-ink hover:bg-white"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create PO</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); setPreviewPo(null); }}
            className={`px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? "bg-indigo-600 text-white shadow-subtle"
                : "text-zinc-600 hover:text-ink hover:bg-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>PO Register ({totalCount})</span>
          </button>

          <button
            onClick={() => { setActiveTab('dead'); setPreviewPo(null); }}
            className={`px-4 py-2 rounded-[12px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dead'
                ? "bg-rose-600 text-white shadow-subtle"
                : "text-zinc-600 hover:text-rose-600 hover:bg-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Dead Material ({deadCount})</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 hide-on-print">
        {/* Issued POs */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Issued POs</div>
            <div className="text-2xl font-semibold text-ink mt-0.5">{totalCount}</div>
            <div className="text-[10px] text-mute mt-0.5">Supplier purchase orders</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-primary-subtle flex items-center justify-center text-primary">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Total Procurement */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Procurement</div>
            <div className="text-2xl font-semibold text-emerald-700 mt-0.5">
              ₹{totalValue > 0 ? totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
            </div>
            <div className="text-[10px] text-mute mt-0.5">Total material spend</div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Dead Stock */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray/80 shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">Dead Stock (6+ Mths)</div>
            <div className="text-2xl font-semibold text-rose-700 mt-0.5">{deadCount} Batches</div>
            <div className="text-[10px] text-mute mt-0.5">
              Idle stock value: ₹{totalDeadValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-[12px] bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      {previewPo ? (
        <AuthenticPoDocument 
          data={{
            poNumber: previewPo.poNumber || "PUR/26-27/001",
            rmSlipNo: previewPo.rmSlipNo || "-",
            date: new Date(previewPo.createdAt || Date.now()).toLocaleDateString('en-GB'),
            vendorName: previewPo.vendor?.vendorName || previewPo.vendorName || "Standard Vendor",
            vendorAddress: previewPo.vendor?.address || "Pune",
            deliveryTerms: previewPo.deliveryTerms || "Immediate",
            items: (previewPo.items || []).map((item: any, idx: number) => ({
              id: item.id || `item-${idx}`,
              projectId: item.projectId || '',
              toolNo: item.project?.projectNumber || item.toolNo || 'KTD-GENERAL',
              detNo: item.detNo || `${idx + 1}`,
              length: item.length || '-',
              width: item.width || '-',
              height: item.height || '-',
              materialGrade: item.materialGrade || item.material?.materialGrade || 'MS',
              orderedQty: item.orderedQty || item.quantity || 1,
              apWt: item.apWt || item.unitWeight || 10,
              totalWt: item.totalWt || item.weight || 10,
              agreedRate: item.agreedRate || item.rate || 85,
              basicValue: item.basicValue || item.amount || 850,
              gstPercent: item.gstPercent || 18,
              gstAmount: item.gstAmount || 153,
              lineTotal: item.lineTotal || 1003,
              remarks: item.remarks || '',
            })),
          }}
          onBack={() => setPreviewPo(null)} 
        />
      ) : activeTab === 'create' ? (
        <MultiProjectPoWizard onSuccess={fetchGlobalOrders} />
      ) : activeTab === 'history' ? (
        <div className="bg-white rounded-[12px] border border-border-gray/80 shadow-subtle overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Purchase Order Register</h3>
              <p className="text-xs text-mute">History of issued multi-project and single project purchase orders</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PO #, vendor, project..."
                className="pl-9 pr-3.5 py-2 bg-canvas border border-border-gray rounded-[12px] text-xs text-ink focus:bg-white outline-none w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-border-gray/80 rounded-[12px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-border-gray text-mute uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">PO Number</th>
                  <th className="p-3">Vendor / Supplier</th>
                  <th className="p-3 text-right">Items</th>
                  <th className="p-3 text-right">Total Amount (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center"><SkeletonBox className="h-10 w-full" /></td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-canvas transition-colors">
                      <td className="p-3 font-mono font-semibold text-primary-dark">{po.poNumber}</td>
                      <td className="p-3 font-semibold text-ink">{po.vendor?.vendorName || po.vendorName || "Standard Vendor"}</td>
                      <td className="p-3 text-right font-mono font-semibold">{po.items?.length || 1} items</td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-700">₹{(Number(po.totalAmount) || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {po.status || "ISSUED"}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => setPreviewPo(po)}
                          className="px-2.5 py-1 rounded-[12px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View PO
                        </button>
                        <button
                          onClick={() => exportPoToExcel(po)}
                          className="px-2.5 py-1 rounded-[12px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors border border-emerald-200"
                        >
                          <Download className="w-3 h-3" /> Excel
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400 italic">
                      No purchase orders found. Click 'Create PO' to issue a new multi-project order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Dead Material Register */
        <div className="bg-white rounded-[12px] border border-border-gray/80 shadow-subtle overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Dead Material & Excess Stock Register</span>
              </h3>
              <p className="text-xs text-mute">Unused steel batches idle for over 6 months available for re-allocation</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-border-gray/80 rounded-[12px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-50 border-b border-rose-200 text-rose-800 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="p-3">Batch #</th>
                  <th className="p-3">Material Grade</th>
                  <th className="p-3">Dimensions / Spec</th>
                  <th className="p-3 text-right">Idle Qty (NOS)</th>
                  <th className="p-3 text-right">Idle Weight (KG)</th>
                  <th className="p-3 text-right">Idle Value (₹)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoadingDead ? (
                  <tr><td colSpan={7} className="p-8 text-center"><SkeletonBox className="h-10 w-full" /></td></tr>
                ) : filteredDeadMaterials.length > 0 ? (
                  filteredDeadMaterials.map((item) => (
                    <tr key={item.id} className="hover:bg-canvas transition-colors">
                      <td className="p-3 font-mono font-semibold text-ink">{item.batchNumber}</td>
                      <td className="p-3 font-mono font-semibold text-rose-700">{item.materialGrade}</td>
                      <td className="p-3 text-zinc-600 font-mono">{item.dimensions || item.spec || "-"}</td>
                      <td className="p-3 text-right font-mono font-semibold">{item.idleQty || 1} NOS</td>
                      <td className="p-3 text-right font-mono font-semibold">{item.idleWeight || 0} KG</td>
                      <td className="p-3 text-right font-mono font-semibold text-rose-700">₹{(Number(item.totalIdleValue) || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleReallocateDead(item.id, item.batchNumber)}
                          className="px-3 py-1 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-colors shadow-subtle"
                        >
                          <RefreshCw className="w-3 h-3" /> Reallocate
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400 italic">
                      No dead stock batches detected. All inventory is active and allocated.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
