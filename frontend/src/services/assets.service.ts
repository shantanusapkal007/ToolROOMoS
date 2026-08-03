import { api } from '../lib/api';

export interface GlobalAsset {
  id: string;
  assetId: string;
  assetCode: string;
  name: string;
  categoryId: string;
  subCategory?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  partNumber?: string;
  description?: string;
  quantity: number;
  availableQty: number;
  issuedQty: number;
  unit: string;
  purchaseDate?: string;
  purchaseCost?: number;
  supplier?: string;
  locationId?: string;
  storageRack?: string;
  condition: string;
  warrantyExpiry?: string;
  status: 'AVAILABLE' | 'ISSUED' | 'MAINTENANCE' | 'RESERVED' | 'LOST' | 'SCRAPPED';
  qrCode?: string;
  barcode?: string;
  imageUrl?: string;
  documentUrls?: any;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; categoryCode: string };
  location?: { id: string; locationName: string; building?: string; room?: string; rackBin?: string };
  issueTransactions?: any[];
  returnTransactions?: any[];
  maintenanceRequests?: any[];
  auditLogs?: any[];
}

export const AssetsService = {
  getDashboardStats: async (): Promise<any> => {
    const res = await api.get('assets/dashboard/stats');
    return res as unknown as any;
  },

  getAssets: async (params?: { search?: string; categoryId?: string; status?: string; locationId?: string }): Promise<GlobalAsset[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.status) query.append('status', params.status);
    if (params?.locationId) query.append('locationId', params.locationId);

    const res = await api.get(`assets?${query.toString()}`);
    return res as unknown as GlobalAsset[];
  },

  getAssetById: async (id: string): Promise<GlobalAsset> => {
    const res = await api.get(`assets/${id}`);
    return res as unknown as GlobalAsset;
  },

  createAsset: async (data: any): Promise<GlobalAsset> => {
    const res = await api.post('assets', data);
    return res as unknown as GlobalAsset;
  },

  updateAsset: async (id: string, data: any): Promise<GlobalAsset> => {
    const res = await api.put(`assets/${id}`, data);
    return res as unknown as GlobalAsset;
  },

  issueAsset: async (data: { assetId: string; employeeId: string; quantity: number; expectedReturnDate?: string; conditionBeforeIssue?: string; remarks?: string }): Promise<any> => {
    const res = await api.post('assets/issues', data);
    return res as unknown as any;
  },

  returnAsset: async (data: { issueTransactionId: string; returnedQty: number; returnDate?: string; conditionAfterReturn?: string; damageDetails?: string; remarks?: string }): Promise<any> => {
    const res = await api.post('assets/returns', data);
    return res as unknown as any;
  },

  createMaintenance: async (data: { assetId: string; issueReported: string; assignedTechnician?: string; maintenanceStart?: string; cost?: number; remarks?: string }): Promise<any> => {
    const res = await api.post('assets/maintenance', data);
    return res as unknown as any;
  },

  completeMaintenance: async (id: string, data: { maintenanceEnd?: string; cost?: number; remarks?: string; conditionAfterMaintenance?: string }): Promise<any> => {
    const res = await api.put(`assets/maintenance/${id}/complete`, data);
    return res as unknown as any;
  },

  getCategories: async (): Promise<any[]> => {
    const res = await api.get('assets/categories');
    return res as unknown as any[];
  },

  createCategory: async (data: { categoryCode: string; name: string; description?: string }): Promise<any> => {
    const res = await api.post('assets/categories', data);
    return res as unknown as any;
  },

  getLocations: async (): Promise<any[]> => {
    const res = await api.get('assets/locations');
    return res as unknown as any[];
  },

  createLocation: async (data: { locationCode: string; locationName: string; building?: string; room?: string; rackBin?: string; remarks?: string }): Promise<any> => {
    const res = await api.post('assets/locations', data);
    return res as unknown as any;
  },

  getIssues: async (): Promise<any[]> => {
    const res = await api.get('assets/issues');
    return res as unknown as any[];
  },

  getReturns: async (): Promise<any[]> => {
    const res = await api.get('assets/returns');
    return res as unknown as any[];
  },

  getMaintenance: async (): Promise<any[]> => {
    const res = await api.get('assets/maintenance');
    return res as unknown as any[];
  }
};
