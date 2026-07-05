import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { WorkflowOrchestratorService } from './workflow-orchestrator.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, WorkflowOrchestratorService],
  exports: [ProjectsService, WorkflowOrchestratorService],
})
export class ProjectsModule {}
