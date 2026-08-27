import { api } from '../lib/api';

export const ReportsService = {
  getDashboardMetrics: async (): Promise<any> => {
    const res = await api.get('reports/dashboard');
    // Axios interceptor strips the outer response.data, leaving the API envelope.
    // The envelope is: { success, data: <metrics>, message }.
    // res.data gives us the metrics object directly.
    const payload = res.data ?? res;
    // Guard against legacy double-wrap: if payload itself has a nested `data` with metrics keys, unwrap it
    if (payload && typeof payload === 'object' && 'totalRevenue' in payload) {
      return payload;
    }
    if (payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object' && 'totalRevenue' in payload.data) {
      return payload.data;
    }
    return payload || {};
  },
};
