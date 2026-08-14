import { api } from '../lib/api';

export const ProcurementService = {
  getPurchaseOrders: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/purchase-orders`);
    return res.data;
  },

  getAllGlobalPurchaseOrders: async (): Promise<any> => {
    const res = await api.get(`procurement/purchase-orders`);
    return res.data;
  },

  getPoById: async (id: string): Promise<any> => {
    const res = await api.get(`procurement/purchase-orders/${id}`);
    return res.data;
  },

  getGlobalBomItems: async (): Promise<any> => {
    const res = await api.get(`procurement/bom-items`);
    return res.data;
  },

  createMultiProjectPo: async (data: any): Promise<any> => {
    const res = await api.post(`procurement/purchase-orders`, data);
    return res.data;
  },

  createPurchaseOrder: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/purchase-orders`, data);
    return res.data;
  },

  updatePurchaseOrder: async (projectId: string, poId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/purchase-orders/${poId}`, data);
    return res.data;
  },

  processGRN: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/goods-receipts`, data);
    return res.data;
  },

  deletePurchaseOrder: async (projectId: string, poId: string): Promise<any> => {
    try {
      const res = await api.delete(`projects/${projectId}/purchase-orders/${poId}`);
      return res.data;
    } catch (err) {
      const res = await api.delete(`procurement/purchase-orders/${poId}`);
      return res.data;
    }
  },

  getDeadMaterials: async (): Promise<any> => {
    const res = await api.get(`procurement/dead-materials`);
    return res.data;
  },
};
