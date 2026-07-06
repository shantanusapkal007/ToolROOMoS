import { api } from '../lib/api';

export const ReportsService = {
  getDashboardMetrics: async (): Promise<any> => {
    const res = await api.get('reports/dashboard');
    return res.data;
  },
};
