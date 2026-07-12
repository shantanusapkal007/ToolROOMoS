// @ts-nocheck
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus } from '../event.bus';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly cls: ClsService
  ) {}

  async startWorkflow(workflowName: string, entityType: string, entityId: string, steps: string[]) {
    const userId = this.cls.get('userId') || 'SYSTEM';

    const instance = await this.prisma.workflowInstance.create({
      data: {
        workflowName,
        entityType,
        entityId,
        status: 'RUNNING',
        startedBy: userId,
        steps: {
          create: steps.map((stepName, idx) => ({
            stepName,
            stepOrder: idx + 1,
            status: idx === 0 ? 'RUNNING' : 'PENDING'
          }))
        }
      },
      include: { steps: true }
    });

    this.logger.log(`Started Saga [${workflowName}] for ${entityType} ${entityId}`);
    return instance;
  }

  async advanceStep(instanceId: string, stepOrder: number, success: boolean, errorPayload?: string) {
    if (!success) {
      await this.prisma.workflowStepInstance.updateMany({
        where: { workflowInstanceId: instanceId, stepOrder },
        data: { status: 'FAILED', errorPayload, completedAt: new Date() }
      });
      await this.triggerCompensation(instanceId);
      return;
    }

    // Mark current complete
    await this.prisma.workflowStepInstance.updateMany({
      where: { workflowInstanceId: instanceId, stepOrder },
      data: { status: 'COMPLETED', completedAt: new Date() }
    });

    // Start next step
    const nextStep = await this.prisma.workflowStepInstance.findFirst({
      where: { workflowInstanceId: instanceId, stepOrder: stepOrder + 1 }
    });

    if (nextStep) {
      await this.prisma.workflowStepInstance.update({
        where: { id: nextStep.id },
        data: { status: 'RUNNING', startedAt: new Date() }
      });
      // Fire event to start the step logic
      this.eventBus.emit(`Workflow.${nextStep.stepName}.Started`, { instanceId });
    } else {
      // Complete saga
      await this.prisma.workflowInstance.update({
        where: { id: instanceId },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
      this.logger.log(`Completed Saga [${instanceId}]`);
    }
  }

  async triggerCompensation(instanceId: string) {
    this.logger.error(`Saga [${instanceId}] failed. Triggering Compensation/Rollback logic...`);
    await this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: 'COMPENSATING' }
    });
    // In a full implementation, we fire rollback events for all previously completed steps
    this.eventBus.emit(`Workflow.CompensationTriggered`, { instanceId });
  }
}

