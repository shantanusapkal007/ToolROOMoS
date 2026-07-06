import { api } from '../lib/api';

export const InventoryService = {
  getBatches: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/inventory-batches`);
    return res.data;
  },
  getInventoryLedger: async (): Promise<any> => {
    const res = await api.get(`master-data/inventory-ledger`);
    return res.data;
  },
};
