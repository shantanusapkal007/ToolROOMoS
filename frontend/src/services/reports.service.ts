import { api } from '../lib/api';

export const ReportsService = {
  getDashboardMetrics: async (): Promise<any> => {
    const res = await api.get('reports/dashboard');
    // Depending on backend interceptors, the payload might be inside `res.data` or directly `res`
    const data = res.data ?? res;
    return data || {}; // Guarantee we never return undefined
  },
};
