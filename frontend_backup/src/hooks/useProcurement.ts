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

export function useUpdatePurchaseOrder(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ poId, data }: { poId: string; data: any }) => ProcurementService.updatePurchaseOrder(projectId, poId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.orders(projectId) });
      success('PO Updated', 'Purchase Order successfully updated.');
    },
    onError: (err: any) => {
      error('Failed to update PO', err.message || 'An error occurred');
    },
  });
}

export function useDeletePurchaseOrder(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (poId: string) => ProcurementService.deletePurchaseOrder(projectId, poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.orders(projectId) });
      success('PO Deleted', 'Purchase Order successfully deleted.');
    },
    onError: (err: any) => {
      error('Failed to delete PO', err.message || 'An error occurred');
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

export function useGeneratePoFromShortage(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: () => ProcurementService.generatePoFromShortage(projectId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.orders(projectId) });
      success('Draft PO Generated', `Generated PO: ${data.data?.poNumber}`);
    },
    onError: (err: any) => {
      error('Generation Failed', err.response?.data?.message || err.message || 'An error occurred');
    },
  });
}

export function useApprovePurchaseOrder(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (poId: string) => ProcurementService.approvePo(projectId, poId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: procurementKeys.orders(projectId) });
      success('PO Approved', 'Purchase Order approved successfully.');
    },
    onError: (err: any) => {
      error('Approval Failed', err.response?.data?.message || err.message || 'An error occurred');
    },
  });
}
