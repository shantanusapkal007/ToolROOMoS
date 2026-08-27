import { api } from '../lib/api';

export interface PartReworkOrder {
  id: string;
  projectId: string;
  reworkNumber: string;
  partName: string;
  partNumber?: string;
  bomItemId?: string;
  sourceStage: string;
  reworkType: string;
  defectReason: string;
  description: string;
  quantity: number;
  severity: string;
  status: 'REQUESTED' | 'APPROVED' | 'IN_REWORK' | 'RE_INSPECTION' | 'COMPLETED' | 'REJECTED_SCRAPPED';
  targetDepartment: string;
  assignedTo?: string;
  machineId?: string;
  estimatedHours: number | string;
  actualHours: number | string;
  costImpact: number | string;
  inspectionResult?: string;
  resolutionNotes?: string;
  trialId?: string;
  ncrId?: string;
  requestedBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  trial?: {
    id: string;
    trialNumber: string;
    trialStage?: string;
    status: string;
  };
}

export const PartReworkService = {
  getReworkOrders: async (projectId: string): Promise<PartReworkOrder[]> => {
    const res: any = await api.get(`/projects/${projectId}/rework-orders`);
    const data = res?.data !== undefined ? res.data : res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },

  getReworkOrderById: async (projectId: string, id: string): Promise<PartReworkOrder> => {
    const res: any = await api.get(`/projects/${projectId}/rework-orders/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  createReworkOrder: async (projectId: string, payload: Partial<PartReworkOrder>): Promise<PartReworkOrder> => {
    const res: any = await api.post(`/projects/${projectId}/rework-orders`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  updateReworkStatus: async (projectId: string, id: string, payload: any): Promise<PartReworkOrder> => {
    const res: any = await api.put(`/projects/${projectId}/rework-orders/${id}/status`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  deleteReworkOrder: async (projectId: string, id: string): Promise<any> => {
    const res: any = await api.delete(`/projects/${projectId}/rework-orders/${id}`);
    return res?.data !== undefined ? res.data : res;
  },
};
