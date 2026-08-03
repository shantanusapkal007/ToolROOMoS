import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DesignLogsService, DesignWorkLog } from '../services/design-logs.service';
import { useToast } from '../components/ui/Toast';

export const designLogKeys = {
  all: ['design-logs'] as const,
  lists: (projectId: string, filters?: any) => [...designLogKeys.all, 'list', projectId, filters] as const,
  summary: (projectId: string) => [...designLogKeys.all, 'summary', projectId] as const,
};

export function useDesignLogs(
  projectId: string,
  filters?: { search?: string; designer?: string; workStage?: string; status?: string }
) {
  return useQuery({
    queryKey: designLogKeys.lists(projectId, filters),
    queryFn: () => DesignLogsService.getDesignLogs(projectId, filters),
    enabled: !!projectId,
  });
}

export function useDesignSummary(projectId: string) {
  return useQuery({
    queryKey: designLogKeys.summary(projectId),
    queryFn: () => DesignLogsService.getDesignSummary(projectId),
    enabled: !!projectId,
  });
}

export function useCreateDesignLog(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: Partial<DesignWorkLog>) => DesignLogsService.createDesignLog(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designLogKeys.all });
      success('Work Log Saved', 'Designer work activity logged successfully.');
    },
    onError: (err: any) => {
      error('Error', err.message || 'Failed to log designer activity.');
    },
  });
}

export function useUpdateDesignLog(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ logId, data }: { logId: string; data: Partial<DesignWorkLog> }) =>
      DesignLogsService.updateDesignLog(projectId, logId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designLogKeys.all });
      success('Work Log Updated', 'Designer work activity updated successfully.');
    },
    onError: (err: any) => {
      error('Error', err.message || 'Failed to update designer activity.');
    },
  });
}

export function useDeleteDesignLog(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (logId: string) => DesignLogsService.deleteDesignLog(projectId, logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designLogKeys.all });
      success('Log Deleted', 'Designer work log entry deleted.');
    },
    onError: (err: any) => {
      error('Error', err.message || 'Failed to delete work log.');
    },
  });
}
