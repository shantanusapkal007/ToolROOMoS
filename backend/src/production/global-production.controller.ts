import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MaterialIssuesService } from './material-issues.service';

@Controller('api/v1/production')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GlobalProductionController {
  constructor(
    private readonly issueService: MaterialIssuesService,
  ) {}

  @Get('material-issues')
  async getAllMaterialIssues() {
    const data = await this.issueService.getAllMaterialIssues();
    return {
      status: 'success',
      message: 'All material issue records retrieved successfully.',
      data,
    };
  }

  @Get('inventory-batches')
  async getAvailableBatches() {
    const data = await this.issueService.getAvailableInventoryBatches();
    return {
      status: 'success',
      message: 'Available inventory batches retrieved successfully.',
      data,
    };
  }
}
