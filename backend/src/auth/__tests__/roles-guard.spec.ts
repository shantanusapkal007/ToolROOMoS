import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let prisma: PrismaService;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      rolePermission: {
        findMany: jest.fn(),
      },
    } as unknown as PrismaService;
    guard = new RolesGuard(reflector, prisma);
  });

  it('should allow access if no roles and no module scope are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should deny access if user is not authenticated', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'roles') return ['ADMIN'];
      return null;
    });

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: null }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(false);
  });

  it('should allow access unconditionally for ADMIN role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'roles') return ['STORES'];
      return 'inventory';
    });

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: 'ADMIN' },
          route: { path: '/api/v1/inventory' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should deny access (Fail-Closed) if non-admin user has no permissions in requested module (BUG-004 Regression)', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'module_scope') return 'finance';
      return null;
    });

    (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([]); // No permissions configured

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          user: { role: 'PRODUCTION' },
          route: { path: '/api/v1/finance/dashboard' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(false);
  });

  it('should allow access if role has canView permission on GET request for module', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'module_scope') return 'finance';
      return null;
    });

    (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([
      { role: 'FINANCE', module: 'finance', canView: true, canCreate: true },
    ]);

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          user: { role: 'FINANCE' },
          route: { path: '/api/v1/finance/dashboard' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(true);
  });

  it('should deduce finance module from URL path /api/v1/finance and enforce fail-closed check', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null); // No explicit @ModuleScope

    (prisma.rolePermission.findMany as jest.Mock).mockResolvedValue([]); // No permissions

    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          user: { role: 'MAINTENANCE' },
          route: { path: '/api/v1/finance/dashboard' },
        }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockContext);
    expect(result).toBe(false);
  });
});
