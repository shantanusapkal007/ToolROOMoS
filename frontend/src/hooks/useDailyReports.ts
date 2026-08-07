import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DailyReportsService,
  GlobalDailyReportItem,
  EmployeeDailyReportStats,
  ActiveRunningProject,
  GlobalDesignerLogPayload,
  GlobalMsdrLogPayload,
} from '../services/daily-reports.service';
import { useToast } from '../components/ui/Toast';

export const dailyReportKeys = {
  all: ['employee-daily-reports'] as const,
  list: (filters?: any) => [...dailyReportKeys.all, 'list', filters] as const,
  stats: (date?: string) => [...dailyReportKeys.all, 'stats', date] as const,
  runningProjects: () => [...dailyReportKeys.all, 'running-projects'] as const,
};

export function useGlobalDailyReports(filters?: {
  date?: string;
  projectId?: string;
  section?: string;
  employeeId?: string;
  machineId?: string;
  search?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: dailyReportKeys.list(filters),
    queryFn: () => DailyReportsService.getGlobalEmployeeDailyReports(filters),
    staleTime: 60000,
  });
}

export function useDailyReportStats(date?: string) {
  return useQuery({
    queryKey: dailyReportKeys.stats(date),
    queryFn: () => DailyReportsService.getEmployeeDailyReportStats({ date }),
    staleTime: 60000,
  });
}

export function useActiveRunningProjects() {
  return useQuery({
    queryKey: dailyReportKeys.runningProjects(),
    queryFn: () => DailyReportsService.getActiveRunningProjects(),
    staleTime: 60000,
  });
}

export function useCreateGlobalDesignerLog() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: GlobalDesignerLogPayload) => DailyReportsService.createGlobalDesignerLog(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      success('Designer Log Created', 'Designer daily work log saved successfully across projects.');
    },
    onError: (err: any) => {
      error('Failed to log activity', err.message || 'Error submitting designer log.');
    },
  });
}

export function useCreateGlobalMsdrLog() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: GlobalMsdrLogPayload) => DailyReportsService.createGlobalMsdrLog(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyReportKeys.all });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      success('MSDR Log Recorded', 'Shopfloor daily machining/fitting log recorded successfully.');
    },
    onError: (err: any) => {
      error('Failed to log MSDR', err.message || 'Error submitting shopfloor MSDR log.');
    },
  });
}
