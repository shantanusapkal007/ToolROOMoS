import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectCommandService } from './services/project-command.service';
import { ProjectQueryService } from './services/project-query.service';
import { ProjectDashboardService } from './services/project-dashboard.service';
import { ProjectLifecycleService } from './services/project-lifecycle.service';
import { ProjectTeamService } from './services/project-team.service';
import { ProjectBudgetService } from './services/project-budget.service';
import { ProjectTimelineService } from './services/project-timeline.service';
import { ProjectDocumentService } from './services/project-document.service';
import { CacheSubscriber } from './subscribers/cache.subscriber';

const providers = [
  ProjectRepository,
  ProjectCommandService,
  ProjectQueryService,
  ProjectDashboardService,
  ProjectLifecycleService,
  ProjectTeamService,
  ProjectBudgetService,
  ProjectTimelineService,
  ProjectDocumentService,
  CacheSubscriber,
];

@Module({
  controllers: [ProjectsController],
  providers: [...providers],
  exports: [ProjectQueryService, ProjectCommandService, ProjectLifecycleService],
})
export class ProjectsModule {}

