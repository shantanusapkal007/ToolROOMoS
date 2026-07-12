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
    return (res?.data?.data || res?.data || res || []) as Project[]; 
  },

  getProjectById: async (id: string): Promise<Project> => {
    const res = await api.get<any>(`projects/${id}`);
    return (res?.data?.data || res?.data || res) as Project;
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const res = await api.post<any>('projects', data);
    return (res?.data?.data || res?.data || res) as Project;
  },

  getReopenImpact: async (id: string): Promise<any> => {
    const res = await api.get<any>(`projects/${id}/reopen-impact`);
    return res?.data?.data || res?.data || res;
  },

  reopenEngineering: async (id: string): Promise<any> => {
    const res = await api.patch<any>(`projects/${id}/reopen-engineering`);
    return res?.data?.data || res?.data || res;
  }
};
