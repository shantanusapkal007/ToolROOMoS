import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { MaterialIssuesService } from './material-issues.service';

@Controller('api/v1/projects/:projectId/material-issues')
export class MaterialIssuesController {
  constructor(private readonly issuesService: MaterialIssuesService) {}

  @Get()
  getMaterialIssues(@Param('projectId') projectId: string) {
    return this.issuesService.getMaterialIssues(projectId);
  }

  @Post()
  createMaterialIssue(
    @Param('projectId') projectId: string,
    @Body('departmentId') departmentId: string,
    @Body('items') items: any[],
  ) {
    return this.issuesService.createMaterialIssue(projectId, departmentId, items, 'SYSTEM');
  }
}
