import { api } from '../lib/api';

export const DispatchService = {
  createDispatch: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/dispatches`, data);
    return res.data;
  },
};
