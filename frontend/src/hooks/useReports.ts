import { useQuery } from '@tanstack/react-query';
import { ReportsService } from '../services/reports.service';

export const reportsKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportsKeys.all, 'dashboard'] as const,
};

export function useReportsDashboard() {
  return useQuery({
    queryKey: reportsKeys.dashboard(),
    queryFn: () => ReportsService.getDashboardMetrics(),
  });
}
