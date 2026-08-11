"use client";

import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Wrench, RefreshCw, Plus, Search, Filter, Calendar, User, 
  CheckCircle2, AlertTriangle, Clock, ArrowUpRight, ArrowDownLeft, 
  ShieldCheck, FileText, QrCode, Tag, MapPin, Building, ChevronRight,
  TrendingUp, BarChart3, PieChart, Layers, Download, Check, AlertCircle, X,
  Edit, Eye, Image as ImageIcon, Link as LinkIcon, DollarSign, Archive, History,
  Sparkles, Sliders, Shield, Zap, Boxes
} from 'lucide-react';
import { 
  useAssetsDashboardStats, useAssets, useAsset, useCreateAsset, 
  useUpdateAsset, useIssueAsset, useReturnAsset, useCreateMaintenance, 
  useCompleteMaintenance, useAssetCategories, useAssetLocations, 
  useAssetIssues, useAssetReturns, useAssetMaintenance,
  useCreateCategory, useCreateLocation
} from '../../hooks/useAssets';
import { useMasterData } from '../../hooks/useMasterData';
import { useMasterLookups } from '../../hooks/useMasterLookups';
import { ProjectMaterialInventoryTab } from '../../components/inventory/ProjectMaterialInventoryTab';

export default function GlobalAssetsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'material-inventory' | 'inventory' | 'issues' | 'returns' | 'employees' | 'categories' | 'maintenance' | 'reports'>('dashboard');
  
  const { options: uomOptions } = useMasterLookups('UOM');
  const { options: conditionOptions } = useMasterLookups('ASSET_CONDITION');

  // Search & Filter States

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Form Step State in Modal
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Editing state
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

  // Modals & Drawers
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [viewingAssetId, setViewingAssetId] = useState<string | null>(null);
  const [qrCodeModalData, setQrCodeModalData] = useState<{ name: string; qr: string; barcode: string; code: string } | null>(null);

  // Data Hooks
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAssetsDashboardStats();
  const { data: assets = [], isLoading: assetsLoading, refetch: refetchAssets } = useAssets({ search: searchQuery, categoryId: selectedCategory, status: selectedStatus });
  const { data: categories = [], refetch: refetchCategories } = useAssetCategories();

  const effectiveCategories = categories;
  const { data: locations = [], refetch: refetchLocations } = useAssetLocations();
  const { data: issues = [], refetch: refetchIssues } = useAssetIssues();
  const { data: returns = [], refetch: refetchReturns } = useAssetReturns();
  const { data: maintenanceList = [], refetch: refetchMaintenance } = useAssetMaintenance();
  const { data: employees = [] } = useMasterData('employees');
  const { data: detailedAsset } = useAsset(viewingAssetId || '');

  // Mutations
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  const issueAssetMutation = useIssueAsset();
  const returnAssetMutation = useReturnAsset();
  const createMaintenanceMutation = useCreateMaintenance();
  const completeMaintenanceMutation = useCompleteMaintenance();
  const createCategoryMutation = useCreateCategory();
  const createLocationMutation = useCreateLocation();

  // Form States
  const defaultAssetForm = {
    assetCode: '',
    name: '',
    categoryId: '',
    subCategory: '',
    brand: '',
    model: '',
    serialNumber: '',
    partNumber: '',
    description: '',
    quantity: 1,
    unit: 'NOS',
    minStockAlert: 1,
    purchaseDate: '',
    purchaseCost: 0,
    supplier: '',
    locationId: '',
    storageRack: '',
    condition: 'GOOD',
    warrantyExpiry: '',
    requiresCalibration: false,
    calibrationFrequencyDays: 365,
    lastCalibrationDate: '',
    status: 'AVAILABLE' as const,
    imageUrl: '',
    documentUrls: ''
  };

  const [assetForm, setAssetForm] = useState(defaultAssetForm);

  const [issueForm, setIssueForm] = useState({
    assetId: '',
    employeeId: '',
    quantity: 1,
    expectedReturnDate: '',
    conditionBeforeIssue: 'GOOD',
    remarks: ''
  });

  const [returnForm, setReturnForm] = useState({
    issueTransactionId: '',
    returnedQty: 1,
    conditionAfterReturn: 'GOOD',
    damageDetails: '',
    remarks: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    assetId: '',
    issueReported: '',
    assignedTechnician: '',
    cost: 0,
    remarks: ''
  });

  const [categoryForm, setCategoryForm] = useState({ categoryCode: '', name: '', description: '' });
  const [locationForm, setLocationForm] = useState({ locationCode: '', locationName: '', building: '', room: '', rackBin: '', remarks: '' });

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handlers
  const handleOpenAddAsset = () => {
    setEditingAssetId(null);
    const seqStr = (assets.length + 1).toString().padStart(4, '0');
    setAssetForm({
      ...defaultAssetForm,
      assetCode: `AST-${seqStr}`
    });
    setFormStep(1);
    setIsAssetModalOpen(true);
  };

  const handleOpenEditAsset = (asset: any) => {
    setEditingAssetId(asset.id);
    setAssetForm({
      assetCode: asset.assetCode || '',
      name: asset.name || '',
      categoryId: asset.categoryId || '',
      subCategory: asset.subCategory || '',
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      partNumber: asset.partNumber || '',
      description: asset.description || '',
      quantity: Number(asset.quantity) || 1,
      unit: asset.unit || 'NOS',
      minStockAlert: Number(asset.minStockAlert) || 1,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      purchaseCost: Number(asset.purchaseCost) || 0,
      supplier: asset.supplier || '',
      locationId: asset.locationId || '',
      storageRack: asset.storageRack || '',
      condition: asset.condition || 'GOOD',
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      requiresCalibration: asset.requiresCalibration || false,
      calibrationFrequencyDays: asset.calibrationFrequencyDays || 365,
      lastCalibrationDate: asset.lastCalibrationDate ? asset.lastCalibrationDate.split('T')[0] : '',
      status: asset.status || 'AVAILABLE',
      imageUrl: asset.imageUrl || '',
      documentUrls: typeof asset.documentUrls === 'string' ? asset.documentUrls : JSON.stringify(asset.documentUrls || '')
    });
    setFormStep(1);
    setIsAssetModalOpen(true);
  };

  const handleAutoGenerateCode = () => {
    const selectedCat = categories.find((c: any) => c.id === assetForm.categoryId);
    const prefix = selectedCat?.categoryCode ? selectedCat.categoryCode.replace(/[^A-Z]/g, '').slice(0, 4) : 'AST';
    const seqStr = (assets.length + 1).toString().padStart(4, '0');
    setAssetForm(prev => ({ ...prev, assetCode: `${prefix}-${seqStr}` }));
  };

  const handleQuickPreset = (type: 'caliper' | 'drill' | 'height' | 'laptop' | 'vise') => {
    const firstCatId = categories[0]?.id || '';
    if (type === 'caliper') {
      setAssetForm(prev => ({
        ...prev,
        name: 'Digital Vernier Caliper 300mm',
        brand: 'Mitutoyo',
        model: '500-196-30',
        unit: 'NOS',
        quantity: 5,
        purchaseCost: 280,
        condition: 'NEW',
        subCategory: 'Precision Gauges',
        categoryId: firstCatId,
        requiresCalibration: true,
        calibrationFrequencyDays: 180,
        description: 'High precision digital caliper with IP67 protection for toolroom inspection.'
      }));
    } else if (type === 'drill') {
      setAssetForm(prev => ({
        ...prev,
        name: 'Cordless Impact Driver 18V',
        brand: 'Bosch Professional',
        model: 'GDX 18V-200',
        unit: 'NOS',
        quantity: 3,
        purchaseCost: 340,
        condition: 'GOOD',
        subCategory: 'Power Tools',
        categoryId: firstCatId,
        description: 'Heavy duty 18V brushless impact driver with dual tool holder.'
      }));
    } else if (type === 'height') {
      setAssetForm(prev => ({
        ...prev,
        name: 'Linear Height Gauge 600mm',
        brand: 'Mitutoyo',
        model: 'LH-600E',
        unit: 'NOS',
        quantity: 1,
        purchaseCost: 4500,
        condition: 'EXCELLENT',
        subCategory: 'Height Masters',
        categoryId: firstCatId,
        requiresCalibration: true,
        calibrationFrequencyDays: 365,
        description: '2D measurement height gauge for quality laboratory.'
      }));
    } else if (type === 'laptop') {
      setAssetForm(prev => ({
        ...prev,
        name: 'Dell Precision CAD Workstation Laptop',
        brand: 'Dell',
        model: 'Precision 7680',
        unit: 'NOS',
        quantity: 2,
        purchaseCost: 2900,
        condition: 'EXCELLENT',
        subCategory: 'IT Assets',
        categoryId: firstCatId,
        description: 'Intel i9 64GB RAM RTX 4000 Ada GPU workstation for CAD/CAM programming.'
      }));
    } else if (type === 'vise') {
      setAssetForm(prev => ({
        ...prev,
        name: 'Precision Milling Machine Vise 6 Inch',
        brand: 'Kurt',
        model: 'DX6 Crossover',
        unit: 'NOS',
        quantity: 4,
        purchaseCost: 850,
        condition: 'GOOD',
        subCategory: 'Workholding Fixtures',
        categoryId: firstCatId,
        description: 'Ultra precision CNC vise with stationary jaw body.'
      }));
    }
    showToast('success', 'Form pre-filled with industry template!');
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.assetCode || !assetForm.name || !assetForm.categoryId) {
      return showToast('error', 'Please fill in mandatory fields (Code, Name, Category).');
    }
    try {
      if (editingAssetId) {
        await updateAssetMutation.mutateAsync({ id: editingAssetId, data: assetForm });
        showToast('success', 'Global Asset updated successfully!');
      } else {
        await createAssetMutation.mutateAsync(assetForm);
        showToast('success', 'Global Asset registered successfully!');
      }
      setIsAssetModalOpen(false);
      refetchAssets();
      refetchStats();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to save asset.');
    }
  };

  const handleIssueAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.assetId || !issueForm.employeeId || issueForm.quantity <= 0) {
      return showToast('error', 'Please select an asset, employee and valid quantity.');
    }
    try {
      await issueAssetMutation.mutateAsync(issueForm);
      showToast('success', 'Asset issued successfully to employee!');
      setIsIssueModalOpen(false);
      refetchAssets();
      refetchIssues();
      refetchStats();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to issue asset.');
    }
  };

  const handleReturnAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnForm.issueTransactionId || returnForm.returnedQty <= 0) {
      return showToast('error', 'Please select an active issue transaction and return quantity.');
    }
    try {
      await returnAssetMutation.mutateAsync(returnForm);
      showToast('success', 'Asset return processed successfully!');
      setIsReturnModalOpen(false);
      refetchAssets();
      refetchReturns();
      refetchIssues();
      refetchStats();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to process return.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.categoryCode || !categoryForm.name) return showToast('error', 'Category code and name are required.');
    try {
      await createCategoryMutation.mutateAsync(categoryForm);
      showToast('success', 'Asset category created!');
      setIsCategoryModalOpen(false);
      setCategoryForm({ categoryCode: '', name: '', description: '' });
      refetchCategories();
    } catch (err: any) {
      showToast('error', 'Failed to create category.');
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.locationCode || !locationForm.locationName) return showToast('error', 'Location code and name are required.');
    try {
      await createLocationMutation.mutateAsync(locationForm);
      showToast('success', 'Storage location created!');
      setIsLocationModalOpen(false);
      setLocationForm({ locationCode: '', locationName: '', building: '', room: '', rackBin: '', remarks: '' });
      refetchLocations();
    } catch (err: any) {
      showToast('error', 'Failed to create location.');
    }
  };

  return (
    <AppLayout>
      <div className="w-full h-full flex flex-col min-h-0 space-y-4">
        {/* Toast Banner */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-6 right-6 z-50 px-4 py-2.5 rounded-md shadow-level-1 border flex items-center space-x-2 text-caption font-semibold ${
                  toastMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{toastMessage.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Page Header */}
          <PageHeader 
            title="Global Inventory & Asset Hub"
            description="Centralized company assets, employee tool issue/return ledger, storage locations & calibrations."
            icon={<Package />}
            breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Global Inventory' }]}
            actions={
              <div className="flex items-center gap-3">
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => setIsIssueModalOpen(true)}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  <span>Issue Asset</span>
                </Button>

                <Button
                  variant="white"
                  size="sm"
                  onClick={() => setIsReturnModalOpen(true)}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 mr-1.5 text-green" />
                  <span>Return Asset</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenAddAsset}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Register New Asset</span>
                </Button>
              </div>
            }
          />

          {/* Clean Sub Navigation Tabs */}
          <div className="flex items-center space-x-1 border-b border-border-gray shrink-0 overflow-x-auto hide-scrollbar bg-white px-2 pt-1 rounded-t-[12px]">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'material-inventory', label: 'Material Inventory', icon: Boxes },
              { id: 'inventory', label: 'Asset Register', icon: Package },
              { id: 'issues', label: 'Issue Register', icon: ArrowUpRight },
              { id: 'returns', label: 'Return Register', icon: ArrowDownLeft },
              { id: 'employees', label: 'Employee Ledger', icon: User },
              { id: 'categories', label: 'Categories & Storage', icon: Layers },
              { id: 'maintenance', label: 'Maintenance', icon: Wrench },
              { id: 'reports', label: 'Reports & Valuation', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`h-9 px-4 text-caption font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-primary border-primary font-semibold bg-white'
                      : 'text-cool-gray hover:text-ink border-transparent hover:border-border-gray'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

        {/* TAB: MATERIAL INVENTORY W.R.T PROJECTS */}
        {activeTab === 'material-inventory' && (
          <ProjectMaterialInventoryTab />
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: 'Total Assets', value: stats?.cards?.totalAssets || 0, sub: `${stats?.cards?.totalQuantity || 0} units total`, text: 'text-primary' },
                { label: 'Available', value: stats?.cards?.availableAssets || 0, sub: 'Ready for issue', text: 'text-green' },
                { label: 'Issued Assets', value: stats?.cards?.issuedAssets || 0, sub: 'Currently on loan', text: 'text-ink' },
                { label: 'Overdue', value: stats?.cards?.overdueAssets || 0, sub: 'Requires return', text: 'text-accent-red' },
                { label: 'Maintenance', value: stats?.cards?.maintenanceAssets || 0, sub: 'Calibration / Repair', text: 'text-primary-dark' },
                { label: 'Lost Assets', value: stats?.cards?.lostAssets || 0, sub: 'Reported missing', text: 'text-cool-gray' },
                { label: 'Scrapped', value: stats?.cards?.scrappedAssets || 0, sub: 'Decommissioned', text: 'text-silver-blue' },
              ].map((card, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-[12px] bg-white border border-border-gray shadow-subtle flex flex-col justify-between transition-all"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-cool-gray">{card.label}</span>
                  <div className="my-2">
                    <span className={`text-3xl font-bold font-mono ${card.text}`}>{card.value}</span>
                  </div>
                  <span className="text-[11px] text-silver-blue font-medium">{card.sub}</span>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-[12px] bg-white border border-border-gray shadow-subtle">
                <h3 className="text-feature-title font-semibold text-ink mb-4 flex items-center justify-between">
                  <span>Assets by Category</span>
                  <PieChart className="w-5 h-5 text-primary" />
                </h3>
                <div className="space-y-4">
                  {(stats?.charts?.byCategory || []).map((cat: any, i: number) => {
                    const maxCount = Math.max(...(stats?.charts?.byCategory || []).map((c: any) => c.count), 1);
                    const pct = Math.round((cat.count / maxCount) * 100);
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-caption font-medium">
                          <span className="text-ink">{cat.name}</span>
                          <span className="text-primary font-mono">{cat.count} items</span>
                        </div>
                        <div className="w-full h-2 bg-primary-subtle/40 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 rounded-[12px] bg-white border border-border-gray shadow-subtle">
                <h3 className="text-feature-title font-semibold text-ink mb-4 flex items-center justify-between">
                  <span>Department Loans</span>
                  <Building className="w-5 h-5 text-green" />
                </h3>
                <div className="space-y-3">
                  {(stats?.charts?.departmentWise || []).map((dept: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-[8px] bg-[rgba(148,151,169,0.04)] border border-border-gray">
                      <span className="text-body-sm font-medium text-ink">{dept.name}</span>
                      <span className="px-2.5 py-1 rounded-[6px] bg-[rgba(20,158,97,0.16)] text-[#026b3f] font-mono font-medium text-xs">
                        {dept.count} Units
                      </span>
                    </div>
                  ))}
                  {(!stats?.charts?.departmentWise || stats.charts.departmentWise.length === 0) && (
                    <p className="text-caption text-silver-blue italic py-4 text-center">No active department loans recorded.</p>
                  )}
                </div>
              </div>

              <div className="p-6 rounded-[12px] bg-white border border-border-gray shadow-subtle">
                <h3 className="text-feature-title font-semibold text-ink mb-4 flex items-center justify-between">
                  <span>Most Frequently Issued</span>
                  <TrendingUp className="w-5 h-5 text-primary-dark" />
                </h3>
                <div className="space-y-3">
                  {(stats?.charts?.mostIssued || []).map((ast: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-[8px] bg-[rgba(148,151,169,0.04)] border border-border-gray">
                      <div>
                        <p className="text-body-sm font-medium text-ink">{ast.assetName}</p>
                        <p className="text-small text-silver-blue font-mono">{ast.assetCode}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-[8px] bg-[rgba(104,107,130,0.12)] text-[#484b5e] font-mono font-medium text-xs">
                        {ast.issueCount} Issues
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ASSET REGISTER (INVENTORY) */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-[12px] bg-white border border-border-gray shadow-subtle">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search Asset ID, Code, Name, Serial Number, Brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-md bg-white border border-slate-200 text-xs text-ink placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2.5 rounded-md bg-white border border-slate-200 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                >
                  <option value="">All Categories</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2.5 rounded-md bg-white border border-slate-200 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                >
                  <option value="">All Statuses</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ISSUED">ISSUED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="LOST">LOST</option>
                  <option value="SCRAPPED">SCRAPPED</option>
                </select>

                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedStatus(''); }}
                  className="p-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-zinc-600 transition-colors"
                  title="Reset Filters"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <motion.div
                  key={asset.id}
                  whileHover={{ y: -4 }}
                  className="p-6 rounded-[12px] bg-white border border-border-gray shadow-subtle flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2.5 py-1 rounded-md bg-primary-subtle text-primary-dark border border-primary/20 font-mono font-semibold text-[10px]">
                        {asset.assetId}
                      </span>

                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                        asset.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        asset.status === 'ISSUED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        asset.status === 'MAINTENANCE' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {asset.status}
                      </span>
                    </div>

                    <h4 className="text-base font-semibold text-ink group-hover:text-primary transition-colors mb-1">{asset.name}</h4>
                    <p className="text-xs text-mute font-mono mb-4">{asset.assetCode} {asset.brand && `â€¢ ${asset.brand}`} {asset.model && `(${asset.model})`}</p>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-md bg-slate-50 border border-slate-100 text-center mb-4">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-zinc-400 block">Total</span>
                        <span className="text-sm font-semibold font-mono text-ink">{Number(asset.quantity)} {asset.unit}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-emerald-600 block">Available</span>
                        <span className="text-sm font-semibold font-mono text-emerald-700">{Number(asset.availableQty)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-amber-600 block">Issued</span>
                        <span className="text-sm font-semibold font-mono text-amber-700">{Number(asset.issuedQty)}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-600 mb-4">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Category:</span>
                        <span className="font-semibold text-zinc-800">{asset.category?.name || 'General'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Location:</span>
                        <span className="font-semibold text-zinc-800">{asset.location?.locationName || asset.storageRack || 'Main Toolroom'}</span>
                      </div>
                      {asset.serialNumber && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">S/N:</span>
                          <span className="font-mono text-zinc-800">{asset.serialNumber}</span>
                        </div>
                      )}
                      {Number(asset.purchaseCost) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Cost:</span>
                          <span className="font-mono font-semibold text-emerald-700">${Number(asset.purchaseCost)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setQrCodeModalData({ name: asset.name, qr: asset.qrCode || `QR-${asset.assetId}`, barcode: asset.barcode || `BC-${asset.assetCode}`, code: asset.assetCode })}
                        className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-zinc-700 transition-colors"
                        title="Generate QR/Barcode"
                      >
                        <QrCode className="w-4 h-4 text-primary" />
                      </button>

                      <button
                        onClick={() => handleOpenEditAsset(asset)}
                        className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-zinc-700 transition-colors"
                        title="Edit Asset Details"
                      >
                        <Edit className="w-4 h-4 text-zinc-700" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setIssueForm((prev) => ({ ...prev, assetId: asset.id }));
                          setIsIssueModalOpen(true);
                        }}
                        disabled={Number(asset.availableQty) <= 0}
                        className="px-3 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 disabled:opacity-30 disabled:pointer-events-none text-amber-800 border border-amber-200 text-xs font-semibold transition-all"
                      >
                        Issue
                      </button>

                      <button
                        onClick={() => setViewingAssetId(asset.id)}
                        className="px-3 py-1.5 rounded-md bg-primary-subtle hover:bg-indigo-100 text-primary-dark border border-primary/20 text-xs font-semibold transition-all"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* PROPER ENTERPRISE ASSET FORM DRAWER */}
        <AnimatePresence>
          {isAssetModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-5xl bg-white border border-slate-200 rounded-md p-8 shadow-level-4 text-ink max-h-[94vh] flex flex-col"
              >
                {/* Header & Preset Bar */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-primary-subtle text-primary-dark border border-primary/20 font-mono text-xs font-semibold">
                        {assetForm.assetCode || 'NEW-ASSET'}
                      </span>
                      <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Step {formStep} of 5</span>
                    </div>
                    <h3 className="text-2xl font-semibold text-ink">
                      {editingAssetId ? 'Edit Global Inventory Asset' : 'Register New Global Inventory Asset'}
                    </h3>
                  </div>

                  <button onClick={() => setIsAssetModalOpen(false)} className="text-zinc-400 hover:text-ink p-2 rounded-md hover:bg-slate-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Industry Presets Quick-Bar */}
                {!editingAssetId && (
                  <div className="py-3 px-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto text-xs">
                    <span className="font-semibold text-mute flex items-center gap-1.5 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Quick Templates:
                    </span>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button type="button" onClick={() => handleQuickPreset('caliper')} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-zinc-700 hover:border-primary hover:text-primary font-semibold transition-all">ðŸ“ Caliper 300mm</button>
                      <button type="button" onClick={() => handleQuickPreset('drill')} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-zinc-700 hover:border-primary hover:text-primary font-semibold transition-all">ðŸ› ï¸ Impact Driver</button>
                      <button type="button" onClick={() => handleQuickPreset('height')} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-zinc-700 hover:border-primary hover:text-primary font-semibold transition-all">ðŸ“ Height Gauge</button>
                      <button type="button" onClick={() => handleQuickPreset('laptop')} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-zinc-700 hover:border-primary hover:text-primary font-semibold transition-all">ðŸ’» CAD Workstation</button>
                      <button type="button" onClick={() => handleQuickPreset('vise')} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-zinc-700 hover:border-primary hover:text-primary font-semibold transition-all">ðŸ§© CNC Vise 6"</button>
                    </div>
                  </div>
                )}

                {/* Wizard Step Navigation Tabs */}
                <div className="flex items-center space-x-2 py-3 border-b border-slate-100 overflow-x-auto">
                  {[
                    { step: 1, label: '1. General & Specs', icon: Package },
                    { step: 2, label: '2. Stock & Storage', icon: MapPin },
                    { step: 3, label: '3. Valuation & Vendor', icon: DollarSign },
                    { step: 4, label: '4. Quality & Calibration', icon: ShieldCheck },
                    { step: 5, label: '5. Barcode & Media', icon: QrCode },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isActive = formStep === s.step;
                    return (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => setFormStep(s.step as any)}
                        className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-level-1 shadow-indigo-500/20'
                            : 'bg-slate-100 text-zinc-600 hover:text-ink hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Main Step Form Body */}
                <form onSubmit={handleSaveAsset} className="flex-1 overflow-y-auto py-6 space-y-6 text-xs font-medium">
                  {/* STEP 1: GENERAL IDENTIFICATION */}
                  {formStep === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-zinc-700 font-semibold">Asset Code *</label>
                            <button
                              type="button"
                              onClick={handleAutoGenerateCode}
                              className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3" /> Auto-Gen
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="e.g. AST-CAL-001"
                            value={assetForm.assetCode}
                            onChange={(e) => setAssetForm({ ...assetForm, assetCode: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-mono font-semibold focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Asset Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Digital Vernier Caliper 300mm"
                            value={assetForm.name}
                            onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-semibold focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Asset Status</label>
                          <select
                            value={assetForm.status}
                            onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value as any })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-semibold focus:outline-none focus:border-primary"
                          >
                            <option value="AVAILABLE">AVAILABLE (In Stock)</option>
                            <option value="ISSUED">ISSUED (On Loan)</option>
                            <option value="MAINTENANCE">MAINTENANCE (In Repair)</option>
                            <option value="RESERVED">RESERVED (Project Lock)</option>
                            <option value="LOST">LOST (Missing)</option>
                            <option value="SCRAPPED">SCRAPPED (Decommissioned)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-zinc-700 font-semibold">Category *</label>
                            <button
                              type="button"
                              onClick={() => setIsCategoryModalOpen(true)}
                              className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1"
                            >
                              + Quick Add Category
                            </button>
                          </div>
                          <select
                            required
                            value={assetForm.categoryId}
                            onChange={(e) => setAssetForm({ ...assetForm, categoryId: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-semibold focus:outline-none focus:border-primary"
                          >
                            <option value="">Select Primary Category</option>
                            {effectiveCategories.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Subcategory / Family</label>
                          <input
                            type="text"
                            placeholder="e.g. Precision Gauges / Cordless Drills"
                            value={assetForm.subCategory}
                            onChange={(e) => setAssetForm({ ...assetForm, subCategory: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Brand / Make</label>
                          <input
                            type="text"
                            placeholder="e.g. Mitutoyo / Bosch"
                            value={assetForm.brand}
                            onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Model Number</label>
                          <input
                            type="text"
                            placeholder="e.g. 500-196-30"
                            value={assetForm.model}
                            onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Serial Number</label>
                          <input
                            type="text"
                            placeholder="e.g. SN-998823"
                            value={assetForm.serialNumber}
                            onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-mono focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Part Number</label>
                          <input
                            type="text"
                            placeholder="e.g. PN-MIT-001"
                            value={assetForm.partNumber}
                            onChange={(e) => setAssetForm({ ...assetForm, partNumber: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-mono focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-zinc-700 font-semibold mb-1">Technical Specs & Notes</label>
                        <textarea
                          rows={3}
                          placeholder="Detailed specifications, resolution, torque rating, accuracy tolerance..."
                          value={assetForm.description}
                          onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                          className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: STOCK & STORAGE LOCATION */}
                  {formStep === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Owned Stock Quantity *</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={assetForm.quantity}
                            onChange={(e) => setAssetForm({ ...assetForm, quantity: (e.target.value === '' ? ('' as any) : Number(e.target.value)) })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-mono font-semibold text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Unit of Measure (UOM)</label>
                          <select
                            value={assetForm.unit}
                            onChange={(e) => setAssetForm({ ...assetForm, unit: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-semibold focus:outline-none focus:border-primary"
                          >
                            {uomOptions.map(u => (
                              <option key={u.id} value={u.code}>{u.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Min Stock Alert Level</label>
                          <input
                            type="number"
                            min={0}
                            value={assetForm.minStockAlert}
                            onChange={(e) => setAssetForm({ ...assetForm, minStockAlert: (e.target.value === '' ? ('' as any) : Number(e.target.value)) })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-mono focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Storage Building / Warehouse</label>
                          <select
                            value={assetForm.locationId}
                            onChange={(e) => setAssetForm({ ...assetForm, locationId: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                          >
                            <option value="">Select Storage Location</option>
                            {locations.map((l: any) => (
                              <option key={l.id} value={l.id}>{l.locationName} ({l.building})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Rack / Cabinet / Bin Ref</label>
                          <input
                            type="text"
                            placeholder="e.g. Cabinet B-3 / Bin 12"
                            value={assetForm.storageRack}
                            onChange={(e) => setAssetForm({ ...assetForm, storageRack: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Physical Condition</label>
                          <select
                            value={assetForm.condition}
                            onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-semibold focus:outline-none focus:border-primary"
                          >
                            {conditionOptions.map(c => (
                              <option key={c.id} value={c.code}>{c.label}</option>
                            ))}
                          </select>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* STEP 3: VALUATION & VENDOR */}
                  {formStep === 3 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Purchase Cost ($ / â‚¹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={assetForm.purchaseCost}
                            onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: (e.target.value === '' ? ('' as any) : Number(e.target.value)) })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink font-mono font-semibold text-sm focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Purchase Date</label>
                          <input
                            type="date"
                            value={assetForm.purchaseDate}
                            onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Supplier / Vendor</label>
                          <input
                            type="text"
                            placeholder="Supplier / Vendor Company"
                            value={assetForm.supplier}
                            onChange={(e) => setAssetForm({ ...assetForm, supplier: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Warranty Expiry Date</label>
                          <input
                            type="date"
                            value={assetForm.warrantyExpiry}
                            onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: QUALITY & CALIBRATION */}
                  {formStep === 4 && (
                    <div className="space-y-4 p-4 rounded-md bg-primary-subtle/50 border border-indigo-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-indigo-900">Quality Calibration Settings</h4>
                          <p className="text-xs text-primary">Enable automated calibration reminders & quality compliance for precision instruments.</p>
                        </div>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={assetForm.requiresCalibration}
                            onChange={(e) => setAssetForm({ ...assetForm, requiresCalibration: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 relative"></div>
                        </label>
                      </div>

                      {assetForm.requiresCalibration && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-indigo-100">
                          <div>
                            <label className="block text-zinc-700 font-semibold mb-1">Calibration Frequency (Days)</label>
                            <input
                              type="number"
                              min={30}
                              value={assetForm.calibrationFrequencyDays}
                              onChange={(e) => setAssetForm({ ...assetForm, calibrationFrequencyDays: (e.target.value === '' ? ('' as any) : Number(e.target.value)) })}
                              className="w-full p-3 rounded-md bg-white border border-slate-200 text-ink font-mono font-semibold focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-zinc-700 font-semibold mb-1">Last Calibration Date</label>
                            <input
                              type="date"
                              value={assetForm.lastCalibrationDate}
                              onChange={(e) => setAssetForm({ ...assetForm, lastCalibrationDate: e.target.value })}
                              className="w-full p-3 rounded-md bg-white border border-slate-200 text-ink focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 5: BARCODE & MEDIA PREVIEW */}
                  {formStep === 5 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Asset Image URL</label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={assetForm.imageUrl}
                            onChange={(e) => setAssetForm({ ...assetForm, imageUrl: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-zinc-700 font-semibold mb-1">Document Attachment URL / Link</label>
                          <input
                            type="text"
                            placeholder="Calibration MTC Certificate link..."
                            value={assetForm.documentUrls}
                            onChange={(e) => setAssetForm({ ...assetForm, documentUrls: e.target.value })}
                            className="w-full p-3 rounded-md bg-slate-50 border border-slate-200 text-ink focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* Live Barcode & QR Code Card */}
                      <div className="p-6 rounded-md bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center">
                        <span className="text-xs uppercase font-semibold text-mute tracking-wider mb-2">Live Real-time Barcode Preview</span>
                        <div className="p-4 bg-white rounded-md shadow-level-1 border border-slate-200 inline-block mb-2">
                          <QrCode className="w-24 h-24 text-ink mx-auto" />
                          <p className="text-[10px] font-mono text-zinc-700 font-semibold mt-1">QR-{assetForm.assetCode}</p>
                        </div>
                        <p className="text-xs font-mono text-primary-dark font-semibold">BC-{assetForm.assetCode}</p>
                      </div>
                    </div>
                  )}

                  {/* Form Footer Action Bar */}
                  <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                    <div className="flex space-x-2">
                      {formStep > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormStep(prev => Math.max(1, prev - 1) as any)}
                          className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-zinc-700 font-semibold"
                        >
                          â† Previous Step
                        </button>
                      )}
                      {formStep < 5 && (
                        <button
                          type="button"
                          onClick={() => setFormStep(prev => Math.min(5, prev + 1) as any)}
                          className="px-4 py-2 rounded-md bg-primary-subtle hover:bg-indigo-100 text-primary-dark font-semibold"
                        >
                          Next Step â†’
                        </button>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <button type="button" onClick={() => setIsAssetModalOpen(false)} className="px-5 py-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-zinc-700 font-semibold">Cancel</button>
                      <button type="submit" className="px-6 py-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white font-semibold text-xs border border-zinc-700/80 shadow-[0_1px_3px_rgba(0,0,0,0.12),_inset_0_1px_0_rgba(255,255,255,0.15)] cursor-pointer">
                        {editingAssetId ? 'Update Inventory Asset' : 'Save Inventory Asset'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
