import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      const res: any = await api.get('/projects/dashboard-metrics');
      return res?.data !== undefined ? res.data : res;
    },
    staleTime: 60000,
  });
};
