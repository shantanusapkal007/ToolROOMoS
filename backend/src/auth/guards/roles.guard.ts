import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // No roles restricted
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false; // Not authenticated
    }

    // Admin can do anything
    if (user.role === 'ADMIN') {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
