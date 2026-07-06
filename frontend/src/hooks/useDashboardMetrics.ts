import { useQuery } from '@tanstack/react-query';

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3000/api/v1/projects/dashboard-metrics');
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
      const json = await res.json();
      return json.data;
    },
    staleTime: 60000,
  });
};
