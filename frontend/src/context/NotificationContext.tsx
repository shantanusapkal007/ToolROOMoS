"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../lib/api';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  category: 'APPROVAL' | 'ALERT' | 'INVENTORY' | 'SYSTEM';
  severity: 'urgent' | 'warning' | 'info' | 'success';
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  link?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  isCenterOpen: boolean;
  setIsCenterOpen: (open: boolean) => void;
  toggleCenter: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const READ_STORAGE_KEY = 'toolroom_read_notifications_v1';
const DISMISSED_STORAGE_KEY = 'toolroom_dismissed_notifications_v1';
const CUSTOM_STORAGE_KEY = 'toolroom_custom_notifications_v1';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCenterOpen, setIsCenterOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [customNotifications, setCustomNotifications] = useState<SystemNotification[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);

  // Load persisted read/dismissed states
  useEffect(() => {
    try {
      const savedRead = localStorage.getItem(READ_STORAGE_KEY);
      if (savedRead) setReadIds(new Set(JSON.parse(savedRead)));

      const savedDismissed = localStorage.getItem(DISMISSED_STORAGE_KEY);
      if (savedDismissed) setDismissedIds(new Set(JSON.parse(savedDismissed)));

      const savedCustom = localStorage.getItem(CUSTOM_STORAGE_KEY);
      if (savedCustom) setCustomNotifications(JSON.parse(savedCustom));
    } catch (e) {
      console.error("Failed to load notifications from storage", e);
    }
  }, []);

  // Save read states
  const saveReadIds = (newReadSet: Set<string>) => {
    setReadIds(newReadSet);
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(newReadSet)));
  };

  // Save dismissed states
  const saveDismissedIds = (newDismissedSet: Set<string>) => {
    setDismissedIds(newDismissedSet);
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(newDismissedSet)));
  };

  // Fetch telemetry notifications from backend
  const refreshNotifications = useCallback(async () => {
    try {
      const liveItems: SystemNotification[] = [];

      // 1. Fetch projects to evaluate Pending Approvals and Overdue stage gates
      const projects = await api.get<any[]>('/projects').catch(() => []);
      if (Array.isArray(projects)) {
        projects.forEach((proj: any) => {
          const projNum = proj.projectNumber || 'PRJ';

          // Overdue project alert
          if (proj.currentStage !== 'CLOSED' && proj.currentStage !== 'CANCELLED' && proj.targetDeliveryDate) {
            const daysLeft = Math.floor((new Date(proj.targetDeliveryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            if (daysLeft <= 0) {
              liveItems.push({
                id: `overdue-${proj.id}`,
                title: `Overdue Delivery Deadline`,
                message: `Project ${projNum} (${proj.partName || 'Part'}) is overdue by ${Math.abs(daysLeft)} days.`,
                category: 'ALERT',
                severity: 'urgent',
                timestamp: proj.targetDeliveryDate || new Date().toISOString(),
                read: false,
                dismissed: false,
                link: `/projects/${proj.id}/overview`,
                actionText: 'Review Flight Path',
              });
            }
          }

          // BOM Pending Approval
          if (proj.billOfMaterialHeaders?.some((b: any) => b.approvalStatus === 'PENDING')) {
            liveItems.push({
              id: `bom-appr-${proj.id}`,
              title: `BOM Approval Required`,
              message: `Bill of Materials for ${projNum} is awaiting engineering sign-off.`,
              category: 'APPROVAL',
              severity: 'warning',
              timestamp: proj.createdAt || new Date().toISOString(),
              read: false,
              dismissed: false,
              link: `/projects/${proj.id}/engineering`,
              actionText: 'Review BOM',
            });
          }

          // Routing Pending Approval
          if (proj.routingHeaders?.some((r: any) => r.approvalStatus === 'PENDING')) {
            liveItems.push({
              id: `routing-appr-${proj.id}`,
              title: `Routing Operations Approval`,
              message: `Routing operations for ${projNum} require production manager sign-off.`,
              category: 'APPROVAL',
              severity: 'warning',
              timestamp: proj.createdAt || new Date().toISOString(),
              read: false,
              dismissed: false,
              link: `/projects/${proj.id}/engineering`,
              actionText: 'Review Routing',
            });
          }

          // PO Pending Approval
          if (proj.purchaseOrderHeaders?.some((p: any) => p.approvalStatus === 'PENDING')) {
            liveItems.push({
              id: `po-appr-${proj.id}`,
              title: `Purchase Order Approval`,
              message: `Material purchase order for ${projNum} is pending procurement approval.`,
              category: 'APPROVAL',
              severity: 'warning',
              timestamp: proj.createdAt || new Date().toISOString(),
              read: false,
              dismissed: false,
              link: `/projects/${proj.id}/purchase`,
              actionText: 'Review PO',
            });
          }
        });
      }

      // 2. Fetch Materials / Assets for Low Stock Reorder Threshold Alerts
      const materials = await api.get<any[]>('/master-data/materials').catch(() => []);
      if (Array.isArray(materials)) {
        materials.forEach((mat: any) => {
          const qty = Number(mat.currentStock || 0);
          const minQty = Number(mat.minReorderQty || mat.reorderLevel || 10);
          if (qty <= minQty) {
            liveItems.push({
              id: `low-stock-${mat.id}`,
              title: `Low Material Inventory Stock`,
              message: `${mat.materialName || 'Material'} stock is low (${qty} remaining, min threshold: ${minQty}).`,
              category: 'INVENTORY',
              severity: 'warning',
              timestamp: mat.updatedAt || new Date().toISOString(),
              read: false,
              dismissed: false,
              link: `/inventory`,
              actionText: 'Check Inventory',
            });
          }
        });
      }

      setSystemNotifications(liveItems);
    } catch (err) {
      console.error("Failed to refresh notifications telemetry", err);
    }
  }, []);

  // Poll notifications periodically on mount when document is visible
  useEffect(() => {
    const safeRefresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      refreshNotifications();
    };
    safeRefresh();
    const interval = setInterval(safeRefresh, 120000); // 120s background telemetry refresh
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Combine live system items with user-added custom notifications
  const allNotifications = useMemo(() => {
    const merged = [...customNotifications, ...systemNotifications];
    return merged
      .filter((n) => !dismissedIds.has(n.id))
      .map((n) => ({
        ...n,
        read: readIds.has(n.id),
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [customNotifications, systemNotifications, readIds, dismissedIds]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.read).length;
  }, [allNotifications]);

  const toggleCenter = () => setIsCenterOpen((prev) => !prev);

  const markAsRead = (id: string) => {
    const nextRead = new Set(readIds);
    nextRead.add(id);
    saveReadIds(nextRead);
  };

  const markAllAsRead = () => {
    const nextRead = new Set(readIds);
    allNotifications.forEach((n) => nextRead.add(n.id));
    saveReadIds(nextRead);
  };

  const dismissNotification = (id: string) => {
    const nextDismissed = new Set(dismissedIds);
    nextDismissed.add(id);
    saveDismissedIds(nextDismissed);
  };

  const clearAll = () => {
    const nextDismissed = new Set(dismissedIds);
    allNotifications.forEach((n) => nextDismissed.add(n.id));
    saveDismissedIds(nextDismissed);
  };

  const addNotification = (item: Omit<SystemNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
    const newNotif: SystemNotification = {
      ...item,
      id: `custom-${Date.now()}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().substring(0, 8) : Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      dismissed: false,
    };
    const updated = [newNotif, ...customNotifications];
    setCustomNotifications(updated);
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: allNotifications,
        unreadCount,
        isCenterOpen,
        setIsCenterOpen,
        toggleCenter,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearAll,
        addNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
