import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EngineeringService } from '../services/engineering.service';
import { useToast } from '../components/ui/Toast';

export const engineeringKeys = {
  all: ['engineering'] as const,
  global_bom: (projectId?: string) => [...engineeringKeys.all, 'global_bom', projectId] as const,
  global_routing: (projectId?: string) => [...engineeringKeys.all, 'global_routing', projectId] as const,
  bom: (projectId: string) => [...engineeringKeys.all, 'bom', projectId] as const,
  routing: (projectId: string) => [...engineeringKeys.all, 'routing', projectId] as const,
};

export function useGlobalBOMs(projectId?: string) {
  return useQuery({
    queryKey: engineeringKeys.global_bom(projectId),
    queryFn: () => EngineeringService.getGlobalBOMs(projectId),
  });
}

export function useGlobalRoutings(projectId?: string) {
  return useQuery({
    queryKey: engineeringKeys.global_routing(projectId),
    queryFn: () => EngineeringService.getGlobalRoutings(projectId),
  });
}

export function useProjectBOM(bomId: string) {
  return useQuery({
    queryKey: engineeringKeys.bom(bomId),
    queryFn: () => EngineeringService.getBOM(bomId),
    enabled: !!bomId,
  });
}

export function useProjectRouting(routingId: string) {
  return useQuery({
    queryKey: engineeringKeys.routing(routingId),
    queryFn: () => EngineeringService.getRouting(routingId),
    enabled: !!routingId,
  });
}

export function useUpdateBOM(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => EngineeringService.updateBOM(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engineeringKeys.bom(projectId) });
      success('BOM Updated', 'Bill of Materials saved successfully');
    },
    onError: (err: any) => {
      error('BOM Update Failed', err.message || 'An error occurred');
    },
  });
}

export function useDeleteBOM(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (bomId: string) => EngineeringService.deleteBOM(projectId, bomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engineeringKeys.all });
      success('BOM Deleted', 'Bill of Materials removed successfully');
    },
    onError: (err: any) => {
      error('Delete Failed', err.message || 'Cannot delete BOM');
    },
  });
}

export function useDuplicateBOM(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (bomId: string) => EngineeringService.duplicateBOM(projectId, bomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engineeringKeys.all });
      success('BOM Duplicated', 'New Bill of Materials revision created');
    },
    onError: (err: any) => {
      error('Duplicate Failed', err.message || 'Cannot duplicate BOM');
    },
  });
}

export function useUpdateRouting(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => EngineeringService.updateRouting(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engineeringKeys.routing(projectId) });
      success('Routing Updated', 'Manufacturing operations saved successfully');
    },
    onError: (err: any) => {
      error('Routing Update Failed', err.message || 'An error occurred');
    },
  });
}

export function useDeleteRouting(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (routingId: string) => EngineeringService.deleteRouting(projectId, routingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engineeringKeys.all });
      success('Routing Deleted', 'Manufacturing operations removed successfully');
    },
    onError: (err: any) => {
      error('Delete Failed', err.message || 'Cannot delete Routing');
    },
  });
}

export function useDuplicateRouting(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (routingId: string) => EngineeringService.duplicateRouting(projectId, routingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engineeringKeys.all });
      success('Routing Duplicated', 'New Routing revision created');
    },
    onError: (err: any) => {
      error('Duplicate Failed', err.message || 'Cannot duplicate Routing');
    },
  });
}

export function useApproveBOM(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (bomId: string) => EngineeringService.approveBOM(projectId, bomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engineeringKeys.bom(projectId) });
      success('BOM Approved', 'Bill of Materials has been locked.');
    },
    onError: (err: any) => {
      error('Failed to Approve BOM', err.message || 'An error occurred');
    },
  });
}

export function useApproveRouting(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (routingId: string) => EngineeringService.approveRouting(projectId, routingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: engineeringKeys.routing(projectId) });
      success('Routing Approved', 'Operations have been locked.');
    },
    onError: (err: any) => {
      error('Failed to Approve Routing', err.message || 'An error occurred');
    },
  });
}


