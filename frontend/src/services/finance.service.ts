import { api } from '../lib/api';

export const FinanceService = {
  getCostEvents: async (projectId: string): Promise<any> => {
    const res = await api.get(`projects/${projectId}/cost-events`);
    return res.data;
  },

  createInvoice: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/invoices`, data);
    return res.data;
  },

  recordPayment: async (projectId: string, data: any): Promise<any> => {
    const res = await api.post(`projects/${projectId}/payments`, data);
    return res.data;
  }
};
