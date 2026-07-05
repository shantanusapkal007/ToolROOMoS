import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  checkHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('live')
  checkLiveness() {
    return { status: 'alive' };
  }

  @Get('ready')
  async checkReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'connected' };
    } catch (error) {
      return { status: 'not_ready', database: 'disconnected' };
    }
  }
}
