import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModuleScope } from '../auth/decorators/module-scope.decorator';
import { FinanceDashboardService } from './finance-dashboard.service';

@Controller('api/v1/finance')
@ModuleScope('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceDashboardController {
  constructor(private readonly financeDashboardService: FinanceDashboardService) {}

  @Get('dashboard')
  async getFinanceDashboard() {
    const data = await this.financeDashboardService.getFinanceDashboard();
    return { data };
  }

  @Get('labour-analytics')
  async getLabourAnalytics(@Query('monthYear') monthYear?: string) {
    const data = await this.financeDashboardService.getLabourCostAnalytics(monthYear);
    return { data };
  }

  @Get('project-profitability')
  async getProjectProfitability() {
    const data = await this.financeDashboardService.getProjectProfitability();
    return { data };
  }

  @Get('payroll-vs-revenue')
  async getPayrollVsRevenue(@Query('months') months?: string) {
    const m = months ? parseInt(months, 10) : 6;
    const data = await this.financeDashboardService.getPayrollVsRevenue(m);
    return { data };
  }

  @Get('cost-breakdown')
  async getCostBreakdown() {
    const data = await this.financeDashboardService.getCostBreakdown();
    return { data };
  }
}
