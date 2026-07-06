import { api } from '../lib/api';

export const QualityService = {
  logInspection: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/inspections`, data);
    return res.data;
  },
  closeNcr: async (projectId: string, ncrId: string, data: any): Promise<any> => {
    const res = await api.put(`projects/${projectId}/ncr/${ncrId}/close`, data);
    return res.data;
  }
};
