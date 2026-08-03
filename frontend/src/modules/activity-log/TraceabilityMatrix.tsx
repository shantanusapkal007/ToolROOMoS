"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  UserCheck, 
  Box, 
  Wrench, 
  ArrowRight, 
  User as UserIcon, 
  Database, 
  Layers, 
  Truck,
  GitBranch,
  Cpu
} from 'lucide-react';
import { 
  AuditService, 
  AuditEvent, 
  AuditStats, 
  TaskAssignment, 
  MaterialMovement, 
  MaterialGenealogy, 
  AssetIssuance 
} from '../../services/audit.service';
import { getProductionShopDetails } from '@/constants/productionShops';
import { HistoryTimeline } from '../../components/ui/HistoryTimeline';

export function TraceabilityMatrix() {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'TASKS' | 'GENEALOGY' | 'ASSETS'>('AUDIT');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState<AuditStats | null>(null);

  // Tab 1: System Audit State
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditEntity, setAuditEntity] = useState('ALL');
  const [auditAction, setAuditAction] = useState('ALL');
  const [auditPage] = useState(1);

  // Tab 2: Task Assignments State
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskCategory, setTaskCategory] = useState('ALL');

  // Tab 3: Material Genealogy State
  const [genealogyQuery, setGenealogyQuery] = useState('BATCH');
  const [genealogyData, setGenealogyData] = useState<MaterialGenealogy[]>([]);
  const [materialMovements, setMaterialMovements] = useState<MaterialMovement[]>([]);

  // Tab 4: Asset Issuances State
  const [assets, setAssets] = useState<AssetIssuance[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetStatus, setAssetStatus] = useState('ALL');

  // Load Tab Data
  const loadTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'AUDIT') {
        const [logsRes, statsRes] = await Promise.all([
          AuditService.getAuditLogs({
            page: auditPage,
            limit: 20,
            entityType: auditEntity !== 'ALL' ? auditEntity : undefined,
            action: auditAction !== 'ALL' ? auditAction : undefined,
            search: auditSearch || undefined
          }),
          AuditService.getAuditStats()
        ]);
        setLogs(logsRes.data || []);
        setStats(statsRes);
      } else if (activeTab === 'TASKS') {
        const res = await AuditService.getTaskAssignments(taskSearch, taskCategory);
        setTasks(res || []);
      } else if (activeTab === 'GENEALOGY') {
        const [genRes, movRes] = await Promise.all([
          AuditService.getGenealogy(genealogyQuery || 'BATCH'),
          AuditService.getMaterialMovements()
        ]);
        setGenealogyData(genRes || []);
        setMaterialMovements(movRes || []);
      } else if (activeTab === 'ASSETS') {
        const res = await AuditService.getAssetIssuances(assetSearch, assetStatus);
        setAssets(res || []);
      }
    } catch (err) {
      console.error('Failed to load traceability data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData();
  }, [activeTab, auditEntity, auditAction, auditSearch, taskCategory, taskSearch, assetStatus, assetSearch]);

  const handleGenealogySearch = async () => {
    if (!genealogyQuery) return;
    setLoading(true);
    try {
      const res = await AuditService.getGenealogy(genealogyQuery);
      setGenealogyData(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Convert audit logs to timeline events
  const timelineEvents = logs.map(log => ({
    id: log.id,
    action: log.action as any,
    timestamp: log.createdAt,
    user: log.user?.name || log.performedBy,
    details: `on ${log.entityType} ${log.entityId}`,
    entityType: log.entityType,
    entityId: log.entityId,
    snapshot: log.snapshot
  }));

  return (
    <main className="flex-1 h-full flex flex-col relative pl-16 overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto h-full flex flex-col px-6 py-6 min-h-0 overflow-y-auto space-y-4">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display font-semibold tracking-tight text-zinc-900">Total System Traceability</h1>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              100% Audit Coverage
            </span>
          </div>
          <p className="text-body-large text-zinc-500 mt-1">
            Complete lineage: Who did what & when • Task delegation • Material & heat genealogy • Asset checkouts
          </p>
        </div>

        <button 
          onClick={loadTabData}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all rounded-xl text-sm font-medium text-zinc-700"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Trace Matrix
        </button>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 p-1.5 bg-zinc-900/5 backdrop-blur-xl border border-white/40 rounded-2xl shadow-inner flex-shrink-0">
        {[
          { id: 'AUDIT', label: 'System Audit Trail', icon: <Activity className="w-4 h-4" />, count: stats?.totalToday },
          { id: 'TASKS', label: 'Task & Work Assignments', icon: <UserCheck className="w-4 h-4" />, count: tasks.length },
          { id: 'GENEALOGY', label: 'Material & Heat Genealogy', icon: <Box className="w-4 h-4" />, count: genealogyData.length || materialMovements.length },
          { id: 'ASSETS', label: 'Tool & Asset Issuance', icon: <Wrench className="w-4 h-4" />, count: assets.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-medium text-sm transition-all relative ${
                isActive 
                  ? 'bg-white text-zinc-900 shadow-elevation font-semibold border border-black/5' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/40'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${isActive ? 'bg-zinc-100 text-zinc-800 font-bold' : 'bg-zinc-200/60 text-zinc-600'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SYSTEM AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
            {[
              { title: "Events Captured Today", value: stats?.totalToday || 0, icon: <Activity className="w-5 h-5 text-blue-500" /> },
              { title: "Most Active User", value: stats?.mostActiveUser || 'N/A', icon: <UserIcon className="w-5 h-5 text-emerald-500" /> },
              { title: "Most Modified Module", value: stats?.mostActiveEntity || 'N/A', icon: <Database className="w-5 h-5 text-purple-500" /> },
              { title: "Active Technicians Today", value: stats?.uniqueUsersActiveToday || 0, icon: <Layers className="w-5 h-5 text-orange-500" /> }
            ].map((stat, idx) => (
              <div key={idx} className="glass-panel p-4 flex items-center justify-between border border-white/60">
                <div>
                  <p className="text-xs font-medium text-zinc-500">{stat.title}</p>
                  <h3 className="text-xl font-bold text-zinc-900 mt-1">{stat.value}</h3>
                </div>
                <div className="p-2.5 bg-white/80 rounded-xl shadow-sm border border-black/5">
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="glass p-4 rounded-2xl flex items-center gap-4 mb-4 flex-shrink-0 border border-white/60 shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search audit trail, entity ID, action, user..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/60 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select 
              value={auditEntity}
              onChange={(e) => setAuditEntity(e.target.value)}
              className="px-4 py-2 bg-white/60 border border-black/10 rounded-xl text-sm font-medium text-zinc-700 outline-none"
            >
              <option value="ALL">All Entity Types</option>
              <option value="PROJECT">Project</option>
              <option value="PURCHASE_ORDER">Purchase Order</option>
              <option value="BILL_OF_MATERIAL">BOM</option>
              <option value="GOODS_RECEIPT">Goods Receipt</option>
              <option value="MATERIAL_ISSUE">Material Issue</option>
              <option value="JOB_CARD">Job Card</option>
              <option value="MAINTENANCE_TICKET">Maintenance Ticket</option>
            </select>
            <select 
              value={auditAction}
              onChange={(e) => setAuditAction(e.target.value)}
              className="px-4 py-2 bg-white/60 border border-black/10 rounded-xl text-sm font-medium text-zinc-700 outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Created</option>
              <option value="UPDATE">Updated</option>
              <option value="DELETE">Deleted</option>
              <option value="STATUS_CHANGE">Status Change</option>
            </select>
          </div>

          {/* Audit List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/40 rounded-2xl border border-white/60 p-6 shadow-inner">
            {logs.length > 0 ? (
              <HistoryTimeline events={timelineEvents} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
                <Activity className="w-10 h-10 text-zinc-400 mb-2" />
                <p className="font-semibold text-zinc-700">No Audit Events Found</p>
                <p className="text-sm">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: TASK & WORK ASSIGNMENTS */}
      {activeTab === 'TASKS' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Controls */}
          <div className="glass p-4 rounded-2xl flex items-center gap-4 mb-4 flex-shrink-0 border border-white/60">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search assigned tasks, operators, engineers, projects..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/60 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select 
              value={taskCategory}
              onChange={(e) => setTaskCategory(e.target.value)}
              className="px-4 py-2 bg-white/60 border border-black/10 rounded-xl text-sm font-medium text-zinc-700 outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="PROJECT_TASK">Project Engineering Tasks</option>
              <option value="JOB_CARD">Shop Floor Job Cards</option>
              <option value="MAINTENANCE_TICKET">Maintenance & Breakdown</option>
            </select>
          </div>

          {/* Task Cards Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-5 border border-white/80 hover:shadow-elevation transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                      task.category === 'PROJECT_TASK' 
                        ? 'bg-blue-500/10 text-blue-700 border-blue-500/20' 
                        : task.category === 'JOB_CARD' 
                        ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' 
                        : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                    }`}>
                      {task.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {new Date(task.assignedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-semibold text-zinc-900 text-base mb-1">{task.taskName}</h3>
                  <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{task.description}</p>

                  {/* Assigner -> Assignee Pipeline */}
                  <div className="p-3 bg-zinc-900/5 rounded-xl border border-black/5 space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Assigned By:</span>
                      <span className="font-semibold text-zinc-800">{task.assignedByName}</span>
                    </div>
                    <div className="flex items-center justify-center py-0.5">
                      <ArrowRight className="w-4 h-4 text-zinc-400 animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Assigned To:</span>
                      <span className="font-bold text-blue-600">{task.assignedToName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-black/5 text-xs">
                  <span className="text-zinc-500 font-mono">
                    {task.projectNumber || 'Global Asset'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full font-semibold ${
                    task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-blue-500/10 text-blue-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      )}

      {/* TAB 3: MATERIAL & HEAT GENEALOGY */}
      {activeTab === 'GENEALOGY' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Heat / Batch Search Header */}
          <div className="glass p-5 rounded-2xl flex items-center gap-4 mb-6 flex-shrink-0 border border-white/70 shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Enter Batch Number or Heat Number (e.g. BATCH-101, HT-9022)..."
                value={genealogyQuery}
                onChange={(e) => setGenealogyQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenealogySearch()}
                className="w-full pl-10 pr-4 py-2.5 bg-white/70 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <button
              onClick={handleGenealogySearch}
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium shadow-elevation hover:bg-zinc-800 transition-colors"
            >
              Trace Pedigree
            </button>
          </div>

          {/* Genealogy View Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
            {genealogyData.length > 0 ? (
              genealogyData.map((item, idx) => (
                <div key={idx} className="glass-panel p-6 border border-white/80 shadow-elevation">
                  
                  {/* Top Pedigree Summary */}
                  <div className="flex items-start justify-between pb-6 border-b border-black/10 mb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-zinc-900 font-mono">{item.batchNumber}</h2>
                        <span className="px-3 py-1 bg-purple-500/10 text-purple-700 border border-purple-500/20 text-xs font-bold rounded-lg font-mono">
                          Heat #: {item.heatNumber}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">
                        Material: <strong className="text-zinc-800">{item.materialCode}</strong> ({item.materialGrade}) • Location: {item.rackLocation}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-zinc-400">Stock Balance</p>
                      <p className="text-lg font-bold text-emerald-600">{item.currentQty} / {item.receivedQty} KG</p>
                    </div>
                  </div>

                  {/* Flowchart Timeline: Supplier -> Store Issue -> Machine Shop */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    
                    {/* Node 1: Inward Receipt */}
                    <div className="p-4 bg-white/60 rounded-xl border border-black/5 relative">
                      <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold text-sm">
                        <Truck className="w-4 h-4" />
                        1. Inward Vendor Receipt
                      </div>
                      <div className="text-xs space-y-1.5 text-zinc-600">
                        <p><strong>GRN #:</strong> {item.inward.grnNumber}</p>
                        <p><strong>PO #:</strong> {item.inward.poNumber}</p>
                        <p><strong>Vendor:</strong> {item.inward.vendorName}</p>
                        <p><strong>Received By:</strong> {item.inward.receivedBy}</p>
                        <p><strong>Date:</strong> {new Date(item.inward.receiptDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Node 2: Stores Issuance */}
                    <div className="p-4 bg-white/60 rounded-xl border border-black/5 relative">
                      <div className="flex items-center gap-2 mb-3 text-amber-700 font-semibold text-sm">
                        <GitBranch className="w-4 h-4" />
                        2. Store Issuance to Shop
                      </div>
                      {item.issuances.length > 0 ? (
                        item.issuances.map((iss, iIdx) => (
                          <div key={iIdx} className="text-xs space-y-1 text-zinc-600 border-b border-black/5 pb-2 last:border-0">
                            <p><strong>Issue #:</strong> {iss.issueNumber}</p>
                            <p><strong>Issued Qty:</strong> {iss.issuedQty} KG</p>
                            <p><strong>Target Shop:</strong> <span className="font-bold text-indigo-700">{getProductionShopDetails(iss.productionSection).label}</span></p>
                            <p><strong>Stores Issuer:</strong> {iss.issuedBy}</p>
                            <p><strong>Operator:</strong> {iss.operator}</p>
                            <p><strong>Machine:</strong> {iss.machine}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 italic">No shop floor issuance yet</p>
                      )}
                    </div>

                    {/* Node 3: Machine & Consumption */}
                    <div className="p-4 bg-white/60 rounded-xl border border-black/5 relative">
                      <div className="flex items-center gap-2 mb-3 text-emerald-700 font-semibold text-sm">
                        <Cpu className="w-4 h-4" />
                        3. Machine & Part Production
                      </div>
                      {item.machineLogs.length > 0 ? (
                        item.machineLogs.map((mLog, mIdx) => (
                          <div key={mIdx} className="text-xs space-y-1 text-zinc-600 border-b border-black/5 pb-2 last:border-0">
                            <p><strong>Machine:</strong> {mLog.machineCode}</p>
                            <p><strong>Operator:</strong> {mLog.operatorName}</p>
                            <p><strong>Parts Produced:</strong> {mLog.producedQty} Pcs</p>
                            <p><strong>Scrap Qty:</strong> {mLog.scrapQty} Pcs</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-400 italic">In store / pending machine log</p>
                      )}
                    </div>

                  </div>

                </div>
              ))
            ) : (
              <div className="glass-panel p-8 text-center text-zinc-500">
                <Box className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                <p className="font-semibold text-zinc-800 text-lg">No Heat / Batch Record Selected</p>
                <p className="text-sm text-zinc-500 mt-1">Enter a Batch or Heat Number above to inspect full multi-stage material pedigree.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 4: TOOL & ASSET ISSUANCE */}
      {activeTab === 'ASSETS' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Filters */}
          <div className="glass p-4 rounded-2xl flex items-center gap-4 mb-4 flex-shrink-0 border border-white/60">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search tools, gauges, assets, issuer, receiver..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/60 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select 
              value={assetStatus}
              onChange={(e) => setAssetStatus(e.target.value)}
              className="px-4 py-2 bg-white/60 border border-black/10 rounded-xl text-sm font-medium text-zinc-700 outline-none"
            >
              <option value="ALL">All Return Statuses</option>
              <option value="ISSUED">Currently Issued</option>
              <option value="RETURNED">Returned to Store</option>
              <option value="OVERDUE">Overdue Return</option>
            </select>
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/40 rounded-2xl border border-white/60 p-4 shadow-inner">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-zinc-900/5 text-zinc-500 uppercase font-semibold text-[10px] tracking-wider border-b border-black/10">
                <tr>
                  <th className="px-4 py-3">Issue #</th>
                  <th className="px-4 py-3">Tool / Asset</th>
                  <th className="px-4 py-3">Issued By</th>
                  <th className="px-4 py-3">Issued To</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Expected Return</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-medium">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-zinc-900">{asset.issueNumber}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{asset.assetCode} — {asset.assetName}</td>
                    <td className="px-4 py-3">{asset.issuedByName}</td>
                    <td className="px-4 py-3 font-bold text-zinc-800">{asset.employeeName}</td>
                    <td className="px-4 py-3">{new Date(asset.issueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{asset.expectedReturnDate ? new Date(asset.expectedReturnDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3">{asset.conditionBeforeIssue}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        asset.status === 'RETURNED' ? 'bg-emerald-500/10 text-emerald-700' :
                        asset.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-700' : 'bg-amber-500/10 text-amber-700'
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      </div>
    </main>
  );
}
