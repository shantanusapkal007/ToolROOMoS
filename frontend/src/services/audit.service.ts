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

export interface TaskAssignment {
  id: string;
  category: 'PROJECT_TASK' | 'JOB_CARD' | 'MAINTENANCE_TICKET';
  taskName: string;
  description: string;
  projectNumber?: string;
  assignedToName: string;
  assignedByName: string;
  status: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  assignedAt: string;
}

export interface MaterialMovement {
  id: string;
  issueNumber: string;
  type: string;
  date: string;
  projectNumber?: string;
  partName?: string;
  productionSection: string;
  materialCode: string;
  materialGrade: string;
  batchNumber: string;
  heatNumber: string;
  issuedQty: number;
  materialValue: number;
  issuedByName: string;
  remarks?: string;
}

export interface MaterialGenealogy {
  batchId: string;
  batchNumber: string;
  heatNumber: string;
  materialCode: string;
  materialGrade: string;
  currentQty: number;
  receivedQty: number;
  status: string;
  rackLocation: string;
  inward: {
    grnNumber: string;
    supplierChallan: string;
    receiptDate: string;
    receivedBy: string;
    poNumber: string;
    vendorName: string;
    projectNumber: string;
  };
  issuances: Array<{
    issueNumber: string;
    issueDate: string;
    issuedQty: number;
    projectNumber?: string;
    productionSection?: string;
    issuedBy: string;
    machine?: string;
    operator?: string;
  }>;
  machineLogs: Array<{
    reportDate: string;
    machineCode?: string;
    operatorName?: string;
    producedQty: number;
    scrapQty: number;
    projectNumber?: string;
  }>;
}

export interface AssetIssuance {
  id: string;
  issueNumber: string;
  assetCode: string;
  assetName: string;
  categoryName?: string;
  employeeName: string;
  departmentName?: string;
  quantity: number;
  issueDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  conditionBeforeIssue: string;
  conditionAfterReturn?: string;
  status: string;
  issuedByName: string;
  remarks?: string;
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
    return res as unknown as { data: AuditEvent[]; meta: any };
  },

  getAuditStats: async (): Promise<AuditStats> => {
    const res = await api.get<AuditStats>('audit-logs/stats');
    return res.data as unknown as AuditStats;
  },

  getEntityLogs: async (entityType: string, entityId: string): Promise<AuditEvent[]> => {
    const res = await api.get<AuditEvent[]>(`audit-logs/entity/${entityType}/${entityId}`);
    return res.data as unknown as AuditEvent[];
  },

  getTaskAssignments: async (search?: string, type?: string): Promise<TaskAssignment[]> => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (type) query.append('type', type);
    const res = await api.get<TaskAssignment[]>(`audit-logs/task-assignments?${query.toString()}`);
    return (res.data || res) as unknown as TaskAssignment[];
  },

  getMaterialMovements: async (search?: string): Promise<MaterialMovement[]> => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    const res = await api.get<MaterialMovement[]>(`audit-logs/material-movements?${query.toString()}`);
    return (res.data || res) as unknown as MaterialMovement[];
  },

  getGenealogy: async (query: string): Promise<MaterialGenealogy[]> => {
    const res = await api.get<MaterialGenealogy[]>(`audit-logs/genealogy?query=${encodeURIComponent(query)}`);
    return (res.data || res) as unknown as MaterialGenealogy[];
  },

  getAssetIssuances: async (search?: string, status?: string): Promise<AssetIssuance[]> => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (status) query.append('status', status);
    const res = await api.get<AssetIssuance[]>(`audit-logs/asset-issuances?${query.toString()}`);
    return (res.data || res) as unknown as AssetIssuance[];
  }
};

