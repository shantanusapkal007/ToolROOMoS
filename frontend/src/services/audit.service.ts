import { api } from '../lib/api';

export interface AuditEvent {
  id: string;
  entityId: string;
  entityType: string;
  action: string;
  performedBy: string;
  user?: { name: string; role: string };
  snapshot?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditStats {
  totalToday: number;
  mostActiveUser: string | null;
  mostActiveEntity: string | null;
  uniqueUsersActiveToday: number;
}

export const AuditService = {
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
    performedBy?: string;
    search?: string;
  }): Promise<{ data: AuditEvent[]; meta: any }> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.entityType) query.append('entityType', params.entityType);
    if (params?.action) query.append('action', params.action);
    if (params?.performedBy) query.append('performedBy', params.performedBy);
    if (params?.search) query.append('search', params.search);

    const res = await api.get<{ data: AuditEvent[]; meta: any }>(`audit-logs?${query.toString()}`);
    // api interceptor returns response.data already
    return res as unknown as { data: AuditEvent[]; meta: any };
  },

  getAuditStats: async (): Promise<AuditStats> => {
    const res = await api.get<AuditStats>('audit-logs/stats');
    return res.data as unknown as AuditStats;
  },

  getEntityLogs: async (entityType: string, entityId: string): Promise<AuditEvent[]> => {
    const res = await api.get<AuditEvent[]>(`audit-logs/entity/${entityType}/${entityId}`);
    return res.data as unknown as AuditEvent[];
  }
};
