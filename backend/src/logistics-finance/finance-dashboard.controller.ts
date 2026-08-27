import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ModuleScope } from '../auth/decorators/module-scope.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { FinanceDashboardService } from './finance-dashboard.service';

@Controller('api/v1/finance')
@ModuleScope('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceDashboardController {
  constructor(private readonly financeDashboardService: FinanceDashboardService) {}

  @Public()
  @Get('currency-rates')
  async getCurrencyRates() {
    return this.financeDashboardService.getCurrencyRates();
  }

  @Get('dashboard')
  async getFinanceDashboard() {

    return this.financeDashboardService.getFinanceDashboard();
  }

  @Get('labour-analytics')
  async getLabourAnalytics(@Query('monthYear') monthYear?: string) {
    return this.financeDashboardService.getLabourCostAnalytics(monthYear);
  }

  @Get('project-profitability')
  async getProjectProfitability() {
    return this.financeDashboardService.getProjectProfitability();
  }

  @Get('payroll-vs-revenue')
  async getPayrollVsRevenue(@Query('months') months?: string) {
    const m = months ? parseInt(months, 10) : 6;
    return this.financeDashboardService.getPayrollVsRevenue(m);
  }

  @Get('cost-breakdown')
  async getCostBreakdown() {
    return this.financeDashboardService.getCostBreakdown();
  }
}
