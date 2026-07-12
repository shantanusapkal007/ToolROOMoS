import { Injectable, BadRequestException } from '@nestjs/common';
import { ProjectRepository } from '../repositories/project.repository';
import { ClsService } from 'nestjs-cls';
import { EventBus } from '../../platform/event.bus';
import { AuditEngine } from '../../platform/audit.engine';
import { ProjectCreated, ProjectUpdated, ProjectClosed, ProjectArchived } from '../events/project.events';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectCommandService {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly cls: ClsService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine
  ) {}

  async create(dto: any) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    return this.repository.executeInTransaction(async (tx) => {
      let resolvedPlantId = dto.plantId;
      if (!resolvedPlantId.includes('-') || resolvedPlantId === 'PL-01') {
        const plant = await tx.plant.findUnique({ where: { plantCode: 'PL-01' } });
        if (plant) resolvedPlantId = plant.id;
      }

      const project = await tx.project.create({
        data: {
          ...dto,
          targetDeliveryDate: dto.targetDeliveryDate ? new Date(dto.targetDeliveryDate) : null,
          plantId: resolvedPlantId,
          createdBy: userId,
          updatedBy: userId,
          currentStage: ProjectStatus.ENGINEERING,
        },
      });

      await tx.projectCostSummary.create({
        data: {
          projectId: project.id,
          estimatedMaterialCost: 0, actualMaterialCost: 0,
          materialConsumptionCost: 0, machineCost: 0,
          labourCost: 0, outsideProcessCost: 0,
          inspectionCost: 0, packingCost: 0,
          dispatchCost: 0, totalCost: 0,
          revenue: 0, profitability: 0,
        },
      });

      await tx.projectTimeline.create({
        data: {
          projectId: project.id,
          fromStage: ProjectStatus.ENGINEERING,
          toStage: ProjectStatus.ENGINEERING,
          transitionedBy: userId,
          remarks: 'Project initialized via Customer PO registration',
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: project.id,
          action: 'PROJECT_CREATED',
          description: `Project ${project.projectNumber} registered`,
          performedBy: userId,
        },
      });

      await this.audit.logAction(project.id, 'PROJECT', 'CREATE', project);
      this.eventBus.emit('ProjectCreated', new ProjectCreated(project.id, project.projectNumber));

      return project;
    });
  }

  async update(id: string, dto: any) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const project = await this.repository.update({
      where: { id },
      data: {
        ...dto,
        targetDeliveryDate: dto.targetDeliveryDate ? new Date(dto.targetDeliveryDate) : undefined,
        updatedBy: userId,
      },
    });

    await this.audit.logAction(id, 'PROJECT', 'UPDATE', project);
    this.eventBus.emit('ProjectUpdated', new ProjectUpdated(id));

    return project;
  }

  async closeProject(id: string) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    return this.repository.executeInTransaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id } });

      if (project.currentStage !== 'PAYMENT_PENDING' && project.currentStage !== 'INVOICED') {
        throw new BadRequestException('Project can only be closed after Payment or Invoicing is complete.');
      }

      const openNcr = await tx.ncrReport.findFirst({
        where: { projectId: id, status: 'OPEN' }
      });
      if (openNcr) {
        throw new BadRequestException('Cannot close project with an OPEN NCR.');
      }

      const closedProject = await tx.project.update({
        where: { id },
        data: {
          currentStage: 'CLOSED',
          closedAt: new Date(),
          updatedBy: userId
        }
      });

      await tx.projectTimeline.create({
        data: {
          projectId: id,
          fromStage: project.currentStage,
          toStage: 'CLOSED',
          transitionedBy: userId,
          remarks: 'Project financially and operationally closed.',
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: id,
          action: 'PROJECT_CLOSED',
          description: `Project fully closed.`,
          performedBy: userId,
        },
      });

      await this.audit.logAction(id, 'PROJECT', 'UPDATE', closedProject);
      this.eventBus.emit('ProjectClosed', new ProjectClosed(id));

      return closedProject;
    });
  }

  async remove(id: string) {
    const project = await this.repository.delete({ id });
    await this.audit.logAction(id, 'PROJECT', 'DELETE', project);
    this.eventBus.emit('ProjectArchived', new ProjectArchived(id));
    return project;
  }
}
