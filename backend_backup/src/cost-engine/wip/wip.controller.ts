import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { WipService } from './wip.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('api/v1/production/wip')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WipController {
  constructor(private readonly wipService: WipService) {}

  @Get('ledger')
  @Roles('ADMIN', 'PRODUCTION', 'FINANCE')
  async getWipLedger(@Query('projectId') projectId?: string) {
    // In a real app, this might be in the service, but since it's just a simple read query:
    const data = await this.wipService['prisma'].wipLedger.findMany({
      where: projectId ? { projectId, status: 'IN_PROCESS' } : { status: 'IN_PROCESS' },
      include: {
        project: { select: { projectNumber: true, partName: true } },
        material: { select: { materialCode: true, materialGrade: true } },
        routingOperation: { include: { operation: true } },
        machine: { select: { machineName: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return {
      status: 'success',
      data
    };
  }

  @Get('valuation')
  @Roles('ADMIN', 'FINANCE')
  async getWipValuation() {
    const data = await this.wipService['prisma'].wipValuationSnapshot.findMany({
      orderBy: { snapshotDate: 'desc' },
      take: 30 // Last 30 days
    });

    return {
      status: 'success',
      data
    };
  }
}
