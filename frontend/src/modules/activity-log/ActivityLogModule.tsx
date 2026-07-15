"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar,
  User as UserIcon,
  Database,
  Layers,
  ChevronDown
} from 'lucide-react';
import { AuditService, AuditEvent, AuditStats } from '../../services/audit.service';
import { HistoryTimeline } from '../../components/ui/HistoryTimeline';

export function ActivityLogModule() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [entityType, setEntityType] = useState('ALL');
  const [action, setAction] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadData = async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      
      const [logsRes, statsRes] = await Promise.all([
        AuditService.getAuditLogs({ 
          page: currentPage, 
          limit: 20, 
          entityType: entityType !== 'ALL' ? entityType : undefined,
          action: action !== 'ALL' ? action : undefined,
          search: search || undefined
        }),
        AuditService.getAuditStats()
      ]);

      if (resetPage) {
        setLogs(logsRes.data || []);
      } else {
        setLogs(prev => [...prev, ...(logsRes.data || [])]);
      }
      
      setHasMore(logsRes.data?.length === 20);
      setStats(statsRes);
      
      if (resetPage) setPage(1);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [entityType, action, search]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadData();
  };

  // Map to format Timeline expects
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

  const statCards = [
    { title: "Events Today", value: stats?.totalToday || 0, icon: <Activity className="w-5 h-5 text-blue-500" />, color: "from-blue-500/10 to-transparent" },
    { title: "Most Active User", value: stats?.mostActiveUser || 'N/A', icon: <UserIcon className="w-5 h-5 text-emerald-500" />, color: "from-emerald-500/10 to-transparent" },
    { title: "Most Modified Entity", value: stats?.mostActiveEntity || 'N/A', icon: <Database className="w-5 h-5 text-purple-500" />, color: "from-purple-500/10 to-transparent" },
    { title: "Active Users Today", value: stats?.uniqueUsersActiveToday || 0, icon: <Layers className="w-5 h-5 text-orange-500" />, color: "from-orange-500/10 to-transparent" }
  ];

  return (
    <main className="flex-1 flex flex-col h-full pl-24 pr-6 py-6 relative z-10 overflow-hidden">
      
      <div className="flex items-end justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-display font-semibold tracking-tight text-zinc-900 mb-2">Activity Log</h1>
          <p className="text-body-large text-zinc-500">Complete traceability — who did what, when</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadData(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-xl shadow-sm hover:shadow-elevation transition-all text-sm font-medium text-zinc-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 flex-shrink-0">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
            className="glass-panel p-5 relative group overflow-hidden border border-black/5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-zinc-900">{stat.value}</h3>
              </div>
              <div className="p-2 bg-white/60 rounded-lg shadow-sm border border-black/5">
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-2xl flex items-center gap-4 mb-6 flex-shrink-0 shadow-elevation">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search activity, entity ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-4 py-2.5 bg-white/50 border border-black/10 rounded-xl text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Entities</option>
            <option value="PROJECT">Project</option>
            <option value="PURCHASE_ORDER">Purchase Order</option>
            <option value="BILL_OF_MATERIAL">BOM</option>
            <option value="GOODS_RECEIPT">Goods Receipt</option>
            <option value="MATERIAL">Material</option>
            <option value="MAINTENANCE_TICKET">Maintenance Ticket</option>
          </select>

          <select 
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="px-4 py-2.5 bg-white/50 border border-black/10 rounded-xl text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATED">Created</option>
            <option value="UPDATED">Updated</option>
            <option value="DELETED">Deleted</option>
            <option value="STATUS_CHANGE">Status Change</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/40 rounded-2xl border border-black/5 p-6 shadow-inner">
        {logs.length > 0 ? (
          <div className="max-w-4xl mx-auto pb-10">
            <HistoryTimeline events={timelineEvents} />
            
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button 
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium shadow-elevation hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More History'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center shadow-inner">
              <Activity className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-body-large font-medium">No activity found</p>
            <p className="text-sm">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>

    </main>
  );
}
