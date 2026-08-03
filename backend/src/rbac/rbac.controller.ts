import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { SystemRole, RolePermission } from '@prisma/client';

@Controller('api/v1/rbac')
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('modules')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getModules() {
    return {
      status: 'success',
      data: this.rbacService.getModuleRegistry()
    };
  }

  @Get('roles-summary')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getRolesSummary() {
    const data = await this.rbacService.getRolesSummary();
    return {
      status: 'success',
      data
    };
  }

  @Get('permissions')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAllPermissions() {
    const data = await this.rbacService.getAllPermissions();
    return {
      status: 'success',
      data
    };
  }

  @Get('permissions/:role')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getPermissionsForRole(@Param('role') role: SystemRole) {
    const data = await this.rbacService.getPermissionsForRole(role);
    return {
      status: 'success',
      data
    };
  }

  @Put('permissions/:role')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updatePermissions(
    @Param('role') role: SystemRole,
    @Body('permissions') permissions: Array<Partial<RolePermission>>,
    @CurrentUser() user: CurrentUserPayload
  ) {
    const permissionsWithUser = permissions.map(p => ({
      ...p,
      updatedBy: user.userId
    }));

    const data = await this.rbacService.upsertPermissions(role, permissionsWithUser);
    return {
      status: 'success',
      message: `Permissions updated successfully for role ${role}`,
      data
    };
  }

  @Post('permissions/:role/apply-preset')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async applyPreset(
    @Param('role') role: SystemRole,
    @Body('preset') preset: 'FULL' | 'READ_ONLY' | 'SUPERVISOR' | 'CLEAR',
    @CurrentUser() user: CurrentUserPayload
  ) {
    const data = await this.rbacService.applyPreset(role, preset, user.userId);
    return {
      status: 'success',
      message: `Applied ${preset} preset permissions to role ${role}`,
      data
    };
  }

  @Get('my-permissions')
  async getMyPermissions(@CurrentUser() user: CurrentUserPayload) {
    const permissions = await this.rbacService.getPermissionsForRole(user.role as SystemRole);
    return {
      status: 'success',
      data: {
        role: user.role,
        permissions
      }
    };
  }
}

