import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QualityService } from '../services/quality.service';
import { useToast } from '../components/ui/Toast';
import { projectKeys } from './useProjects';

export function useLogInspection(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => QualityService.logInspection(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      success('Success', 'Inspection logged successfully.');
    },
    onError: (err: any) => {
      error('Inspection Failed', err.message || 'An error occurred');
    },
  });
}
