import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DispatchService } from '../services/dispatch.service';
import { useToast } from '../components/ui/Toast';
import { projectKeys } from './useProjects';

export function useCreateDispatch(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => DispatchService.createDispatch(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      success('Dispatch Logged', 'Logistics dispatch has been successfully registered.');
    },
    onError: (err: any) => {
      error('Dispatch Failed', err.message || 'An error occurred');
    },
  });
}
