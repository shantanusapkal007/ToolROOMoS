import { Controller, Get, Post, Body, Param, Patch, UseGuards, ParseUUIDPipe
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
  getJobCardsForProject(@Param('projectId') projectId: string) {
    return this.jobCardsService.getJobCardsForProject(projectId);
  }

  @Post('generate')
  @Roles('ADMIN', 'PRODUCTION')
  generateJobCards(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any
  ) {
    return this.jobCardsService.generateJobCardsFromRouting(projectId);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'PRODUCTION')
  updateJobCardStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @Body('operatorId') operatorId?: string,
    @CurrentUser() user?: any
  ) {
    // In job cards service, we don't have updatedBy currently in job_cards table, but I'll pass it if needed, or just let service handle it
    return this.jobCardsService.updateJobCardStatus(id, status, operatorId);
  }
}
