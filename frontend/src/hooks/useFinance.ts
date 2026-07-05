import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinanceService } from '../services/finance.service';
import { useToast } from '../components/ui/Toast';
import { projectKeys } from './useProjects';

export const financeKeys = {
  all: ['finance'] as const,
  costEvents: (projectId: string) => [...financeKeys.all, 'cost-events', projectId] as const,
};

export function useCostEvents(projectId: string) {
  return useQuery({
    queryKey: financeKeys.costEvents(projectId),
    queryFn: () => FinanceService.getCostEvents(projectId),
    enabled: !!projectId,
  });
}

export function useCreateInvoice(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => FinanceService.createInvoice(projectId, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.costEvents(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      success('Invoice Generated', `Tax Invoice created successfully.`);
    },
    onError: (err: any) => {
      error('Invoice Failed', err.message || 'An error occurred');
    },
  });
}
