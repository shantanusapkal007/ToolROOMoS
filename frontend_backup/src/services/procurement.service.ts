import { api } from '../lib/api';

export const ProcurementService = {
  getPurchaseOrders: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/purchase-orders`);
    return res.data;
  },

  createPurchaseOrder: async (projectId: string, data: any) => {
    const res = await api.post(`projects/${projectId}/purchase-orders`, data);
    return res.data;
  },

  updatePurchaseOrder: async (projectId: string, poId: string, data: any) => {
    const res = await api.patch(`projects/${projectId}/purchase-orders/${poId}`, data);
    return res.data;
  },

  deletePurchaseOrder: async (projectId: string, poId: string) => {
    const res = await api.delete(`projects/${projectId}/purchase-orders/${poId}`);
    return res.data;
  },

  processGRN: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/goods-receipts`, data);
    return res.data;
  },

  generatePoFromShortage: async (projectId: string) => {
    const res = await api.post(`projects/${projectId}/purchase-orders/generate-from-shortage`);
    return res.data;
  },

  approvePo: async (projectId: string, poId: string) => {
    const res = await api.post(`projects/${projectId}/purchase-orders/${poId}/approve`);
    return res.data;
  },
};
