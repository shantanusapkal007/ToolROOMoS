import { api } from '../lib/api';

export const EngineeringService = {
  getBOM: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/bom`);
    return res.data;
  },
  
  getRouting: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/routing`);
    return res.data;
  },

  updateBOM: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/bom`, data);
    return res.data;
  },

  approveBOM: async (projectId: string, bomId: string): Promise<any> => {
    const res = await api.put(`projects/${projectId}/bom/${bomId}/approve`, {});
    return res.data;
  },

  updateRouting: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/routing`, data);
    return res.data;
  },

  approveRouting: async (projectId: string, routingId: string): Promise<any> => {
    const res = await api.put(`projects/${projectId}/routing/${routingId}/approve`, {});
    return res.data;
  }
};
