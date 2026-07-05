import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProcurementService } from '../services/procurement.service';
import { useToast } from '../components/ui/Toast';

export const procurementKeys = {
  all: ['procurement'] as const,
  orders: (projectId: string) => [...procurementKeys.all, 'purchase-orders', projectId] as const,
};

export function usePurchaseOrders(projectId: string) {
  return useQuery({
    queryKey: procurementKeys.orders(projectId),
    queryFn: () => ProcurementService.getPurchaseOrders(projectId),
    enabled: !!projectId,
  });
}

export function useCreatePurchaseOrder(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => ProcurementService.createPurchaseOrder(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.orders(projectId) });
      success('PO Generated', 'Purchase Order draft created.');
    },
    onError: (err: any) => {
      error('Failed to create PO', err.message || 'An error occurred');
    },
  });
}

export function useProcessGRN(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => ProcurementService.processGRN(projectId, data),
    onSuccess: () => {
      // Invalidate project details to fetch updated inventory/PO status
      success('GRN Processed', 'Goods Receipt Note successfully processed. Inventory updated.');
    },
    onError: (err: any) => {
      error('Failed to Process GRN', err.message || 'An error occurred');
    },
  });
}
