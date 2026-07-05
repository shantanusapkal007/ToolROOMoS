import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { JobCardsService } from './job-cards.service';

@Controller('projects/:projectId/job-cards')
export class JobCardsController {
  constructor(private readonly jobCardsService: JobCardsService) {}

  @Get()
  getJobCardsForProject(@Param('projectId') projectId: string) {
    return this.jobCardsService.getJobCardsForProject(projectId);
  }

  @Post('generate')
  generateJobCards(@Param('projectId') projectId: string) {
    return this.jobCardsService.generateJobCardsFromRouting(projectId);
  }

  @Patch(':id/status')
  updateJobCardStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('operatorId') operatorId?: string
  ) {
    return this.jobCardsService.updateJobCardStatus(id, status, operatorId);
  }
}
