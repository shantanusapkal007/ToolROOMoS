"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, Package, Info, RefreshCw, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications, SystemNotification } from '../../context/NotificationContext';

export const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    isCenterOpen, 
    setIsCenterOpen, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification, 
    clearAll,
    refreshNotifications 
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'APPROVAL' | 'ALERT'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  if (typeof window === 'undefined') return null;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.read;
    if (activeTab === 'APPROVAL') return n.category === 'APPROVAL';
    if (activeTab === 'ALERT') return n.category === 'ALERT' || n.category === 'INVENTORY';
    return true;
  });

  const handleActionClick = (notification: SystemNotification) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
      setIsCenterOpen(false);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  const getCategoryIcon = (category: SystemNotification['category'], severity: SystemNotification['severity']) => {
    switch (category) {
      case 'APPROVAL':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case 'ALERT':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'INVENTORY':
        return <Package className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getBadgeStyle = (category: SystemNotification['category']) => {
    switch (category) {
      case 'APPROVAL':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ALERT':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'INVENTORY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return createPortal(
    <AnimatePresence>
      {isCenterOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCenterOpen(false)}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#FBFBFC]/95 backdrop-blur-3xl h-full border-l border-black/10 shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* Header Area */}
            <div className="p-5 border-b border-black/5 bg-white/60 backdrop-blur-md flex flex-col space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm border border-zinc-700/80 relative">
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-elevation border border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 tracking-tight">Notification Center</h3>
                    <p className="text-[11px] text-zinc-500 font-medium">Alerts & System Notifications</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleManualRefresh}
                    className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition-all"
                    title="Refresh Notifications"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsCenterOpen(false)}
                    className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 border border-black/10 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-all active:scale-[0.95]"
                    title="Close Drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1 p-1 bg-black/5 rounded-xl border border-black/5">
                {(['ALL', 'UNREAD', 'APPROVAL', 'ALERT'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                      activeTab === tab
                        ? 'bg-white text-zinc-900 shadow-sm border border-black/5'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {tab === 'UNREAD' ? `Unread (${unreadCount})` : tab}
                  </button>
                ))}
              </div>

              {/* Top Controls Bar */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-zinc-500 font-medium text-[11px]">
                  Showing {filteredNotifications.length} alerts
                </span>
                <div className="flex items-center space-x-3 text-[11px] font-bold">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                  {filteredNotifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-zinc-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notification List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 ${
                      notif.read
                        ? 'bg-white/60 border-black/5 hover:border-black/10 shadow-xs'
                        : 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-500/10'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-600" />
                    )}

                    <div className="flex items-start space-x-3">
                      {/* Icon badge */}
                      <div className={`p-2 rounded-xl border ${getBadgeStyle(notif.category)} shrink-0 mt-0.5`}>
                        {getCategoryIcon(notif.category, notif.severity)}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getBadgeStyle(notif.category)}`}>
                            {notif.category}
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-400 font-mono">
                            {formatRelativeTime(notif.timestamp)}
                          </span>
                        </div>

                        <h4 className="text-xs font-extrabold text-zinc-900 tracking-tight leading-snug mb-1">
                          {notif.title}
                        </h4>
                        <p className="text-[11px] text-zinc-600 leading-relaxed mb-3">
                          {notif.message}
                        </p>

                        {/* Action Toolbar */}
                        <div className="flex items-center justify-between pt-2 border-t border-black/5">
                          {notif.link && (
                            <button
                              onClick={() => handleActionClick(notif)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 group/btn transition-colors"
                            >
                              <span>{notif.actionText || 'View Details'}</span>
                              <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </button>
                          )}

                          <div className="flex items-center space-x-1 ml-auto">
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="p-1 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => dismissNotification(notif.id)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Dismiss"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4 h-full">
                  <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-black/5 flex items-center justify-center mb-4 shadow-sm">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900">All Caught Up</h4>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1.5 leading-relaxed">
                    No pending notifications or action items in this queue.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
