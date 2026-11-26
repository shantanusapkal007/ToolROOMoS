import { api } from '../lib/api';

export interface MultiSubcontractOrderItemPayload {
  projectId: string;
  inventoryBatchId?: string;
  operationId: string;
  sentQty: number;
  hoursPerPc?: number;
  rate: number;
  remarks?: string;
}

export interface CreateMultiSubcontractOrderPayload {
  vendorId: string;
  documentNumber?: string;
  expectedReturnDate?: string;
  remarks?: string;
  items: MultiSubcontractOrderItemPayload[];
}

function unwrapData<T = any>(res: any): T {
  const body = res?.data !== undefined ? res.data : res;
  if (body && typeof body === 'object' && 'data' in body && body.status === 'success') {
    return body.data as T;
  }
  return body as T;
}

export const SubcontractingService = {
  getAllGlobalOrders: async (): Promise<any[]> => {
    const res = await api.get('subcontracting/orders');
    const data = unwrapData<any>(res);
    return Array.isArray(data) ? data : [];
  },

  getAvailableBatches: async (): Promise<any[]> => {
    const res = await api.get('subcontracting/inventory-batches');
    const data = unwrapData<any>(res);
    return Array.isArray(data) ? data : [];
  },

  createMultiProjectOrders: async (
    payload: CreateMultiSubcontractOrderPayload,
  ): Promise<any> => {
    const res = await api.post('subcontracting/multi-orders', payload);
    return unwrapData(res);
  },

  createReceipt: async (projectId: string, orderId: string, payload: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/subcontract-orders/${orderId}/receipt`, payload);
    return unwrapData(res);
  },

  cancelOrder: async (projectId: string, orderId: string): Promise<any> => {
    const res = await api.post(`projects/${projectId}/subcontract-orders/${orderId}/cancel`);
    return unwrapData(res);
  },

  deleteOrder: async (projectId: string, orderId: string): Promise<any> => {
    const res = await api.delete(`projects/${projectId}/subcontract-orders/${orderId}`);
    return unwrapData(res);
  },
};
