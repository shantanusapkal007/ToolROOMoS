import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { MODULE_SCOPE_KEY } from '../decorators/module-scope.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const moduleScope = this.reflector.getAllAndOverride<string>(MODULE_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp ? context.switchToHttp().getRequest() : null;
    const path = request?.route?.path || request?.url || '';

    // Deduce module: prefer explicit @ModuleScope, fallback to URL path inspection
    let module = moduleScope || '';
    if (!module && path) {
      if (path.includes('/projects')) module = 'projects';
      else if (path.includes('/master-data')) module = 'master_data';
      else if (path.includes('/procurement')) module = 'procurement';
      else if (path.includes('/production')) module = 'production';
      else if (path.includes('/quality')) module = 'quality';
      else if (path.includes('/inventory')) module = 'inventory';
      else if (path.includes('/engineering')) module = 'engineering';
      else if (path.includes('/finance') || path.includes('/logistics-finance')) module = 'finance';
      else if (path.includes('/reports')) module = 'reports';
      else if (path.includes('/maintenance')) module = 'maintenance';
      else if (path.includes('/assets')) module = 'assets';
      else if (path.includes('/subcontracting')) module = 'production';
      else if (path.includes('/users') || path.includes('/settings')) module = 'settings';
      else if (path.includes('/hr')) module = 'hr';
      else if (path.includes('/audit-logs')) module = 'activity_log';
    }

    if (!requiredRoles && !module) {
      return true; // No roles or module restricted
    }
    
    const user = request?.user;
    
    if (!user) {
      return false; // Not authenticated
    }

    // Deduce assigned roles (support single or multiple comma-separated roles e.g. "PRODUCTION, STORES")
    const userRoles = (user.role || '').split(',').map((r: string) => r.trim());

    // Admin can do anything
    if (userRoles.includes('ADMIN')) {
      return true;
    }

    if (module) {
      const permissions = await this.prisma.rolePermission.findMany({
        where: {
          role: { in: userRoles as SystemRole[] },
          module,
        },
      });

      if (permissions.length > 0) {
        // Determine action based on HTTP method
        const hasAccess = permissions.some((permission) => {
          switch (request.method) {
            case 'GET':
              return permission.canView;
            case 'POST':
              return permission.canCreate;
            case 'PUT':
            case 'PATCH':
              return permission.canEdit;
            case 'DELETE':
              return permission.canDelete;
            default:
              return permission.canView;
          }
        });

        if (hasAccess) return true;
        return false;
      }

      // If module is restricted but no specific rolePermission record exists,
      // fallback to requiredRoles check if present, otherwise deny access (Fail-Closed).
      if (requiredRoles && requiredRoles.length > 0) {
        return requiredRoles.some((r) => userRoles.includes(r));
      }
      return false;
    }

    // Fallback to hardcoded roles check if present
    if (requiredRoles && requiredRoles.length > 0) {
      return requiredRoles.some((r) => userRoles.includes(r));
    }

    return true;
  }
}
