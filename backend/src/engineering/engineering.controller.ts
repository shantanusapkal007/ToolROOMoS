import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DrawingsService } from './drawings.service';
import { BomsService } from './boms.service';
import { RoutingService } from './routing.service';
import { CreateDrawingDto } from './dto/create-drawing.dto';
import { CreateBomDto } from './dto/create-bom.dto';
import { CreateRoutingDto } from './dto/create-routing.dto';

@Controller('api/v1/projects/:projectId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngineeringController {
  constructor(
    private readonly drawingsService: DrawingsService,
    private readonly bomsService: BomsService,
    private readonly routingService: RoutingService,
  ) {}

  // Drawings APIs
  @Post('drawings')
  @Roles('ADMIN', 'ENGINEERING')
  async uploadDrawing(
    @Param('projectId') projectId: string,
    @Body() dto: CreateDrawingDto,
  ) {
    const data = await this.drawingsService.uploadDrawing(projectId, dto);
    return {
      status: 'success',
      message: 'Drawing uploaded successfully.',
      data,
    };
  }

  @Get('drawings')
  async getDrawings(@Param('projectId') projectId: string) {
    const data = await this.drawingsService.getDrawings(projectId);
    return {
      status: 'success',
      message: 'Drawings retrieved successfully.',
      data,
    };
  }

  // BOM APIs
  @Post('bom')
  @Roles('ADMIN', 'ENGINEERING')
  async createBom(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBomDto,
  ) {
    const data = await this.bomsService.createBom(projectId, dto);
    return {
      status: 'success',
      message: 'BOM submitted successfully.',
      data,
    };
  }

  @Put('bom/:bomId/approve')
  @Roles('ADMIN', 'ENGINEERING')
  async approveBom(
    @Param('projectId') projectId: string,
    @Param('bomId') bomId: string,
  ) {
    const data = await this.bomsService.approveBom(projectId, bomId);
    return {
      status: 'success',
      message: 'BOM approved. Project transitioned to Procurement stage.',
      data,
    };
  }

  @Get('bom')
  async getBom(@Param('projectId') projectId: string) {
    const data = await this.bomsService.getBom(projectId);
    return {
      status: 'success',
      message: 'Active BOM retrieved successfully.',
      data,
    };
  }

  // Routing APIs
  @Post('routing')
  @Roles('ADMIN', 'ENGINEERING')
  async submitEngineeringPlan(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRoutingDto,
  ) {
    const data = await this.routingService.submitEngineeringPlan(projectId, dto);
    return {
      status: 'success',
      message: 'Manufacturing Routing Plan submitted successfully.',
      data,
    };
  }

  @Post('routing/:routingId/validate')
  async validateManufacturingPlan(
    @Param('projectId') projectId: string,
    @Param('routingId') routingId: string,
  ) {
    const data = await this.routingService.validateManufacturingPlan(projectId, routingId);
    return {
      status: 'success',
      message: 'Manufacturing Plan validation complete.',
      data,
    };
  }

  @Put('routing/:routingId/approve')
  @Roles('ADMIN', 'ENGINEERING')
  async approveManufacturingPlan(
    @Param('projectId') projectId: string,
    @Param('routingId') routingId: string,
  ) {
    const data = await this.routingService.approveManufacturingPlan(projectId, routingId);
    return {
      status: 'success',
      message: 'Manufacturing Plan approved. Cost Baseline frozen. Project transitioned to Procurement.',
      data,
    };
  }

  @Get('routing')
  async getActiveRouting(@Param('projectId') projectId: string) {
    const data = await this.routingService.getActiveRouting(projectId);
    return {
      status: 'success',
      message: 'Active Routing Plan retrieved successfully.',
      data,
    };
  }
}
