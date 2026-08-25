import { api } from '../lib/api';

export const ProcurementService = {
  getPurchaseOrders: async (projectId: string): Promise<any> => {
    const res: any = await api.get(`projects/${projectId}/purchase-orders`);
    return res?.data !== undefined ? res.data : res;
  },

  getAllGlobalPurchaseOrders: async (): Promise<any> => {
    const res: any = await api.get(`procurement/purchase-orders`);
    return res?.data !== undefined ? res.data : res;
  },

  getPoById: async (id: string): Promise<any> => {
    const res: any = await api.get(`procurement/purchase-orders/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  getGlobalBomItems: async (): Promise<any> => {
    const res: any = await api.get(`procurement/bom-items`);
    return res?.data !== undefined ? res.data : res;
  },

  createMultiProjectPo: async (data: any): Promise<any> => {
    const res: any = await api.post(`procurement/purchase-orders`, data);
    return res?.data !== undefined ? res.data : res;
  },

  createPurchaseOrder: async (projectId: string, data: any): Promise<any> => {
    const res: any = await api.post(`projects/${projectId}/purchase-orders`, data);
    return res?.data !== undefined ? res.data : res;
  },

  updatePurchaseOrder: async (projectId: string, poId: string, data: any): Promise<any> => {
    const res: any = await api.post(`projects/${projectId}/purchase-orders/${poId}`, data);
    return res?.data !== undefined ? res.data : res;
  },

  processGRN: async (projectId: string, data: any): Promise<any> => {
    const res: any = await api.post(`projects/${projectId}/goods-receipts`, data);
    return res?.data !== undefined ? res.data : res;
  },

  getAllGoodsReceipts: async (): Promise<any> => {
    const res: any = await api.get(`procurement/goods-receipts`);
    return res?.data !== undefined ? res.data : res;
  },

  getGoodsReceipts: async (projectId: string): Promise<any> => {
    const res: any = await api.get(`projects/${projectId}/goods-receipts`);
    return res?.data !== undefined ? res.data : res;
  },

  deletePurchaseOrder: async (projectId: string, poId: string): Promise<any> => {
    try {
      const res: any = await api.delete(`projects/${projectId}/purchase-orders/${poId}`);
      return res?.data !== undefined ? res.data : res;
    } catch (err) {
      const res: any = await api.delete(`procurement/purchase-orders/${poId}`);
      return res?.data !== undefined ? res.data : res;
    }
  },

  getDeadMaterials: async (): Promise<any> => {
    const res: any = await api.get(`procurement/dead-materials`);
    return res?.data !== undefined ? res.data : res;
  },
};
