import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TasksService } from '../services/tasks.service';
import { useToast } from '../components/ui/Toast';

export const taskKeys = {
  all: ['tasks'] as const,
  project: (projectId: string) => [...taskKeys.all, projectId] as const,
};

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: taskKeys.project(projectId),
    queryFn: () => TasksService.getTasks(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => TasksService.createTask(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) });
      success('Task Created', 'Successfully added project task.');
    },
    onError: (err: any) => {
      error('Failed to create task', err.message || 'An error occurred');
    },
  });
}

export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string, status: string }) => 
      TasksService.updateTaskStatus(projectId, taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) });
      success('Status Updated', 'Task status updated.');
    },
    onError: (err: any) => {
      error('Failed to update status', err.message || 'An error occurred');
    },
  });
}
