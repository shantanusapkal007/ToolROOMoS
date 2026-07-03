import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { MaterialIssuesService } from './material-issues.service';
import { ProductionOperationsService } from './production-operations.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { CreateMsdrDto } from './dto/create-msdr.dto';

@Controller('api/v1/projects/:projectId')
export class ProductionController {
  constructor(
    private readonly issueService: MaterialIssuesService,
    private readonly msdrService: ProductionOperationsService,
  ) {}

  // Material Issue routes
  @Post('material-issues')
  async issueMaterial(
    @Param('projectId') projectId: string,
    @Body() dto: CreateIssueDto,
  ) {
    const data = await this.issueService.issueMaterial(projectId, dto);
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

  // Machine Shop Daily Report routes
  @Post('machine-shop-reports')
  async logMachineShopReport(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMsdrDto,
  ) {
    const data = await this.msdrService.logMachineShopReport(projectId, dto);
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
