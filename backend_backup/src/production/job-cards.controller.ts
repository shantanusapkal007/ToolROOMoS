import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, ParseUUIDPipe
} from '@nestjs/common';
import { JobCardsService } from './job-cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/projects/:projectId/job-cards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobCardsController {
  constructor(private readonly jobCardsService: JobCardsService) {}

  @Get()
  async getJobCardsForProject(@Param('projectId') projectId: string) {
    const data = await this.jobCardsService.getJobCardsForProject(projectId);
    return {
      status: 'success',
      message: 'Job cards retrieved successfully.',
      data,
    };
  }

  @Post('generate')
  @Roles('ADMIN', 'PRODUCTION')
  async generateJobCards(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any
  ) {
    const data = await this.jobCardsService.generateJobCardsFromRouting(projectId);
    return {
      status: 'success',
      message: 'Job cards generated successfully.',
      data,
    };
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'PRODUCTION')
  async updateJobCardStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @Body('operatorId') operatorId?: string,
    @CurrentUser() user?: any
  ) {
    const data = await this.jobCardsService.updateJobCardStatus(id, status, operatorId);
    return {
      status: 'success',
      message: 'Job card status updated successfully.',
      data,
    };
  }

  @Delete(':id')
  @Roles('ADMIN', 'PRODUCTION')
  async deleteJobCard(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.jobCardsService.deleteJobCard(id);
    return {
      status: 'success',
      message: 'Job card deleted successfully.',
    };
  }
}
