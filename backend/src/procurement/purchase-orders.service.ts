import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoDto } from './dto/create-po.dto';
import { PurchaseOrderStatus, ProjectStatus, ApprovalStatus } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createPo(projectId: string, dto: CreatePoDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate project phase
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });

      if (project.currentStage !== ProjectStatus.PROCUREMENT) {
        throw new BadRequestException('Purchase Orders can only be generated during the Procurement stage.');
      }

      // Calculate total po amount
      let totalAmount = 0;
      for (const item of dto.items) {
        totalAmount += item.orderedQty * item.agreedRate;
      }

      // 2. Create PO Header
      const poHeader = await tx.purchaseOrderHeader.create({
        data: {
          projectId,
          vendorId: dto.vendorId,
          poNumber: dto.poNumber,
          documentNumber: dto.poNumber,
          totalAmount,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          status: PurchaseOrderStatus.ISSUED,
          approvalStatus: ApprovalStatus.APPROVED, // Auto-approved for this flow
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. Create PO Items
      await Promise.all(
        dto.items.map((item) =>
          tx.purchaseOrderItem.create({
            data: {
              poHeaderId: poHeader.id,
              materialId: item.materialId,
              orderedQty: item.orderedQty,
              agreedRate: item.agreedRate,
              lineTotal: item.orderedQty * item.agreedRate,
              remarks: item.remarks,
              createdBy: userId,
              updatedBy: userId,
            },
          })
        )
      );

      // 4. Log activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'PO_GENERATED',
          description: `Purchase Order ${dto.poNumber} issued to Vendor. Value: $${totalAmount}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return poHeader;
    });
  }

  async getPurchaseOrders(projectId: string) {
    return this.prisma.purchaseOrderHeader.findMany({
      where: { projectId },
      include: { vendor: true, items: { include: { material: true } } },
    });
  }
}
