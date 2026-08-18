import { api } from '../lib/api';

export const DispatchService = {
  createDispatch: async (projectId: string, data: any): Promise<any> => {
    const res: any = await api.post(`projects/${projectId}/dispatch-notes`, data);
    return res?.data !== undefined ? res.data : res;
  },
};
