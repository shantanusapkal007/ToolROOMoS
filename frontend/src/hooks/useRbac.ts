import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RbacService, RolePermission } from '../services/rbac.service';
import { useToast } from '../components/ui/Toast';

export const rbacKeys = {
  all: ['rbac'] as const,
  modules: () => [...rbacKeys.all, 'modules'] as const,
  rolesSummary: () => [...rbacKeys.all, 'roles-summary'] as const,
  permissions: () => [...rbacKeys.all, 'permissions'] as const,
  rolePermissions: (role: string) => [...rbacKeys.permissions(), role] as const,
  myPermissions: () => [...rbacKeys.all, 'my-permissions'] as const,
};

export function useModules() {
  return useQuery({
    queryKey: rbacKeys.modules(),
    queryFn: RbacService.getModules,
  });
}

export function useRolesSummary() {
  return useQuery({
    queryKey: rbacKeys.rolesSummary(),
    queryFn: RbacService.getRolesSummary,
  });
}

export function useAllPermissions() {
  return useQuery({
    queryKey: rbacKeys.permissions(),
    queryFn: RbacService.getAllPermissions,
  });
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ role, permissions }: { role: string, permissions: Partial<RolePermission>[] }) => 
      RbacService.updatePermissions(role, permissions),
    onSuccess: (_, { role }) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
      queryClient.invalidateQueries({ queryKey: rbacKeys.rolesSummary() });
      queryClient.invalidateQueries({ queryKey: rbacKeys.rolePermissions(role) });
      success('Permissions Updated', `Access controls for ${role} have been saved.`);
    },
    onError: (err: any) => {
      error('Failed to update permissions', err.message);
    },
  });
}

export function useApplyPreset() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ role, preset }: { role: string, preset: 'FULL' | 'READ_ONLY' | 'SUPERVISOR' | 'CLEAR' }) => 
      RbacService.applyPreset(role, preset),
    onSuccess: (_, { role, preset }) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions() });
      queryClient.invalidateQueries({ queryKey: rbacKeys.rolesSummary() });
      queryClient.invalidateQueries({ queryKey: rbacKeys.rolePermissions(role) });
      success('Preset Applied', `Applied ${preset} preset to ${role}.`);
    },
    onError: (err: any) => {
      error('Failed to apply preset', err.message);
    },
  });
}

export function useMyPermissions() {
  return useQuery({
    queryKey: rbacKeys.myPermissions(),
    queryFn: RbacService.getMyPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

