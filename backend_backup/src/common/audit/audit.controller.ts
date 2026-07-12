import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';

@Controller('api/v1/audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':entityType/:entityId')
  async getHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const data = await this.auditService.getHistory(entityType, entityId);
    return { status: 'success', message: 'Audit history retrieved.', data };
  }

  @Get(':entityType/:entityId/version/:version')
  async getVersion(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Param('version') version: string,
  ) {
    const data = await this.auditService.getVersion(entityType, entityId, parseInt(version));
    return { status: 'success', message: 'Version snapshot retrieved.', data };
  }
}
