import { api } from '../lib/api';

export const ProductionService = {
  getJobCards: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/job-cards`);
    return res.data;
  },

  getMSDRs: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/machine-shop-reports`);
    return res.data;
  },

  getIssues: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/material-issues`);
    return res.data;
  },

  generateJobCards: async (projectId: string): Promise<any> => {
    const res = await api.post(`projects/${projectId}/job-cards/generate`);
    return res.data;
  },

  updateJobCardStatus: async (projectId: string, jobCardId: string, status: string, operatorId?: string): Promise<any> => {
    const res = await api.patch(`projects/${projectId}/job-cards/${jobCardId}/status`, { status, operatorId });
    return res.data;
  },

  deleteJobCard: async (projectId: string, jobCardId: string): Promise<any> => {
    const res = await api.delete(`projects/${projectId}/job-cards/${jobCardId}`);
    return res.data;
  },

  logMSDR: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/machine-shop-reports`, data);
    return res.data;
  },

  issueMaterial: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/material-issues`, data);
    return res.data;
  },

  returnMaterial: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/material-returns`, data);
    return res.data;
  },
};
