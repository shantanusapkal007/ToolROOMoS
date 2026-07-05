import { api } from '../lib/api';

export const MasterDataService = {
  getRegistry: async <T = any>(registryId: string): Promise<T[]> => {
    const res = await api.get<T[]>(`master-data/${registryId}`);
    return res.data as unknown as T[];
  },
};
