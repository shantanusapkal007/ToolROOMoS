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
  RefreshCw
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
    <div className="space-y-5 text-zinc-900 font-sans">
      
      {/* Apple-Level Spatial Glass Header */}
      <div className="bg-white/90 backdrop-blur-xl border border-zinc-200/80 rounded-2xl p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 hide-on-print transition-all">
        <div>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center text-xs font-semibold text-zinc-400 mb-1.5">
            <span className="hover:text-zinc-600 transition-colors">Procurement</span>
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-zinc-300" />
            <span className="text-zinc-900 font-bold bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200/60">Multi-Project Purchase Orders</span>
          </nav>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold shadow-md ring-1 ring-black/5">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-2">
                <span>Global Purchase Order Module</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  Enterprise
                </span>
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Consolidate material requirements across tool projects into authentic supplier Purchase Orders.
              </p>
            </div>
          </div>
        </div>

        {/* Clean Metric Stats & Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
          {/* Metrics */}
          <div className="flex items-center gap-3.5 bg-zinc-50/90 border border-zinc-200/80 rounded-xl px-4 py-2 shadow-2xs">
            <div>
              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-0.5">Issued POs</span>
              <span className="text-xs font-mono font-extrabold text-zinc-900 bg-zinc-200/60 px-2 py-0.5 rounded-md">{totalCount} Orders</span>
            </div>
            <div className="h-7 w-px bg-zinc-200" />
            <div>
              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-0.5">Total Procurement</span>
              <span className="text-xs font-mono font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                ₹{totalValue > 0 ? totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
              </span>
            </div>
            <div className="h-7 w-px bg-zinc-200" />
            <div>
              <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider block mb-0.5">Dead Stock (6+ Mths)</span>
              <span className="text-xs font-mono font-extrabold text-red-700 bg-red-50 border border-red-200/60 px-2 py-0.5 rounded-md">{deadCount} Batches</span>
            </div>
          </div>

          {/* Segmented Control Tabs */}
          <div className="flex items-center p-1 bg-zinc-100/90 rounded-xl border border-zinc-200/80 shadow-2xs">
            <button
              onClick={() => { setActiveTab('create'); setPreviewPo(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'create'
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-white/60"
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Create PO</span>
            </button>

            <button
              onClick={() => { setActiveTab('history'); setPreviewPo(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'history'
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-white/60"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>PO Register ({totalCount})</span>
            </button>

            <button
              onClick={() => { setActiveTab('dead'); setPreviewPo(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'dead'
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-zinc-600 hover:text-red-600 hover:bg-red-50"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Dead Material ({deadCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      {previewPo ? (
        <AuthenticPoDocument
          data={previewPo}
          onBack={() => setPreviewPo(null)}
        />
      ) : activeTab === 'create' ? (
        <MultiProjectPoWizard onSuccess={fetchGlobalOrders} />
      ) : activeTab === 'history' ? (
        /* PO Register / History Table */
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50">
            <div>
              <h3 className="font-bold text-sm text-zinc-950">Purchase Orders Register</h3>
              <p className="text-xs text-zinc-500">Historical log of issued multi-project and single-project purchase orders</p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PO #, vendor, project..."
                className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-zinc-900/10 w-64"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8">
              <SkeletonBox className="h-64 w-full" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 space-y-3">
              <ShoppingCart className="w-9 h-9 text-zinc-300 mx-auto" />
              <p className="text-sm font-bold text-zinc-800">No Purchase Orders Found</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Generate your multi-project Purchase Order using the wizard above.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Purchase Order</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100/70 text-zinc-600 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
                  <tr>
                    <th className="p-3">PO Number</th>
                    <th className="p-3">RM Slip No</th>
                    <th className="p-3">Vendor / Supplier</th>
                    <th className="p-3">Project / Tool</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredOrders.map((po) => {
                    const custom = (po.customFields as any) || {};
                    const items = po.items || [];
                    const poData = {
                      poNumber: po.poNumber,
                      rmSlipNo: custom.rmSlipNo || po.poNumber,
                      date: po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
                      vendorName: po.vendor?.vendorName || custom.vendorName || "",
                      vendorAddress: po.vendor?.address || custom.vendorAddress || "",
                      deliveryTerms: custom.deliveryTerms || "",
                      items: items.map((i: any, idx: number) => {
                        const itemCustom = (i.customFields as any) || {};
                        return {
                          toolNo: itemCustom.toolNo || po.project?.projectNumber || 'KTD-TOOL',
                          detNo: itemCustom.detNo || `${idx + 1}`,
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
                      <tr key={po.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-zinc-900">{po.poNumber}</td>
                        <td className="p-3 font-mono text-zinc-600">{custom.rmSlipNo || "-"}</td>
                        <td className="p-3 font-semibold text-zinc-800">{po.vendor?.vendorName || custom.vendorName || "Supplier"}</td>
                        <td className="p-3 font-bold text-blue-700">
                          {custom.isMultiProject ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200/80 text-[11px]">
                              Multi-Project ({items.length} Items)
                            </span>
                          ) : (
                            po.project?.projectNumber || "GENERAL"
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {po.status || "ISSUED"}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-zinc-900">
                          ₹{Number(po.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-zinc-500 font-mono text-xs">
                          {new Date(po.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setPreviewPo(poData)}
                              title="Preview Authentic Sheet"
                              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => exportPoToExcel(poData)}
                              title="Download Excel"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* DEAD MATERIAL REGISTER (6+ MONTHS UNUSED) */
        <div className="space-y-4">
          
          {/* Dead Material Alert Banner */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-red-950">Dead Material & Slow-Moving Stock Register</h3>
                <p className="text-xs text-red-800">
                  Materials received via GRN but unissued / unused for over <strong>6 Months (180+ Days)</strong> are automatically declared as Dead Material.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchDeadMaterials}
                className="px-3 py-1.5 bg-white text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-red-100 transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Evaluate Dead Batches</span>
              </button>
            </div>
          </div>

          {/* Dead Material Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Dead Stock Batches</span>
              <span className="text-lg font-mono font-black text-red-700 mt-0.5 block">{deadCount} Batches</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Idle Material Capital</span>
              <span className="text-lg font-mono font-black text-zinc-950 mt-0.5 block">
                ₹{totalDeadValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Longest Unused Duration</span>
              <span className="text-lg font-mono font-black text-red-600 mt-0.5 block">
                {deadMaterials.length > 0 ? `${Math.max(...deadMaterials.map(i => i.daysUnused))} Days` : '0 Days'}
              </span>
            </div>
          </div>

          {/* Dead Material Items Table */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50">
              <div>
                <h4 className="font-bold text-sm text-zinc-950">Declared Dead Material Batches</h4>
                <p className="text-xs text-zinc-500">Materials received in GRN with zero consumption for 6+ months</p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search batch, heat #, grade, tool..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-500/10 w-64"
                />
              </div>
            </div>

            {isLoadingDead ? (
              <div className="p-8">
                <SkeletonBox className="h-48 w-full" />
              </div>
            ) : filteredDeadMaterials.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 space-y-2">
                <Archive className="w-9 h-9 text-zinc-300 mx-auto" />
                <p className="text-sm font-bold text-zinc-800">No Dead Materials Found</p>
                <p className="text-xs text-zinc-400">All materials received via GRN have been issued within 6 months.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-900 text-zinc-100 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Batch #</th>
                      <th className="p-3">Heat # (Mill Cert)</th>
                      <th className="p-3">Tool Project</th>
                      <th className="p-3 text-center w-14">L</th>
                      <th className="p-3 text-center w-14">W</th>
                      <th className="p-3 text-center w-14">H</th>
                      <th className="p-3">Material Grade</th>
                      <th className="p-3 text-center">Unused Units</th>
                      <th className="p-3 text-right">Idle Value (₹)</th>
                      <th className="p-3 text-center">GRN Date</th>
                      <th className="p-3 text-center">Aging / Idle Time</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredDeadMaterials.map((item) => {
                      const { lVal, wVal, hVal } = parseLwh(item.dimensions, String(item.length), String(item.width), String(item.height));

                      return (
                        <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="p-3 font-mono font-bold text-zinc-950">{item.batchNumber}</td>
                          <td className="p-3 font-mono text-zinc-700">{item.heatNumber}</td>
                          <td className="p-3 font-bold text-blue-700">{item.toolNo}</td>
                          <td className="p-3 text-center font-mono font-bold text-zinc-900 bg-zinc-50">{lVal}</td>
                          <td className="p-3 text-center font-mono font-bold text-zinc-900 bg-zinc-50">{wVal}</td>
                          <td className="p-3 text-center font-mono font-bold text-zinc-900 bg-zinc-50">{hVal}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-900 font-bold text-[11px] border border-zinc-200">
                              {item.materialGrade}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono font-black text-zinc-950">{item.availableQty} Units</td>
                          <td className="p-3 text-right font-mono font-bold text-zinc-950">
                            ₹{Number(item.totalIdleValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-center font-mono text-zinc-600 text-xs">{item.grnDate}</td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-100 text-red-800 border border-red-200">
                              {item.daysUnused} Days Idle ({item.monthsUnused} Mths)
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-xs">
                              DEAD MATERIAL
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleReallocateDead(item.id, item.batchNumber)}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Reallocate Tool
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
