import { api } from '../lib/api';

export interface PrnItem {
  id?: string;
  materialId?: string;
  itemCode?: string;
  itemName?: string;
  materialGrade?: string;
  dimensions?: string;
  rawSize?: string;
  requiredQuantity: number;
  orderedQty?: number;
  uom?: string;
  estimatedRate?: number;
  estimatedTotal?: number;
  detNo?: string;
  suggestedVendor?: string;
  status?: string;
  remarks?: string;
  material?: any;
  customFields?: Record<string, any>;
}

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  projectId?: string;
  department?: string;
  requestedBy?: string;
  requiredDate?: string;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  category: 'RAW_MATERIAL' | 'STANDARD_PARTS' | 'CONSUMABLES' | 'TOOLING' | 'SERVICE' | 'MAINTENANCE';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PO_CREATED' | 'PARTIALLY_CONVERTED' | 'CLOSED' | 'CANCELLED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  purpose?: string;
  remarks?: string;
  estimatedTotalAmount: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    projectNumber: string;
    partName: string;
    toolType?: string;
    customer?: {
      companyName: string;
    };
  };
  items: PrnItem[];
  purchaseOrders?: any[];
  customFields?: Record<string, any>;
}

export interface PrnSummary {
  totalCount: number;
  draftCount: number;
  pendingApproval: number;
  approved: number;
  convertedToPo: number;
  urgentCount: number;
  totalEstimatedValue: number;
}

export const PurchaseRequisitionsService = {
  listPrns: async (params?: {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    projectId?: string;
    department?: string;
  }): Promise<PurchaseRequisition[]> => {
    const res: any = await api.get('purchase-requisitions', { params });
    return res?.data !== undefined ? res.data : res;
  },

  getSummary: async (projectId?: string): Promise<PrnSummary> => {
    const res: any = await api.get('purchase-requisitions/summary', {
      params: projectId ? { projectId } : undefined,
    });
    return res?.data !== undefined ? res.data : res;
  },

  getPrnById: async (id: string): Promise<PurchaseRequisition> => {
    const res: any = await api.get(`purchase-requisitions/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  createPrn: async (data: any): Promise<PurchaseRequisition> => {
    const res: any = await api.post('purchase-requisitions', data);
    return res?.data !== undefined ? res.data : res;
  },

  createFromBom: async (data: {
    projectId: string;
    bomItemIds?: string[];
    department?: string;
    requestedBy?: string;
  }): Promise<PurchaseRequisition> => {
    const res: any = await api.post('purchase-requisitions/from-bom', data);
    return res?.data !== undefined ? res.data : res;
  },

  updatePrn: async (id: string, data: any): Promise<PurchaseRequisition> => {
    const res: any = await api.put(`purchase-requisitions/${id}`, data);
    return res?.data !== undefined ? res.data : res;
  },

  submitPrn: async (id: string): Promise<any> => {
    const res: any = await api.post(`purchase-requisitions/${id}/submit`);
    return res?.data !== undefined ? res.data : res;
  },

  approvePrn: async (id: string, remarks?: string): Promise<any> => {
    const res: any = await api.post(`purchase-requisitions/${id}/approve`, { remarks });
    return res?.data !== undefined ? res.data : res;
  },

  rejectPrn: async (id: string, rejectionReason: string): Promise<any> => {
    const res: any = await api.post(`purchase-requisitions/${id}/reject`, { rejectionReason });
    return res?.data !== undefined ? res.data : res;
  },

  convertToPo: async (id: string, data: {
    vendorId: string;
    expectedDeliveryDate?: string;
    deliveryTerms?: string;
    remarks?: string;
    items?: any[];
  }): Promise<any> => {
    const res: any = await api.post(`purchase-requisitions/${id}/convert-to-po`, data);
    return res?.data !== undefined ? res.data : res;
  },

  deletePrn: async (id: string): Promise<any> => {
    const res: any = await api.delete(`purchase-requisitions/${id}`);
    return res?.data !== undefined ? res.data : res;
  },
};
