import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectsService, Project } from '../services/projects.service';
import { useToast } from '../components/ui/Toast';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: ProjectsService.getAllProjects,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => ProjectsService.getProjectById(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: Partial<Project>) => ProjectsService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      success('Success', 'Project created successfully');
    },
    onError: (err: any) => {
      error('Error', err.message || 'Failed to create project');
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: Partial<Project>) => 
      api.put<Project>(`projects/${id}`, data).then(res => res.data as unknown as Project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      success('Success', 'Project updated successfully');
    },
    onError: (err: any) => {
      error('Error', err.message || 'Failed to update project');
    },
  });
}

export function useAdvanceProjectStage(id: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: () => 
      api.post(`projects/${id}/advance-stage`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      success('Stage Evaluated', 'Workflow rules processed for project.');
    },
    onError: (err: any) => {
      error('Stage Advance Blocked', err.message || 'Failed to advance stage');
    },
  });
}

export function useCloseProject(id: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: () => 
      api.post(`projects/${id}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      success('Project Closed', 'Project is now closed and locked.');
    },
    onError: (err: any) => {
      error('Close Failed', err.message || 'Failed to close project');
    },
  });
}
