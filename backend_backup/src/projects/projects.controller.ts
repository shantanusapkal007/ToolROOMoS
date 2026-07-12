import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
  Patch,
  ParseUUIDPipe
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProjectCommandService } from './services/project-command.service';
import { ProjectQueryService } from './services/project-query.service';
import { ProjectDashboardService } from './services/project-dashboard.service';
import { ProjectLifecycleService } from './services/project-lifecycle.service';
import { ProjectTeamService } from './services/project-team.service';
import { ProjectBudgetService } from './services/project-budget.service';
import { ProjectTimelineService } from './services/project-timeline.service';
import { ProjectDocumentService } from './services/project-document.service';
import { ProjectStatus } from '@prisma/client';

@Controller('api/v1/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(
    private readonly commandService: ProjectCommandService,
    private readonly queryService: ProjectQueryService,
    private readonly dashboardService: ProjectDashboardService,
    private readonly lifecycleService: ProjectLifecycleService,
    private readonly teamService: ProjectTeamService,
    private readonly budgetService: ProjectBudgetService,
    private readonly timelineService: ProjectTimelineService,
    private readonly documentService: ProjectDocumentService
  ) {}

  @Post()
  @Roles('ADMIN', 'SALES')
  async create(@Body() dto: any) {
    const data = await this.commandService.create(dto);
    return {
      status: 'success',
      message: 'Project initialized successfully.',
      data,
    };
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ) {
    const result = await this.queryService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      customerId,
    });
    return {
      status: 'success',
      message: 'Projects retrieved successfully.',
      ...result,
    };
  }

  @Get('dashboard-metrics')
  async getDashboardMetrics() {
    const data = await this.dashboardService.getDashboardMetrics();
    return {
      status: 'success',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.queryService.findOne(id);
    return {
      status: 'success',
      message: 'Project Control Center loaded successfully.',
      data,
    };
  }

  @Put(':id')
  @Roles('ADMIN', 'SALES')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
  ) {
    const data = await this.commandService.update(id, dto);
    return {
      status: 'success',
      message: 'Project updated successfully.',
      data,
    };
  }

  @Put(':id/status')
  @Roles('ADMIN', 'SALES')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ProjectStatus,
    @Body('remarks') remarks?: string,
  ) {
    const data = await this.lifecycleService.advanceStage(id, status, remarks);
    return {
      status: 'success',
      message: 'Project timeline stage forced successfully.',
      data,
    };
  }

  @Get(':id/timeline')
  async getTimeline(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.timelineService.getTimeline(id);
    return {
      status: 'success',
      data,
    };
  }

  @Get(':id/activities')
  async getActivities(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const result = await this.timelineService.getActivities(id, pageNum, limitNum);
    return {
      status: 'success',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id/cost-events')
  async getCostEvents(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.budgetService.getCostEvents(id);
    return {
      status: 'success',
      data,
    };
  }

  @Post(':id/close')
  @Roles('ADMIN', 'FINANCE')
  async closeProject(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.commandService.closeProject(id);
    return {
      status: 'success',
      message: 'Project closed successfully.',
      data,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async removeProject(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.commandService.remove(id);
    return {
      status: 'success',
      message: 'Project deleted successfully.',
      data,
    };
  }

  // --- TEAM ---
  @Get(':id/team')
  async getTeam(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.teamService.getTeam(id);
    return { status: 'success', data };
  }

  @Post(':id/team')
  async addTeamMember(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    const result = await this.teamService.addTeamMember(id, data);
    return { status: 'success', data: result };
  }

  @Delete('team/:teamId')
  async removeTeamMember(@Param('teamId') teamId: string) {
    await this.teamService.removeTeamMember(teamId);
    return { status: 'success' };
  }

  // --- BUDGET ---
  @Get(':id/budget')
  async getBudget(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.budgetService.getBudget(id);
    return { status: 'success', data };
  }

  @Put(':id/budget')
  async upsertBudget(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    const result = await this.budgetService.upsertBudget(id, data);
    return { status: 'success', data: result };
  }

  // --- DOCUMENTS ---
  @Get(':id/documents')
  async getDocuments(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.documentService.getDocuments(id);
    return { status: 'success', data };
  }

  @Post(':id/documents')
  async uploadDocument(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    const result = await this.documentService.uploadDocument(id, data);
    return { status: 'success', data: result };
  }

  @Delete('documents/:documentId')
  async deleteDocument(@Param('documentId', ParseUUIDPipe) documentId: string) {
    await this.documentService.deleteDocument(documentId);
    return { status: 'success' };
  }
}
