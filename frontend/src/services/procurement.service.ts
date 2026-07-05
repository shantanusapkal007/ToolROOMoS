import { api } from '../lib/api';

export const ProcurementService = {
  getPurchaseOrders: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/purchase-orders`);
    return res.data;
  },

  createPurchaseOrder: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/purchase-orders`, data);
    return res.data;
  },

  processGRN: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/goods-receipts`, data);
    return res.data;
  },
};
