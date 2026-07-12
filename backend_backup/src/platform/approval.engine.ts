// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ApprovalEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cls: ClsService
  ) {}

  /**
   * Retrieves the approval workflow for a given document type.
   */
  async getWorkflow(documentType: string) {
    return this.prisma.approvalWorkflow.findUnique({
      where: { documentType },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  }

  /**
   * Logs an approval action.
   */
  async logApprovalAction(
    documentId: string,
    documentType: string,
    stepOrder: number,
    action: 'APPROVED' | 'REJECTED',
    remarks?: string,
  ) {
    const approverId = this.cls.get('userId') || 'SYSTEM';
    const approverRole = this.cls.get('userRole') || 'SYSTEM';

    await this.prisma.approvalLog.create({
      data: {
        documentId,
        documentType,
        stepOrder,
        approverId,
        approverRole,
        action,
        remarks,
      },
    });
  }

  /**
   * Checks if a user has the right to approve a document at the current step.
   * This is a simplified check for Phase 0.
   */
  async canApprove(
    documentType: string,
    stepOrder: number,
    userRole: string,
    amount?: number,
  ): Promise<boolean> {
    const workflow = await this.getWorkflow(documentType);
    if (!workflow || !workflow.isActive) {
      return false; // No active workflow means no approval allowed (or bypass, depending on policy)
    }

    const step = workflow.steps.find((s) => s.stepOrder === stepOrder);
    if (!step) {
      return false;
    }

    if (step.roleRequired !== userRole) {
      return false; // User doesn't have the required role
    }

    if (amount !== undefined) {
      if (step.minAmount && amount < Number(step.minAmount)) return false;
      if (step.maxAmount && amount > Number(step.maxAmount)) return false;
    }

    return true;
  }
}

