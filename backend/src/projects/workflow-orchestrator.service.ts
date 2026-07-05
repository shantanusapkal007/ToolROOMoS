import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class WorkflowOrchestratorService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateProjectStage(projectId: string, txClient?: any): Promise<void> {
    const tx = txClient || this.prisma;
    
    const project = await tx.project.findUnique({ 
      where: { id: projectId },
      include: {
        billOfMaterialHeaders: { where: { status: 'APPROVED' } },
        routingHeaders: { where: { approvalStatus: 'APPROVED' } },
        goodsReceiptHeaders: true,
        materialIssueHeaders: true,
        jobCards: true,
        machineShopReports: true,
        inspectionHeaders: { where: { inspectionType: 'FINAL_PDI', result: 'PASS' } },
        dispatchNotes: true,
        invoiceHeaders: true
      }
    });

    if (!project || project.currentStage === 'CLOSED' || project.currentStage === 'CANCELLED') {
      return; // Terminal states do not evaluate automatically
    }

    let nextStage: ProjectStatus = project.currentStage;

    // Evaluate progression strictly in order
    if (project.currentStage === 'CREATED' || project.currentStage === 'ENGINEERING') {
      const hasBom = project.billOfMaterialHeaders.length > 0;
      const hasRouting = project.routingHeaders.length > 0;
      if (hasBom && hasRouting) {
        nextStage = 'PROCUREMENT';
      }
    }

    if (nextStage === 'PROCUREMENT') {
      const hasGrn = project.goodsReceiptHeaders.length > 0;
      if (hasGrn) {
        nextStage = 'MATERIAL_AVAILABLE';
      }
    }

    if (nextStage === 'MATERIAL_AVAILABLE') {
      const hasIssues = project.materialIssueHeaders.length > 0;
      const hasJobCards = project.jobCards.length > 0;
      if (hasIssues && hasJobCards) {
        nextStage = 'PRODUCTION';
      }
    }

    if (nextStage === 'PRODUCTION') {
      const hasMsdr = project.machineShopReports.length > 0;
      // We could check if all job cards are completed, but for now ANY MSDR puts it into INSPECTION mode
      // Let's assume MSDR completion means it can enter INSPECTION.
      if (hasMsdr) {
        nextStage = 'INSPECTION';
      }
    }

    if (nextStage === 'INSPECTION') {
      const hasPassedPdi = project.inspectionHeaders.length > 0;
      if (hasPassedPdi) {
        nextStage = 'DISPATCH_READY';
      }
    }

    if (nextStage === 'DISPATCH_READY') {
      const hasDispatch = project.dispatchNotes.length > 0;
      if (hasDispatch) {
        nextStage = 'DISPATCHED';
      }
    }

    if (nextStage === 'DISPATCHED') {
      const hasInvoice = project.invoiceHeaders.length > 0;
      if (hasInvoice) {
        nextStage = 'INVOICED';
      }
    }

    // Only update if there is a progression
    if (nextStage !== project.currentStage) {
      await tx.project.update({
        where: { id: projectId },
        data: { currentStage: nextStage }
      });
      
      await tx.projectTimeline.create({
        data: {
          projectId,
          fromStage: project.currentStage,
          toStage: nextStage,
          remarks: 'System Auto-Progression based on Workflow rules.'
        }
      });
      
      // Recursively evaluate in case multiple stages can be skipped (e.g. zero inventory project)
      await this.evaluateProjectStage(projectId, tx);
    }
  }
}
