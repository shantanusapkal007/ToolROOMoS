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
  createBatch: async (data: any): Promise<any> => {
    const res = await api.post(`master-data/inventory-ledger`, data);
    return res.data;
  },
  getProjectMaterialInventory: async (params?: { projectId?: string; section?: string; search?: string }): Promise<any> => {
    const res = await api.get('reports/project-material-inventory', { params });
    return (res as any)?.data ?? res;
  },
};
