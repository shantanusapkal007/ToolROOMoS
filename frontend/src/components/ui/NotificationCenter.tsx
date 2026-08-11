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

  const getCategoryIcon = (category: SystemNotification['category']) => {
    switch (category) {
      case 'APPROVAL':
        return <ShieldCheck className="w-4 h-4 text-accent-orange" />;
      case 'ALERT':
        return <AlertTriangle className="w-4 h-4 text-accent-red" />;
      case 'INVENTORY':
        return <Package className="w-4 h-4 text-accent-green" />;
      default:
        return <Info className="w-4 h-4 text-accent-blue-info" />;
    }
  };

  const getBadgeStyle = (category: SystemNotification['category']) => {
    switch (category) {
      case 'APPROVAL':
        return 'bg-canvas text-accent-orange border-border-gray';
      case 'ALERT':
        return 'bg-canvas text-accent-red border-border-gray';
      case 'INVENTORY':
        return 'bg-canvas text-accent-green border-border-gray';
      default:
        return 'bg-canvas text-accent-blue-info border-border-gray';
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer Panel: card-feature chrome + level-4 shadow */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md bg-canvas h-full border-l border-border-gray shadow-level-4 flex flex-col z-10 overflow-hidden"
          >
            {/* Header Area */}
            <div className="p-6 border-b border-border-gray bg-canvas flex flex-col space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-[10px] bg-primary text-on-primary flex items-center justify-center relative">
                    <Bell className="w-4.5 h-4.5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-red text-on-primary text-[10px] font-medium flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-display-xs font-medium text-ink tracking-tight">Notification Center</h3>
                    <p className="text-caption text-mute">Alerts & System Notifications</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleManualRefresh}
                    className="p-1.5 rounded-[10px] text-mute hover:text-ink hover:bg-hairline/20 transition-colors"
                    title="Refresh Notifications"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-accent-blue-info' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsCenterOpen(false)}
                    className="p-1.5 rounded-[10px] text-mute hover:text-ink hover:bg-hairline/20 transition-colors"
                    title="Close Drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1 p-1 bg-canvas rounded-[10px] border border-border-gray">
                {(['ALL', 'UNREAD', 'APPROVAL', 'ALERT'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-caption font-medium uppercase tracking-tight rounded-xs transition-colors ${
                      activeTab === tab
                        ? 'bg-primary text-on-primary'
                        : 'text-mute hover:text-ink'
                    }`}
                  >
                    {tab === 'UNREAD' ? `Unread (${unreadCount})` : tab}
                  </button>
                ))}
              </div>

              {/* Top Controls Bar */}
              <div className="flex items-center justify-between text-caption pt-1">
                <span className="text-mute">
                  Showing {filteredNotifications.length} alerts
                </span>
                <div className="flex items-center space-x-3 font-medium">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-accent-blue-info hover:underline flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                  {filteredNotifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-mute hover:text-accent-red flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notification List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`group relative p-4 rounded-[10px] border transition-colors ${
                      notif.read
                        ? 'bg-canvas border-border-gray/60'
                        : 'bg-canvas border-border-gray shadow-subtle'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-accent-blue-info" />
                    )}

                    <div className="flex items-start space-x-3">
                      {/* Icon badge */}
                      <div className="p-2 rounded-[10px] border border-border-gray bg-canvas shrink-0 mt-0.5">
                        {getCategoryIcon(notif.category)}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-caption font-medium uppercase px-2 py-0.5 rounded-[10px] border ${getBadgeStyle(notif.category)}`}>
                            {notif.category}
                          </span>
                          <span className="text-caption-mono text-mute">
                            {formatRelativeTime(notif.timestamp)}
                          </span>
                        </div>

                        <h4 className="text-body-sm-strong text-ink leading-snug mb-1">
                          {notif.title}
                        </h4>
                        <p className="text-body-sm text-body-mid leading-relaxed mb-3">
                          {notif.message}
                        </p>

                        {/* Action Toolbar */}
                        <div className="flex items-center justify-between pt-2 border-t border-border-gray">
                          {notif.link && (
                            <button
                              onClick={() => handleActionClick(notif)}
                              className="text-body-sm text-accent-blue-info hover:underline flex items-center space-x-1 transition-colors"
                            >
                              <span>{notif.actionText || 'View Details'}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <div className="flex items-center space-x-1 ml-auto">
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="p-1 rounded-[10px] text-mute hover:text-accent-green hover:bg-hairline/20 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => dismissNotification(notif.id)}
                              className="p-1 rounded-[10px] text-mute hover:text-accent-red hover:bg-hairline/20 transition-colors"
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
                  <div className="w-12 h-12 rounded-full bg-canvas border border-border-gray flex items-center justify-center mb-4 text-accent-green">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-body-md font-medium text-ink">All Caught Up</h4>
                  <p className="text-body-sm text-mute max-w-xs mt-1 leading-relaxed">
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
