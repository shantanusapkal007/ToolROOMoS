import { api } from '../lib/api';

export const RfqService = {
  // ─── RFQ CRUD ────────────────────────────────────────────────
  createRfq: async (data: any): Promise<any> => {
    const res: any = await api.post('rfq', data);
    return res?.data !== undefined ? res.data : res;
  },

  listRfqs: async (params?: { status?: string; customerId?: string; projectId?: string; search?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.customerId) query.set('customerId', params.customerId);
    if (params?.projectId) query.set('projectId', params.projectId);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const res: any = await api.get(`rfq${qs ? `?${qs}` : ''}`);
    return res?.data !== undefined ? res.data : res;
  },

  getRfqById: async (id: string): Promise<any> => {
    const res: any = await api.get(`rfq/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  updateRfq: async (id: string, data: any): Promise<any> => {
    const res: any = await api.put(`rfq/${id}`, data);
    return res?.data !== undefined ? res.data : res;
  },

  // ─── LINK / UNLINK PROJECT ───────────────────────────────────
  linkToProject: async (rfqId: string, projectId: string): Promise<any> => {
    const res: any = await api.post(`rfq/${rfqId}/link-project`, { projectId });
    return res?.data !== undefined ? res.data : res;
  },

  unlinkFromProject: async (rfqId: string): Promise<any> => {
    const res: any = await api.post(`rfq/${rfqId}/unlink-project`);
    return res?.data !== undefined ? res.data : res;
  },

  // ─── LINE ITEMS ──────────────────────────────────────────────
  upsertItems: async (rfqId: string, items: any[]): Promise<any> => {
    const res: any = await api.post(`rfq/${rfqId}/items`, items);
    return res?.data !== undefined ? res.data : res;
  },

  // ─── COST ESTIMATION ────────────────────────────────────────
  saveCostEstimates: async (rfqId: string, estimates: any[]): Promise<any> => {
    const res: any = await api.post(`rfq/${rfqId}/estimate`, estimates);
    return res?.data !== undefined ? res.data : res;
  },

  // ─── QUOTATION ──────────────────────────────────────────────
  generateQuotation: async (rfqId: string, data: any): Promise<any> => {
    const res: any = await api.post(`rfq/${rfqId}/quote`, data);
    return res?.data !== undefined ? res.data : res;
  },

  // ─── STATUS ─────────────────────────────────────────────────
  updateStatus: async (rfqId: string, data: { status: string; lostReason?: string }): Promise<any> => {
    const res: any = await api.put(`rfq/${rfqId}/status`, data);
    return res?.data !== undefined ? res.data : res;
  },

  // ─── CONVERT TO PROJECT ─────────────────────────────────────
  convertToProject: async (rfqId: string, plantId?: string): Promise<any> => {
    const res: any = await api.post(`rfq/${rfqId}/convert`, { plantId });
    return res?.data !== undefined ? res.data : res;
  },

  // ─── PIPELINE ───────────────────────────────────────────────
  getPipelineSummary: async (): Promise<any> => {
    const res: any = await api.get('rfq/pipeline');
    return res?.data !== undefined ? res.data : res;
  },

  // ─── QUOTATIONS ─────────────────────────────────────────────
  listQuotations: async (): Promise<any> => {
    const res: any = await api.get('rfq/quotations');
    return res?.data !== undefined ? res.data : res;
  },

  getQuotationById: async (id: string): Promise<any> => {
    const res: any = await api.get(`rfq/quotations/${id}`);
    return res?.data !== undefined ? res.data : res;
  },
};
