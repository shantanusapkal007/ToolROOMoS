import { api } from '../lib/api';

export interface RolePermission {
  id: string;
  role: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
}

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
}

export interface RoleSummary {
  role: string;
  name: string;
  description: string;
  userCount: number;
  activeModulesCount: number;
  totalModules: number;
  isSystemAdmin: boolean;
}

export const RbacService = {
  getModules: async (): Promise<ModuleInfo[]> => {
    const res = await api.get('rbac/modules');
    return res.data;
  },

  getRolesSummary: async (): Promise<RoleSummary[]> => {
    const res = await api.get('rbac/roles-summary');
    return res.data;
  },

  getAllPermissions: async (): Promise<{ roles: string[], modules: ModuleInfo[], permissions: RolePermission[] }> => {
    const res = await api.get('rbac/permissions');
    return res.data;
  },

  getPermissionsForRole: async (role: string): Promise<RolePermission[]> => {
    const res = await api.get(`rbac/permissions/${role}`);
    return res.data;
  },

  updatePermissions: async (role: string, permissions: Partial<RolePermission>[]): Promise<any> => {
    const res = await api.put(`rbac/permissions/${role}`, { permissions });
    return res.data;
  },

  applyPreset: async (role: string, preset: 'FULL' | 'READ_ONLY' | 'SUPERVISOR' | 'CLEAR'): Promise<any> => {
    const res = await api.post(`rbac/permissions/${role}/apply-preset`, { preset });
    return res.data;
  },

  getMyPermissions: async (): Promise<{ role: string, permissions: RolePermission[] }> => {
    const res = await api.get('rbac/my-permissions');
    return res.data;
  }
};

