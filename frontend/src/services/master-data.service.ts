import { api } from '../lib/api';

export const MasterDataService = {
  getRegistry: async <T = any>(registryId: string): Promise<T[]> => {
    const res: any = await api.get(`master-data/${registryId}`);
    const data = res?.data !== undefined ? res.data : res;
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  },
  createItem: async <T = any>(registryId: string, payload: any): Promise<T> => {
    const res: any = await api.post(`master-data/${registryId}`, payload);
    return (res?.data !== undefined ? res.data : res) as T;
  },
};
