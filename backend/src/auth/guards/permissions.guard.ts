import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionRequirement } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole } from '@prisma/client';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requirement) {
      return true; // No permission required
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      return false; // Not authenticated (should be caught by JwtAuthGuard anyway)
    }

    // Admin has all permissions implicitly
    if (user.role === 'ADMIN') {
      return true;
    }

    const permission = await this.prisma.rolePermission.findUnique({
      where: {
        role_module: {
          role: user.role as SystemRole,
          module: requirement.module,
        }
      }
    });

    if (!permission) {
      return false;
    }

    return permission[requirement.action] === true;
  }
}
