import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MaintenanceService } from './maintenance.service';

@Controller('api/v1/maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  async createRecord(@Body() dto: any, @CurrentUser() user: any) {
    const data = await this.maintenanceService.createRecord(dto, user?.userId);
    return { status: 'success', message: 'Maintenance record created.', data };
  }

  @Get()
  async getRecords(@Query('machineId') machineId?: string) {
    const data = await this.maintenanceService.getRecords(machineId);
    return { status: 'success', message: 'Maintenance records retrieved.', data };
  }
}
