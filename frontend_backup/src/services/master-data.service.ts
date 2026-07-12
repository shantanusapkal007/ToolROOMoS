import { api } from '../lib/api';

export const MasterDataService = {
  getRegistry: async <T = any>(registryId: string): Promise<T[]> => {
    const res = await api.get<any>(`master-data/${registryId}`);
    const body = res.data;
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.data)) return body.data;
    if (body && body.data && Array.isArray(body.data.data)) return body.data.data;
    return [];
  },
};
