import { api, ApiResponse } from '../lib/api';

export interface Project {
  id: string;
  projectNumber: string;
  partName: string;
  currentStage: string;
  status: string;
  customer?: { companyName: string };
  targetDeliveryDate?: string;
  deliveryDate?: string;
  dispatchNotes?: any[];
  projectCostSummary?: any;
  drawings?: any[];
  inspectionHeaders?: any[];
  purchaseOrderHeaders?: any[];
  projectActivities?: any[];
  goodsReceiptHeaders?: any[];
  materialIssueHeaders?: any[];
  inventoryTransactions?: any[];
  invoiceHeaders?: any[];
  createdAt: string;
  [key: string]: any;
}

export const ProjectsService = {
  getAllProjects: async (): Promise<Project[]> => {
    const res = await api.get<any>('projects');
    const body = res?.data;
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.data)) return body.data;
    if (body && body.data && Array.isArray(body.data.data)) return body.data.data;
    return [];
  },

  getProjectById: async (id: string): Promise<Project> => {
    const res = await api.get<any>(`projects/${id}`);
    const body = res?.data;
    if (body && body.data) return body.data;
    return body as Project;
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const res = await api.post<Project>('projects', data);
    return res.data as unknown as Project;
  },

  getReopenImpact: async (id: string): Promise<any> => {
    const res = await api.get<any>(`projects/${id}/reopen-impact`);
    return res.data;
  },

  reopenEngineering: async (id: string): Promise<any> => {
    const res = await api.patch<any>(`projects/${id}/reopen-engineering`);
    return res.data;
  },

  completeProduction: async (id: string, remarks?: string): Promise<Project> => {
    const res = await api.post<any>(`projects/${id}/complete-production`, { remarks });
    const body = res?.data;
    if (body && body.data) return body.data;
    return body as Project;
  },

  completeProject: async (id: string, remarks?: string): Promise<Project> => {
    const res = await api.post<any>(`projects/${id}/complete-project`, { remarks });
    const body = res?.data;
    if (body && body.data) return body.data;
    return body as Project;
  }
};
