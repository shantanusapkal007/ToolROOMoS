import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EngineeringService } from '../services/engineering.service';
import { useToast } from '../components/ui/Toast';

export const engineeringKeys = {
  all: ['engineering'] as const,
  bom: (projectId: string) => [...engineeringKeys.all, 'bom', projectId] as const,
  routing: (projectId: string) => [...engineeringKeys.all, 'routing', projectId] as const,
};

export function useProjectBOM(projectId: string) {
  return useQuery({
    queryKey: engineeringKeys.bom(projectId),
    queryFn: () => EngineeringService.getBOM(projectId),
    enabled: !!projectId,
  });
}

export function useProjectRouting(projectId: string) {
  return useQuery({
    queryKey: engineeringKeys.routing(projectId),
    queryFn: () => EngineeringService.getRouting(projectId),
    enabled: !!projectId,
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


