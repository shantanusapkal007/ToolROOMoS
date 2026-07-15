import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class WorkflowOrchestratorService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateProjectStage(projectId: string, txClient?: any, depth = 0): Promise<void> {
    // Guard against infinite recursion — max 10 stage transitions per call chain
    if (depth >= 10) return;

    const tx = txClient || this.prisma;

    const project = await tx.project.findUnique({
      where: { id: projectId },
      include: {
        billOfMaterialHeaders: { where: { status: 'APPROVED' } },
        goodsReceiptHeaders: true,
        materialIssueHeaders: true,
        jobCards: true,
        machineShopReports: true,
        inspectionHeaders: { where: { inspectionType: 'FINAL_PDI', result: 'PASS' } },
        dispatchNotes: true,
        assemblyHeaders: true,
        projectTrials: true,
        invoiceHeaders: true,
      },
    });

    if (!project || project.currentStage === 'CLOSED' || project.currentStage === 'CANCELLED') {
      return; // Terminal states — no auto progression
    }

    let nextStage: ProjectStatus = project.currentStage;

    // Evaluate stage progression strictly in order
    if (project.currentStage === 'CREATED' || project.currentStage === 'ENGINEERING') {
      const hasBom = project.billOfMaterialHeaders.length > 0;
      if (hasBom) {
        nextStage = 'PROCUREMENT';
      }
    }

    if (nextStage === 'PROCUREMENT') {
      const hasGrn = project.goodsReceiptHeaders.length > 0;
      if (hasGrn) nextStage = 'MATERIAL_AVAILABLE';
    }

    if (nextStage === 'MATERIAL_AVAILABLE') {
      const hasIssues = project.materialIssueHeaders.length > 0;
      if (hasIssues) nextStage = 'PRODUCTION';
    }

    if (nextStage === 'PRODUCTION') {
      const hasMsdr = project.machineShopReports.length > 0;
      if (hasMsdr) nextStage = 'INSPECTION';
    }

    if (nextStage === 'INSPECTION') {
      const hasPassedPdi = project.inspectionHeaders.length > 0;
      if (hasPassedPdi) {
        // Assembly Gate: If the project requires assembly (has assembly headers),
        // we must not go to DISPATCH_READY until we have a PASSED trial.
        const requiresAssembly = project.assemblyHeaders.length > 0;
        if (requiresAssembly) {
          const hasPassedTrial = project.projectTrials.some(
            (t: any) => t.status === 'PASSED' && t.customerSignoff
          );
          if (hasPassedTrial) nextStage = 'DISPATCH_READY';
        } else {
          nextStage = 'DISPATCH_READY';
        }
      }
    }

    if (nextStage === 'DISPATCH_READY') {
      const hasDispatch = project.dispatchNotes.length > 0;
      if (hasDispatch) nextStage = 'DISPATCHED';
    }

    if (nextStage === 'DISPATCHED') {
      const hasInvoice = project.invoiceHeaders.length > 0;
      if (hasInvoice) nextStage = 'INVOICED';
    }

    // Only update if there is actual progression
    if (nextStage !== project.currentStage) {
      await tx.project.update({
        where: { id: projectId },
        data: { currentStage: nextStage },
      });

      await tx.projectTimeline.create({
        data: {
          projectId,
          fromStage: project.currentStage,
          toStage: nextStage,
          remarks: 'System Auto-Progression based on Workflow rules.',
        },
      });

      // Recursively evaluate — pass depth+1 to prevent infinite loops
      await this.evaluateProjectStage(projectId, tx, depth + 1);
    }
  }
}
