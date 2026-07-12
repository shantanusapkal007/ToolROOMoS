import { api } from '../lib/api';

export const EngineeringService = {
  getGlobalBOMs: async (projectId?: string): Promise<any> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const res = await api.get<any>(`engineering/bom${params}`);
    return res?.data?.data || res?.data || res || [];
  },

  getBOM: async (bomId: string): Promise<any> => {
    const res = await api.get<any>(`engineering/bom/${bomId}`);
    return res?.data?.data || res?.data || res;
  },

  getGlobalRoutings: async (projectId?: string): Promise<any> => {
    const params = projectId ? `?projectId=${projectId}` : '';
    const res = await api.get<any>(`engineering/routing${params}`);
    return res?.data?.data || res?.data || res || [];
  },
  
  getRouting: async (routingId: string): Promise<any> => {
    const res = await api.get<any>(`engineering/routing/${routingId}`);
    return res?.data?.data || res?.data || res;
  },

  updateBOM: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/bom`, data);
    return res.data;
  },

  deleteBOM: async (projectId: string, bomId: string): Promise<any> => {
    const res = await api.delete(`projects/${projectId}/bom/${bomId}`);
    return res.data;
  },

  duplicateBOM: async (projectId: string, bomId: string): Promise<any> => {
    const res = await api.post(`projects/${projectId}/bom/${bomId}/duplicate`);
    return res.data;
  },

  approveBOM: async (projectId: string, bomId: string): Promise<any> => {
    const res = await api.patch(`engineering/bom/${bomId}/approve`, {});
    return res.data;
  },

  updateRouting: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/routing`, data);
    return res.data;
  },

  deleteRouting: async (projectId: string, routingId: string): Promise<any> => {
    const res = await api.delete(`projects/${projectId}/routing/${routingId}`);
    return res.data;
  },

  duplicateRouting: async (projectId: string, routingId: string): Promise<any> => {
    const res = await api.post(`projects/${projectId}/routing/${routingId}/duplicate`);
    return res.data;
  },

  approveRouting: async (projectId: string, routingId: string): Promise<any> => {
    const res = await api.put(`projects/${projectId}/routing/${routingId}/approve`, {});
    return res.data;
  }
};
