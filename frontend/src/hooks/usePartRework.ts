import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PartReworkService, PartReworkOrder } from '../services/part-rework.service';
import { useToast } from '../components/ui/Toast';

export const partReworkKeys = {
  all: (projectId: string) => ['partReworkOrders', projectId] as const,
  detail: (projectId: string, id: string) => ['partReworkOrder', projectId, id] as const,
};

export const useProjectReworkOrders = (projectId: string) => {
  return useQuery({
    queryKey: partReworkKeys.all(projectId),
    queryFn: () => PartReworkService.getReworkOrders(projectId),
    enabled: !!projectId,
  });
};

export const useCreatePartReworkOrder = (projectId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: Partial<PartReworkOrder>) =>
      PartReworkService.createReworkOrder(projectId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: partReworkKeys.all(projectId) });
      queryClient.invalidateQueries({ queryKey: ['projectTrials', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      success(
        'Rework Order Created',
        `Part rework order ${data.reworkNumber || ''} created for "${data.partName}".`
      );
    },
    onError: (err: any) => {
      error('Rework Creation Failed', err?.response?.data?.message || err?.message || 'Could not initiate part rework');
    },
  });
};

export const useUpdatePartReworkStatus = (projectId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      PartReworkService.updateReworkStatus(projectId, id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: partReworkKeys.all(projectId) });
      queryClient.invalidateQueries({ queryKey: ['projectTrials', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      success(
        'Rework Status Updated',
        `Part rework order ${data.reworkNumber} is now ${data.status.replace(/_/g, ' ')}.`
      );
    },
    onError: (err: any) => {
      error('Status Update Failed', err?.response?.data?.message || err?.message || 'Failed to update rework status');
    },
  });
};

export const useDeletePartReworkOrder = (projectId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => PartReworkService.deleteReworkOrder(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partReworkKeys.all(projectId) });
      success('Rework Order Removed', 'Part rework order has been cancelled.');
    },
    onError: (err: any) => {
      error('Delete Failed', err?.response?.data?.message || err?.message || 'Could not delete rework order');
    },
  });
};
