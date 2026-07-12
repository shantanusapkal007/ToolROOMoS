import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      const res = await api.get<any>('/projects/dashboard-metrics');
      return res?.data?.data || res?.data || res;
    },
    staleTime: 60000,
  });
};
