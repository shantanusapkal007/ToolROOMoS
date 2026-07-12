import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus } from '../../platform/event.bus';
import { AuditEngine } from '../../platform/audit.engine';
import { ApprovalEngine } from '../../platform/approval.engine';
import { SequenceEngine } from '../../platform/sequence.engine';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchaseRequestsService {
  private readonly logger = new Logger(PurchaseRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly auditEngine: AuditEngine,
    private readonly approvalEngine: ApprovalEngine,
    private readonly sequenceEngine: SequenceEngine,
  ) {}

  async generateFromPlanningRecommendation(recommendationId: string, userId: string) {
    const recommendation = await this.prisma.planningRecommendation.findUnique({
      where: { id: recommendationId },
      include: { items: true },
    });

    if (!recommendation) {
      throw new NotFoundException(`PlanningRecommendation ${recommendationId} not found`);
    }

    if (recommendation.status !== 'APPROVED') {
      throw new InternalServerErrorException('Can only generate PR from APPROVED recommendations');
    }

    const prNumber = await this.sequenceEngine.generateNextNumber('PR');

    const pr = await this.prisma.purchaseRequestHeader.create({
      data: {
        projectId: recommendation.projectId,
        prNumber,
        status: 'DRAFT',
        createdBy: userId,
        items: {
          create: recommendation.items
            .filter((item) => item.source === 'PURCHASE')
            .map((item) => ({
              materialId: item.materialId,
              requiredQuantity: item.requiredQuantity,
            })),
        },
      },
      include: { items: true },
    });

    await this.auditEngine.logAction(
      pr.id,
      'PURCHASE_REQUEST',
      'CREATE',
      userId,
      { source: `Recommendation: ${recommendation.recommendationNo}` }
    );

    return pr;
  }

  async getPrById(id: string) {
    return this.prisma.purchaseRequestHeader.findUnique({
      where: { id },
      include: { items: true, project: true },
    });
  }

  async submitForApproval(id: string, userId: string) {
    const pr = await this.prisma.purchaseRequestHeader.findUnique({ where: { id } });
    if (!pr || pr.status !== 'DRAFT') {
      throw new InternalServerErrorException('Only DRAFT PRs can be submitted');
    }

    // Example integration with generic Approval Engine
    await (this.approvalEngine as any).logApprovalAction(
      id,
      'PURCHASE_REQUEST',
      1,
      'APPROVED',
      userId,
      'Submitted for Approval'
    );

    const updated = await this.prisma.purchaseRequestHeader.update({
      where: { id },
      data: { status: 'PENDING', updatedBy: userId },
    });

    return updated;
  }

  async approvePr(id: string, userId: string, remarks?: string) {
    const pr = await this.prisma.purchaseRequestHeader.update({
      where: { id },
      data: { status: 'APPROVED', updatedBy: userId },
    });

    // Notify listeners (e.g., PO Engine)
    await this.eventBus.emit('PurchaseRequestApproved', {
      prId: id,
      projectId: pr.projectId,
      approvedBy: userId,
    });

    return pr;
  }
}
