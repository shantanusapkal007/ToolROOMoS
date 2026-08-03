import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboardMetrics() {
    const data = await this.reportsService.getDashboardMetrics();
    return { data };
  }

  @Get('active-running-projects')
  async getActiveRunningProjects() {
    const data = await this.reportsService.getActiveRunningProjects();
    return { data };
  }

  @Get('employee-daily-reports')
  async getEmployeeDailyReports(
    @Query('date') date?: string,
    @Query('projectId') projectId?: string,
    @Query('section') section?: string,
    @Query('employeeId') employeeId?: string,
    @Query('machineId') machineId?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    const data = await this.reportsService.getGlobalEmployeeDailyReports({
      date,
      projectId,
      section,
      employeeId,
      machineId,
      search,
      type,
    });
    return { data };
  }

  @Get('employee-daily-reports/stats')
  async getEmployeeDailyReportStats(
    @Query('date') date?: string,
  ) {
    const data = await this.reportsService.getEmployeeDailyReportStats({ date });
    return { data };
  }

  @Post('designer-log')
  async createGlobalDesignerLog(
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    const data = await this.reportsService.createGlobalDesignerLog(dto, user.userId);
    return { data, message: 'Designer log created successfully' };
  }

  @Post('msdr-log')
  async createGlobalMsdrLog(
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    const data = await this.reportsService.createGlobalMsdrLog(dto, user.userId);
    return { data, message: 'MSDR log created successfully' };
  }
}
