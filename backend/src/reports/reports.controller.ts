import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboardMetrics() {
    return this.reportsService.getDashboardMetrics();
  }

  @Get('active-running-projects')
  async getActiveRunningProjects() {
    return this.reportsService.getActiveRunningProjects();
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
    return this.reportsService.getGlobalEmployeeDailyReports({
      date,
      projectId,
      section,
      employeeId,
      machineId,
      search,
      type,
    });
  }

  @Get('employee-daily-reports/stats')
  async getEmployeeDailyReportStats(
    @Query('date') date?: string,
  ) {
    return this.reportsService.getEmployeeDailyReportStats({ date });
  }

  @Post('designer-log')
  async createGlobalDesignerLog(
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    const result = await this.reportsService.createGlobalDesignerLog(dto, user.userId);
    return { success: true, data: result, message: 'Designer log created successfully' };
  }

  @Post('msdr-log')
  async createGlobalMsdrLog(
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    const result = await this.reportsService.createGlobalMsdrLog(dto, user.userId);
    return { success: true, data: result, message: 'MSDR log created successfully' };
  }

  @Get('project-material-inventory')
  async getProjectMaterialInventory(
    @Query('projectId') projectId?: string,
    @Query('section') section?: string,
    @Query('search') search?: string,
  ) {
    return this.reportsService.getProjectMaterialInventory({ projectId, section, search });
  }
}
