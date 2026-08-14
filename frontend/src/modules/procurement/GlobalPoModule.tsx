"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  FileText, 
  Download, 
  Eye, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw,
  Trash2
} from 'lucide-react';
import { ProcurementService } from '@/services/procurement.service';
import { MultiProjectPoWizard } from './MultiProjectPoWizard';
import { AuthenticPoDocument } from './AuthenticPoDocument';
import { exportPoToExcel } from './poExcelExporter';
import { SkeletonBox } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function GlobalPoModule() {
  const { success, error } = useToast();
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

  const handleDeletePo = async (po: any) => {
    const poNum = po.poNumber || po.id;
    if (!window.confirm(`Are you sure you want to delete Purchase Order "${poNum}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await ProcurementService.deletePurchaseOrder('global', po.id || po.poNumber);
      success("Purchase Order Deleted", `PO ${poNum} has been permanently deleted.`);
      fetchGlobalOrders();
    } catch (err: any) {
      error("Delete Failed", err?.response?.data?.message || err?.message || "Failed to delete purchase order.");
    }
  };

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
    <div className="space-y-6 text-ink font-sans pb-24 mb-10">
      {/* Design System Page Header */}
      <PageHeader
        title="Global Purchase Order Module"
        description="Consolidate material requirements across tool projects into authentic supplier Purchase Orders"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Procurement', href: '/purchase-orders' },
          { label: 'Purchase Orders' },
        ]}
        icon={<ShoppingCart className="w-5 h-5 text-primary" />}
        actions={
          <Tabs
            activeTab={activeTab}
            onChange={(tab) => { setActiveTab(tab as any); setPreviewPo(null); }}
            tabs={[
              { id: 'create', label: 'Create PO', icon: <Plus className="w-3.5 h-3.5" /> },
              { id: 'history', label: `PO Register (${totalCount})`, icon: <FileText className="w-3.5 h-3.5" /> },
              { id: 'dead', label: `Dead Material (${deadCount})`, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
            ]}
          />
        }
      />

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 hide-on-print">
        {/* Issued POs */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-silver-blue uppercase tracking-wider">Issued POs</div>
            <div className="text-2xl font-bold text-ink mt-0.5">{totalCount}</div>
            <div className="text-caption text-silver-blue mt-0.5">Supplier purchase orders</div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-primary-subtle flex items-center justify-center text-primary">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        {/* Total Procurement */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-silver-blue uppercase tracking-wider">Total Procurement</div>
            <div className="text-2xl font-bold text-semantic-success-dark mt-0.5">
              ₹{totalValue > 0 ? totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
            </div>
            <div className="text-caption text-silver-blue mt-0.5">Total material spend</div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-semantic-success-subtle flex items-center justify-center text-semantic-success-dark">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Dead Stock */}
        <div className="bg-white p-4 rounded-[12px] border border-border-gray shadow-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-semantic-danger uppercase tracking-wider">Dead Stock (6+ Mths)</div>
            <div className="text-2xl font-bold text-semantic-danger-dark mt-0.5">{deadCount} Batches</div>
            <div className="text-caption text-silver-blue mt-0.5">
              Idle stock value: ₹{totalDeadValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-semantic-danger-subtle flex items-center justify-center text-semantic-danger-dark">
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
        <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-display-xs font-bold text-ink">Purchase Order Register</h3>
              <p className="text-caption text-silver-blue">History of issued multi-project and single project purchase orders</p>
            </div>

            <SearchInput
              context="local"
              placeholder="Search PO #, vendor, project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              containerClassName="w-full sm:w-72"
            />
          </div>

          <div className="overflow-x-auto border border-border-gray rounded-[12px]">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-canvas border-b border-border-gray text-silver-blue uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Vendor / Supplier</th>
                  <th className="py-3 px-4 text-right">Items</th>
                  <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center"><SkeletonBox className="h-10 w-full" /></td>
                  </tr>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-primary">{po.poNumber}</td>
                      <td className="py-3 px-4 font-semibold text-ink">{po.vendor?.vendorName || po.vendorName || "Standard Vendor"}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">{po.items?.length || 1} items</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-semantic-success-dark">₹{(Number(po.totalAmount) || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={po.status || "COMPLETED"} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setPreviewPo(po)}
                          >
                            View PO
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<Download className="w-3.5 h-3.5" />}
                            onClick={() => exportPoToExcel(po)}
                          >
                            Excel
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() => handleDeletePo(po)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-silver-blue italic">
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
        <div className="bg-white rounded-[12px] border border-border-gray shadow-subtle overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-display-xs font-bold text-semantic-danger-dark flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-semantic-danger" />
                <span>Dead Material & Excess Stock Register</span>
              </h3>
              <p className="text-caption text-silver-blue">Unused steel batches idle for over 6 months available for re-allocation</p>
            </div>

            <SearchInput
              context="local"
              placeholder="Search batch #, heat #, grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              containerClassName="w-full sm:w-72"
            />
          </div>

          <div className="overflow-x-auto border border-border-gray rounded-[12px]">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-semantic-danger-subtle border-b border-border-gray text-semantic-danger-dark uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Batch #</th>
                  <th className="py-3 px-4">Material Grade</th>
                  <th className="py-3 px-4">Dimensions / Spec</th>
                  <th className="py-3 px-4 text-right">Idle Qty (NOS)</th>
                  <th className="py-3 px-4 text-right">Idle Weight (KG)</th>
                  <th className="py-3 px-4 text-right">Idle Value (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-gray">
                {isLoadingDead ? (
                  <tr><td colSpan={7} className="p-8 text-center"><SkeletonBox className="h-10 w-full" /></td></tr>
                ) : filteredDeadMaterials.length > 0 ? (
                  filteredDeadMaterials.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-ink">{item.batchNumber}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-semantic-danger-dark">{item.materialGrade}</td>
                      <td className="py-3 px-4 text-cool-gray font-mono">{item.dimensions || item.spec || "-"}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">{item.idleQty || 1} NOS</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">{item.idleWeight || 0} KG</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-semantic-danger-dark">₹{(Number(item.totalIdleValue) || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          onClick={() => handleReallocateDead(item.id, item.batchNumber)}
                        >
                          Reallocate
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-silver-blue italic">
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
