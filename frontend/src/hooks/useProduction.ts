import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductionService } from '../services/production.service';
import { useToast } from '../components/ui/Toast';
import { projectKeys } from './useProjects';

export const productionKeys = {
  all: ['production'] as const,
  jobCards: (projectId: string) => [...productionKeys.all, 'job-cards', projectId] as const,
  msdrs: (projectId: string) => [...productionKeys.all, 'msdrs', projectId] as const,
  issues: (projectId: string) => [...productionKeys.all, 'issues', projectId] as const,
};

export function useJobCards(projectId: string) {
  return useQuery({
    queryKey: productionKeys.jobCards(projectId),
    queryFn: () => ProductionService.getJobCards(projectId),
    enabled: !!projectId,
  });
}

export function useMSDRs(projectId: string, section?: string) {
  return useQuery({
    queryKey: [...productionKeys.msdrs(projectId), section],
    queryFn: () => ProductionService.getMSDRs(projectId, section),
    enabled: !!projectId,
  });
}

export function useMaterialIssues(projectId: string) {
  return useQuery({
    queryKey: productionKeys.issues(projectId),
    queryFn: () => ProductionService.getIssues(projectId),
    enabled: !!projectId,
  });
}

export function useGenerateJobCards(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: () => ProductionService.generateJobCards(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.jobCards(projectId) });
      success('Success', 'Job cards generated from routing.');
    },
    onError: (err: any) => {
      error('Error', err.message || 'Failed to generate job cards');
    },
  });
}

export function useUpdateJobCardStatus(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ jobCardId, status, operatorId }: { jobCardId: string, status: string, operatorId?: string }) => 
      ProductionService.updateJobCardStatus(projectId, jobCardId, status, operatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.jobCards(projectId) });
      success('Job Started', 'Job card marked as in-progress.');
    },
    onError: (err: any) => {
      error('Failed', err.message || 'An error occurred');
    },
  });
}

export function useDeleteJobCard(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (jobCardId: string) => ProductionService.deleteJobCard(projectId, jobCardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.jobCards(projectId) });
      success('Job Card Deleted', 'Job card successfully removed.');
    },
    onError: (err: any) => {
      error('Failed', err.message || 'An error occurred');
    },
  });
}

export function useLogMSDR(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => ProductionService.logMSDR(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.msdrs(projectId) });
      queryClient.invalidateQueries({ queryKey: productionKeys.jobCards(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      success('Log Saved', 'Machine time logged and job card completed.');
    },
    onError: (err: any) => {
      error('Failed', err.message || 'An error occurred');
    },
  });
}

export function useIssueMaterial(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => ProductionService.issueMaterial(projectId, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: productionKeys.issues(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      success('Material Issued', `Issue slip generated.`);
    },
    onError: (err: any) => {
      error('Failed', err.message || 'An error occurred');
    },
  });
}

export function useReturnMaterial(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => ProductionService.returnMaterial(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.issues(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      // Invalidate inventory ledger if it's open
      queryClient.invalidateQueries({ queryKey: ['inventory', 'ledger'] });
      success('Material Returned', `Stock restored and cost credited.`);
    },
    onError: (err: any) => {
      error('Failed', err.message || 'An error occurred');
    },
  });
}
