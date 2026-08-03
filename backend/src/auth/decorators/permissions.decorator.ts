import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'require_permission';

export interface PermissionRequirement {
  module: string;
  action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canApprove' | 'canExport';
}

export const RequirePermission = (module: string, action: PermissionRequirement['action'] = 'canView') => 
  SetMetadata(PERMISSIONS_KEY, { module, action });
