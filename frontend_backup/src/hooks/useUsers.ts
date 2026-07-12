import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersService } from '../services/users.service';
import { useToast } from '../components/ui/Toast';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
};

export function useUsers(params?: any) {
  return useQuery({
    queryKey: userKeys.list(JSON.stringify(params)),
    queryFn: () => UsersService.getUsers(params),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (data: any) => UsersService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      success('User Created', 'User has been invited successfully.');
    },
    onError: (err: any) => {
      error('Failed to create user', err.message);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => UsersService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      success('User Updated', 'User details have been saved.');
    },
    onError: (err: any) => {
      error('Failed to update user', err.message);
    },
  });
}
