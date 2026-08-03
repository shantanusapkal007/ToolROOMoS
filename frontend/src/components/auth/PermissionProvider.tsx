"use client";
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthProvider';
import { RolePermission, RbacService } from '../../services/rbac.service';

interface PermissionContextType {
  permissions: RolePermission[];
  hasPermission: (module: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canApprove' | 'canExport') => boolean;
  canViewModule: (module: string) => boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    let mounted = true;

    async function fetchPermissions() {
      if (!isAuthenticated || !user) {
        if (mounted) {
          setPermissions([]);
          setIsLoading(false);
        }
        return;
      }

      if (isAdmin) {
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await RbacService.getMyPermissions();
        if (mounted && data.permissions) {
          setPermissions(data.permissions);
        }
      } catch (err) {
        console.error('Failed to fetch permissions', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPermissions();

    return () => {
      mounted = false;
    };
  }, [user?.role, isAuthenticated, isAdmin]);

  const hasPermission = (module: string, action: keyof RolePermission) => {
    if (isAdmin) return true;
    const perm = permissions.find(p => p.module === module);
    if (!perm) return false;
    return !!perm[action];
  };

  const canViewModule = (module: string) => hasPermission(module, 'canView');

  const value = useMemo(() => ({
    permissions,
    hasPermission,
    canViewModule,
    isAdmin,
    isLoading
  }), [permissions, isAdmin, isLoading]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};
