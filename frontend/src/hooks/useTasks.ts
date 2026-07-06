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

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string, data: any }) => 
      TasksService.updateTask(projectId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) });
      success('Task Updated', 'Task updated successfully.');
    },
    onError: (err: any) => {
      error('Failed to update task', err.message || 'An error occurred');
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (taskId: string) => TasksService.deleteTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.project(projectId) });
      success('Task Deleted', 'Task removed successfully.');
    },
    onError: (err: any) => {
      error('Failed to delete task', err.message || 'An error occurred');
    },
  });
}
