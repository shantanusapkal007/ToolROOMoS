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
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { BomsService } from './boms.service';
import { RoutingService } from './routing.service';
import { CreateBomDto } from './dto/create-bom.dto';
import { CreateRoutingDto } from './dto/create-routing.dto';

@Controller('api/v1/projects/:projectId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngineeringController {
  constructor(
    private readonly bomsService: BomsService,
    private readonly routingService: RoutingService,
  ) {}

  // BOM APIs
  @Post('bom')
  @Roles('ADMIN', 'ENGINEERING')
  async createBom(
    @Param('projectId') projectId: string,
    @Body() dto: CreateBomDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.bomsService.createBom(projectId, dto, user.userId);
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
    @CurrentUser() user: any,
  ) {
    const data = await this.bomsService.approveBom(projectId, bomId, user.userId);
    return {
      status: 'success',
      message: 'BOM approved. Project transitioned to Procurement stage.',
      data,
    };
  }

  @Put('bom/:bomId/reject')
  @Roles('ADMIN', 'ENGINEERING')
  async rejectBom(
    @Param('projectId') projectId: string,
    @Param('bomId') bomId: string,
    @Body('remarks') remarks: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.bomsService.rejectBom(projectId, bomId, remarks, user.userId);
    return {
      status: 'success',
      message: 'BOM rejected and sent back for revision.',
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
    @CurrentUser() user: any,
  ) {
    const data = await this.routingService.submitEngineeringPlan(projectId, dto, user.userId);
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
    @CurrentUser() user: any,
  ) {
    const data = await this.routingService.approveManufacturingPlan(projectId, routingId, user.userId);
    return {
      status: 'success',
      message: 'Manufacturing Plan approved. Cost Baseline frozen. Project transitioned to Procurement.',
      data,
    };
  }

  @Put('routing/:routingId/reject')
  @Roles('ADMIN', 'ENGINEERING')
  async rejectManufacturingPlan(
    @Param('projectId') projectId: string,
    @Param('routingId') routingId: string,
    @Body('remarks') remarks: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.routingService.rejectManufacturingPlan(projectId, routingId, remarks, user.userId);
    return {
      status: 'success',
      message: 'Manufacturing Plan rejected and returned to Engineering.',
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
