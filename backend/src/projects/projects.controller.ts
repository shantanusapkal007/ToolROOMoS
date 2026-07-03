import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectStatus } from '@prisma/client';

@Controller('api/v1/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('ADMIN', 'SALES_ENGINEER')
  async create(@Body() dto: CreateProjectDto) {
    const data = await this.projectsService.create(dto);
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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.projectsService.findOne(id);
    return {
      status: 'success',
      message: 'Project Control Center loaded successfully.',
      data,
    };
  }

  @Put(':id/status')
  @Roles('ADMIN', 'SALES_ENGINEER')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProjectStatus,
    @Body('remarks') remarks?: string,
  ) {
    const data = await this.projectsService.updateTimeline(id, status, remarks);
    return {
      status: 'success',
      message: 'Project timeline stage advanced successfully.',
      data,
    };
  }

  @Get(':id/timeline')
  async getTimeline(@Param('id') id: string) {
    const data = await this.projectsService.getTimeline(id);
    return {
      status: 'success',
      message: 'Project timeline history retrieved.',
      data,
    };
  }

  @Get(':id/activities')
  async getActivities(@Param('id') id: string) {
    const data = await this.projectsService.getActivities(id);
    return {
      status: 'success',
      message: 'Project activity history retrieved.',
      data,
    };
  }
}
