import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CacheEngine } from '../../platform/cache.engine';
import { ProjectCreated, ProjectUpdated, ProjectClosed, ProjectStageChanged } from '../events/project.events';

@Injectable()
export class CacheSubscriber {
  constructor(private readonly cache: CacheEngine) {}

  @OnEvent('ProjectCreated')
  @OnEvent('ProjectUpdated')
  @OnEvent('ProjectClosed')
  @OnEvent('ProjectStageChanged')
  async handleProjectInvalidation(event: ProjectCreated | ProjectUpdated | ProjectClosed | ProjectStageChanged) {
    // We invalidate the specific project details
    await this.cache.del(`projects:${event.projectId}:details`);
    // And we invalidate the general project list / summary for dashboard
    await this.cache.del('dashboard:metrics:projects');
  }
}
