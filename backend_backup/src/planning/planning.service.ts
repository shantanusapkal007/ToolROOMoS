// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../platform/event.bus';
import { AuditEngine } from '../platform/audit.engine';

@Injectable()
export class PlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
  ) {}

  // ================= MRP ENGINE =================
  async runMrp(projectId: string, userId: string = 'SYSTEM') {
    // 1. Verify Project exists and Engineering is approved (optional check)
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { billOfMaterialHeaders: { include: { items: true } } },
    });

    if (!project) throw new BadRequestException('Project not found');

    // 2. Create MRP Run Record
    const mrpRun = await this.prisma.mrpRun.create({
      data: { projectId, runBy: userId },
    });

    // 3. Simple BOM Explosion (Single Level for now, expand to multi-level later)
    // Gather all materials needed
    const requiredMaterials = new Map<string, number>();
    for (const bom of project.billOfMaterialHeaders) {
      if (bom.status !== 'APPROVED') continue; // only explode approved BOMs
      for (const item of bom.items) {
        const currentQty = requiredMaterials.get(item.materialId) || 0;
        requiredMaterials.set(item.materialId, currentQty + Number(item.requiredQty));
      }
    }

    // 4. Check Inventory & Generate Exceptions/PRs
    const prItems = [];
    for (const [materialId, reqQty] of requiredMaterials.entries()) {
      // Find total available stock (simplified)
      const stockAggr = await this.prisma.inventoryStock.aggregate({
        where: { materialId },
        _sum: { availableQuantity: true },
      });
      const availableStock = Number(stockAggr._sum?.availableQuantity || 0);

      // Check open PRs for this material to avoid duplicate ordering
      const openPrs = await this.prisma.purchaseRequestItem.aggregate({
        where: { materialId, status: { notIn: ['CLOSED', 'CANCELLED'] } },
        _sum: { requiredQuantity: true },
      });
      const pendingStock = Number(openPrs._sum.requiredQuantity || 0);

      const totalEffectiveStock = availableStock + pendingStock;

      if (totalEffectiveStock < reqQty) {
        const shortage = reqQty - totalEffectiveStock;
        // Generate Purchase Request Item
        prItems.push({
          materialId,
          requiredQuantity: shortage,
        });

        // Log Exception
        await this.prisma.mrpException.create({
          data: {
            mrpRunId: mrpRun.id,
            materialId,
            exceptionMessage: `Shortage of ${shortage} units detected. PR Item staged.`,
            severity: 'WARNING',
          },
        });
      }
    }

    // 5. Generate Purchase Request Header if there are shortages
    if (prItems.length > 0) {
      const prHeader = await this.prisma.purchaseRequestHeader.create({
        data: {
          projectId,
          requestNumber: `PR-${Date.now()}`,
          requestedBy: userId,
          items: {
            create: prItems,
          },
        },
        include: { items: true },
      });

      await this.audit.logAction(prHeader.id, 'PURCHASE_REQUEST', 'CREATE', userId, prHeader);
    }

    await this.audit.logAction(mrpRun.id, 'MRP_RUN', 'EXECUTE', userId, mrpRun);
    return this.prisma.mrpRun.findUnique({
      where: { id: mrpRun.id },
      include: { exceptions: true },
    });
  }

  // ================= PR MANAGEMENT =================
  async getPurchaseRequests(projectId: string) {
    return this.prisma.purchaseRequestHeader.findMany({
      where: { projectId },
      include: { items: { include: { material: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMrpRuns(projectId: string) {
    return this.prisma.mrpRun.findMany({
      where: { projectId },
      include: { exceptions: { include: { material: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

