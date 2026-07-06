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
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus } from '@prisma/client';

import { WorkflowOrchestratorService } from './workflow-orchestrator.service';

@Controller('api/v1/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly orchestratorService: WorkflowOrchestratorService,
  ) {}

  @Post()
  @Roles('ADMIN', 'SALES_ENGINEER')
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.projectsService.create(dto, user.userId);
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
    const result = await this.projectsService.findAll({
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
    const data = await this.projectsService.getDashboardMetrics();
    return {
      status: 'success',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.findOne(id);
    return {
      status: 'success',
      message: 'Project Control Center loaded successfully.',
      data,
    };
  }

  @Get(':id/inventory-batches')
  async getInventoryBatches(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.getInventoryBatches(id);
    return {
      status: 'success',
      message: 'Available inventory batches retrieved.',
      data,
    };
  }

  @Put(':id')
  @Roles('ADMIN', 'SALES_ENGINEER')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.projectsService.update(id, dto, user.userId);
    return {
      status: 'success',
      message: 'Project updated successfully.',
      data,
    };
  }

  @Put(':id/status')
  @Roles('ADMIN', 'SALES_ENGINEER')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ProjectStatus,
    @Body('remarks') remarks?: string,
    @CurrentUser() user?: any,
  ) {
    const data = await this.projectsService.updateTimeline(id, status, remarks, user?.userId);
    return {
      status: 'success',
      message: 'Project timeline stage forced successfully.',
      data,
    };
  }

  @Post(':id/advance-stage')
  @Roles('ADMIN', 'SALES_ENGINEER', 'PRODUCTION')
  async advanceStage(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.orchestratorService.evaluateProjectStage(id);
    return {
      status: 'success',
      message: 'Project stage evaluated against business rules.',
      data: result,
    };
  }

  @Get(':id/timeline')
  async getTimeline(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.getTimeline(id);
    return {
      status: 'success',
      message: 'Project timeline history retrieved.',
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
    const result = await this.projectsService.getActivities(id, pageNum, limitNum);
    return {
      status: 'success',
      message: 'Project activity history retrieved.',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id/cost-events')
  async getCostEvents(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.getCostEvents(id);
    return {
      status: 'success',
      message: 'Project financial audit trail retrieved.',
      data,
    };
  }

  // --- NCR ---
  @Get(':id/ncr')
  async getNcrs(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.getNcrs(id);
    return {
      status: 'success',
      message: 'NCR reports retrieved.',
      data,
    };
  }

  @Patch(':id/ncr/:ncrId/close')
  @Roles('ADMIN', 'QUALITY')
  async closeNcr(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ncrId') ncrId: string,
    @Body('disposition') disposition?: string,
    @Body('rootCause') rootCause?: string,
    @CurrentUser() user?: any,
  ) {
    const data = await this.projectsService.closeNcr(id, ncrId, { disposition, rootCause }, user?.userId);
    return {
      status: 'success',
      message: 'NCR closed successfully.',
      data,
    };
  }

  // --- Tasks (WBS) ---
  @Get(':id/tasks')
  async getTasks(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.projectsService.getTasks(id);
    return {
      status: 'success',
      data,
    };
  }

  @Post(':id/tasks')
  @Roles('ADMIN', 'ENGINEERING', 'PRODUCTION')
  async createTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const data = await this.projectsService.createTask(id, body, user.userId);
    return {
      status: 'success',
      message: 'Task created successfully.',
      data,
    };
  }

  @Put(':id/tasks/:taskId')
  @Roles('ADMIN', 'ENGINEERING', 'PRODUCTION')
  async updateTask(
    @Param('taskId') taskId: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const data = await this.projectsService.updateTask(taskId, body, user.userId);
    return {
      status: 'success',
      message: 'Task updated successfully.',
      data,
    };
  }

  @Patch(':id/tasks/:taskId/status')
  @Roles('ADMIN', 'ENGINEERING', 'PRODUCTION')
  async updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.projectsService.updateTask(taskId, { status }, user.userId);
    return {
      status: 'success',
      message: 'Task status updated successfully.',
      data,
    };
  }

  // --- Closing Engine ---
  @Post(':id/close')
  @Roles('ADMIN', 'FINANCE')
  async closeProject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.projectsService.closeProject(id, user.userId);
    return {
      status: 'success',
      message: 'Project closed successfully.',
      data,
    };
  }

  // --- Deletion Engine ---
  @Delete(':id')
  @Roles('ADMIN')
  async removeProject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.projectsService.remove(id, user.userId);
    return {
      status: 'success',
      message: 'Project deleted successfully.',
      data,
    };
  }
}
