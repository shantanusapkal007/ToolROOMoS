import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboardMetrics() {
    return this.reportsService.getDashboardMetrics();
  }

  @Get('on-time-delivery')
  async getOnTimeDeliveryKpi() {
    return this.reportsService.getOnTimeDeliveryKpi();
  }

  @Get('wip-aging')
  async getWipAgingAnalysis() {
    return this.reportsService.getWipAgingAnalysis();
  }

  @Get('receivables-aging')
  async getReceivablesAging() {
    return this.reportsService.getReceivablesAging();
  }
}
