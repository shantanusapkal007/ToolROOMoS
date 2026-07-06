import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { MaterialIssuesService } from './material-issues.service';
import { ProductionOperationsService } from './production-operations.service';

import { CreateIssueDto } from './dto/create-issue.dto';
import { CreateMsdrDto } from './dto/create-msdr.dto';

@Controller('api/v1/projects/:projectId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionController {
  constructor(
    private readonly issueService: MaterialIssuesService,
    private readonly msdrService: ProductionOperationsService,
    
  ) {}

  // Material Issue routes
  @Post('material-issues')
  @Roles('ADMIN', 'PRODUCTION')
  async issueMaterial(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIssueDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.issueService.issueMaterial(projectId, dto, user.userId);
    return {
      status: 'success',
      message: 'Material issued successfully.',
      data,
    };
  }

  @Get('material-issues')
  async getMaterialIssues(@Param('projectId') projectId: string) {
    const data = await this.issueService.getMaterialIssues(projectId);
    return {
      status: 'success',
      message: 'Material issue histories retrieved.',
      data,
    };
  }

  @Post('material-returns')
  @Roles('ADMIN', 'PRODUCTION')
  async returnMaterial(
    @Param('projectId') projectId: string,
    @Body() dto: { issueId: string; returnQty: number; remarks: string },
    @CurrentUser() user: any,
  ) {
    const data = await this.returnService.returnMaterial(projectId, dto.issueId, dto.returnQty, dto.remarks, user.userId);
    return {
      status: 'success',
      message: 'Material returned successfully.',
      data,
    };
  }

  // Machine Shop Daily Report routes
  @Post('machine-shop-reports')
  @Roles('ADMIN', 'PRODUCTION')
  async logMachineShopReport(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMsdrDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.msdrService.logMachineShopReport(projectId, dto, user.userId);
    return {
      status: 'success',
      message: 'Machine shop daily report logged successfully.',
      data,
    };
  }

  @Get('machine-shop-reports')
  async getMachineShopReports(@Param('projectId') projectId: string) {
    const data = await this.msdrService.getMachineShopReports(projectId);
    return {
      status: 'success',
      message: 'Machine shop daily reports retrieved.',
      data,
    };
  }
}
