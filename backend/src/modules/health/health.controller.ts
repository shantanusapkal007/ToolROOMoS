import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../auth/decorators/public.decorator';

@Public()
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(['health', 'api/v1/health'])
  checkHealth() {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'ToolRoomOS Backend' };
  }

  @Get(['live', 'api/v1/live'])
  checkLiveness() {
    return { status: 'alive' };
  }

  @Get(['ready', 'api/v1/ready'])
  async checkReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'connected' };
    } catch (error) {
      return { status: 'not_ready', database: 'disconnected' };
    }
  }
}

