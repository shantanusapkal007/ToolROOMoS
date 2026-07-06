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
    // Axios response.data is already returned via interceptor, but our interceptor returns `response.data`
    // which has `{ status, data: Project[] }`. Let's handle the extraction.
    const res = await api.get<Project[]>('projects');
    // If the backend returns { data: [...] } we return res.data.
    // Given the ApiResponse interface, res.data contains the payload.
    return res.data as unknown as Project[]; 
  },

  getProjectById: async (id: string): Promise<Project> => {
    const res = await api.get<Project>(`projects/${id}`);
    return res.data as unknown as Project;
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
  }
};
