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
      
      let vendorId = dto.vendorId;
      if (!vendorId) {
        // Auto-PO vendor selection: Pick a default vendor if not provided
        const defaultVendor = await tx.vendor.findFirst({
          where: { vendorType: 'MATERIAL_SUPPLIER' }
        });
        if (!defaultVendor) throw new BadRequestException('No default vendor available for auto-PO.');
        vendorId = defaultVendor.id;
      }

      if (project.currentStage !== ProjectStatus.PROCUREMENT) {
        throw new BadRequestException('Purchase Orders can only be generated during the Procurement stage.');
      }

      // 2. Business Rule: Strict BOM Gate
      const activeBom = await tx.billOfMaterialHeader.findFirst({
        where: { projectId, status: 'APPROVED' },
        include: { items: true },
        orderBy: { revision: 'desc' }
      });

      if (!activeBom) {
        throw new BadRequestException('Procurement Gate Failed: Cannot create Purchase Order without an Approved Engineering BOM.');
      }

      // Map required quantities from BOM
      const bomMaterialMap = new Map<string, number>();
      for (const item of activeBom.items) {
        const currentQty = bomMaterialMap.get(item.materialId) || 0;
        bomMaterialMap.set(item.materialId, currentQty + Number(item.requiredQty));
      }

      // 3. Validate requested PO Items against BOM and existing POs
      for (const item of dto.items) {
        if (!bomMaterialMap.has(item.materialId)) {
          throw new BadRequestException(`Procurement Gate Failed: Material ID ${item.materialId} is not approved in the Engineering BOM.`);
        }

        // Check if we are over-ordering
        const requiredQty = bomMaterialMap.get(item.materialId)!;
        
        const existingPoItems = await tx.purchaseOrderItem.findMany({
          where: {
            poHeader: { projectId, status: { notIn: ['DRAFT', 'CANCELLED'] } },
            materialId: item.materialId
          }
        });
        
        const alreadyOrdered = existingPoItems.reduce((sum, poItem) => sum + Number(poItem.orderedQty), 0);
        
        // Allow a 10% standard buffer for raw materials (standard lengths/plates)
        const maxAllowed = requiredQty * 1.1;
        
        if (alreadyOrdered + item.orderedQty > maxAllowed) {
          throw new BadRequestException(`Procurement Gate Failed: Quantity ${item.orderedQty} for material ${item.materialId} exceeds the maximum allowed BOM limit (Already ordered: ${alreadyOrdered}, Max Allowed: ${maxAllowed.toFixed(2)}).`);
        }
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
          vendorId: vendorId,
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
          description: `Purchase Order ${dto.poNumber} issued to Vendor. Value: ₹${totalAmount}`,
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
