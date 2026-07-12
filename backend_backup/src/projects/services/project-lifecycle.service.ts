import { Injectable, BadRequestException } from '@nestjs/common';
import { ProjectRepository } from '../repositories/project.repository';
import { ProjectTimelineService } from './project-timeline.service';
import { EventBus } from '../../platform/event.bus';
import { ProjectStageChanged } from '../events/project.events';
import { ProjectStatus } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ProjectLifecycleService {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly timelineService: ProjectTimelineService,
    private readonly eventBus: EventBus
  ) {}

  async advanceStage(projectId: string, toStage: ProjectStatus, remarks?: string) {
    return this.repository.executeInTransaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      const fromStage = project.currentStage;

      if (fromStage === toStage) {
        throw new BadRequestException('Project is already in this stage.');
      }

      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: { currentStage: toStage },
      });

      await this.timelineService.logTransition(
        projectId,
        fromStage,
        toStage,
        remarks || `Workflow advanced to ${toStage}`
      );

      this.eventBus.emit('ProjectStageChanged', new ProjectStageChanged(projectId, fromStage, toStage, remarks));

      return updatedProject;
    });
  }

  // Example: Reactive workflow handling
  @OnEvent('ProductionCompleted')
  async handleProductionCompleted(payload: { projectId: string }) {
    try {
      await this.advanceStage(payload.projectId, 'INSPECTION', 'Auto-advanced: Production phase completed.');
    } catch (e) {
      // Handle or log error gracefully
    }
  }

  @OnEvent('InspectionPassed')
  async handleInspectionPassed(payload: { projectId: string }) {
    try {
      await this.advanceStage(payload.projectId, 'DISPATCHED', 'Auto-advanced: Final inspection passed.');
    } catch (e) {
      // Handle or log error gracefully
    }
  }
}
