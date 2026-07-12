// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBus } from '../../platform/event.bus';
import { AuditEngine } from '../../platform/audit.engine';

@Injectable()
export class MaterialIssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
  ) {}

  async getMaterialIssues(projectId?: string) {
    const where = projectId ? { projectId } : {};
    return this.prisma.materialIssueHeader.findMany({
      where,
      include: {
        project: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMaterialIssue(projectId: string, departmentId: string, items: any[], userId: string = 'SYSTEM') {
    const issueResult = await this.prisma.$transaction(async (tx) => {
      // 1. Create Issue Header
      const issueHeader = await tx.materialIssueHeader.create({
        data: {
          projectId,
          departmentId,
          issueNumber: `ISS-${Date.now()}`,
          issuedBy: userId,
          items: {
            create: items.map(item => ({
              materialId: item.materialId,
              issuedQty: item.issuedQty,
              inventoryBatchId: item.inventoryBatchId,
            })),
          },
        },
        include: { items: true },
      });

      let totalIssueValue = 0;
      const processedItems = [];

      for (const item of issueHeader.items) {
        // Find warehouse for this batch
        const batch = await tx.inventoryBatch.findUnique({
          where: { id: item.inventoryBatchId },
          include: { grnItem: true },
        });

        if (!batch) throw new BadRequestException(`Batch ${item.inventoryBatchId} not found`);
        
        // Use default MAIN_WH if missing
        const warehouseId = batch.grnItem?.warehouseId || 'MAIN_WH';
        const materialId = batch.materialId;

        if (batch.availableQty < item.issuedQty) {
          throw new BadRequestException(`Insufficient stock in Batch ${batch.batchNumber}`);
        }

        // 2. Decrement Batch Available Qty
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: { availableQty: { decrement: item.issuedQty }, currentQty: { decrement: item.issuedQty } },
        });

        // 3. Decrement Global Stock
        await tx.inventoryStock.update({
          where: { materialId_warehouseId: { materialId, warehouseId } },
          data: {
            currentQuantity: { decrement: item.issuedQty },
            availableQuantity: { decrement: item.issuedQty },
          },
        });

        // 4. Log Inventory Transaction (OUT)
        await tx.inventoryTransaction.create({
          data: {
            projectId,
            inventoryBatchId: batch.id,
            movementType: 'MATERIAL_ISSUE',
            quantity: -Math.abs(Number(item.issuedQty)),
            referenceDocType: 'ISSUE',
            referenceDocId: issueHeader.id,
            remarks: `Issued to project`,
            createdBy: userId,
          },
        });

        const itemCost = Number(item.issuedQty) * Number(batch.unitCost || 0);
        totalIssueValue += itemCost;

        processedItems.push({
          issueItem: item,
          batch,
          itemCost,
        });
      }

      await this.audit.logAction(issueHeader.id, 'MATERIAL_ISSUE', 'CREATE', userId, issueHeader);
      
      return { issueHeader, totalIssueValue, processedItems };
    });

    // 5. Emit Domain Event (Cost Engine listens to this)
    this.eventBus.emit('MaterialIssued', {
      issueHeaderId: issueResult.issueHeader.id,
      issueNumber: issueResult.issueHeader.issueNumber,
      projectId,
      departmentId,
      totalIssueValue: issueResult.totalIssueValue,
      items: issueResult.processedItems,
      userId,
    });

    return issueResult.issueHeader;
  }
}
