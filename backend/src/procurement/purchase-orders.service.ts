import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoDto } from './dto/create-po.dto';
import { PurchaseOrderStatus, ProjectStatus, ApprovalStatus } from '@prisma/client';
import { SequenceEngine } from '../common/sequence.engine';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceEngine: SequenceEngine
  ) {}

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

      // Phase validation removed to allow independent progression

      // 2. Business Rule: Strict BOM Gate - Removed
      // Allow PO creation without any BOM validation for flexibility

      let finalPoNumber = dto.poNumber;
      if (!finalPoNumber || finalPoNumber.trim() === '') {
        finalPoNumber = await this.sequenceEngine.generateNextNumber('PO');
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
          poNumber: finalPoNumber,
          documentNumber: finalPoNumber,
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
              dimensions: item.dimensions,
              hsnCode: item.hsnCode,
              gstPercent: item.gstPercent,
              uom: item.uom,
              discount: item.discount,
              cgst: item.cgst,
              sgst: item.sgst,
              basicValue: item.basicValue,
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
          description: `Purchase Order ${finalPoNumber} issued to Vendor. Value: ₹${totalAmount}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return poHeader;
    });
  }

  async getPurchaseOrders(projectId: string) {
    return this.prisma.purchaseOrderHeader.findMany({
      where: { projectId },
      include: { 
        vendor: true, 
        items: { include: { material: true } },
        goodsReceiptHeaders: {
          include: {
            items: {
              include: {
                poItem: {
                  include: {
                    material: true
                  }
                }
              }
            }
          }
        }
      },
    });
  }

  async updatePo(projectId: string, poId: string, dto: CreatePoDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrderHeader.findUniqueOrThrow({
        where: { id: poId, projectId }
      });

      if (po.status !== 'DRAFT' && po.status !== 'ON_HOLD') {
        throw new BadRequestException('Only DRAFT or ON_HOLD purchase orders can be edited.');
      }

      // Calculate total po amount
      let totalAmount = 0;
      for (const item of dto.items) {
        totalAmount += item.orderedQty * item.agreedRate;
      }

      // Delete existing items
      await tx.purchaseOrderItem.deleteMany({
        where: { poHeaderId: poId }
      });

      // Update PO Header
      const updatedPoHeader = await tx.purchaseOrderHeader.update({
        where: { id: poId },
        data: {
          vendorId: dto.vendorId,
          poNumber: dto.poNumber,
          documentNumber: dto.poNumber,
          totalAmount,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          remarks: dto.remarks,
          updatedBy: userId,
        },
      });

      // Create new PO Items
      await Promise.all(
        dto.items.map((item) =>
          tx.purchaseOrderItem.create({
            data: {
              poHeaderId: updatedPoHeader.id,
              materialId: item.materialId,
              orderedQty: item.orderedQty,
              agreedRate: item.agreedRate,
              lineTotal: item.orderedQty * item.agreedRate,
              dimensions: item.dimensions,
              hsnCode: item.hsnCode,
              gstPercent: item.gstPercent,
              uom: item.uom,
              discount: item.discount,
              cgst: item.cgst,
              sgst: item.sgst,
              basicValue: item.basicValue,
              remarks: item.remarks,
              createdBy: userId,
              updatedBy: userId,
            },
          })
        )
      );

      // Log activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'PO_UPDATED',
          description: `Purchase Order ${dto.poNumber} was modified. New Value: ₹${totalAmount}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return updatedPoHeader;
    });
  }

  async issuePo(projectId: string, poId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrderHeader.findUniqueOrThrow({
        where: { id: poId, projectId }
      });
      
      if (po.status !== 'ON_HOLD' && po.status !== 'DRAFT') {
        throw new BadRequestException('Only DRAFT or ON_HOLD purchase orders can be issued.');
      }
      
      return tx.purchaseOrderHeader.update({
        where: { id: poId },
        data: {
          status: 'ISSUED',
          updatedBy: userId
        }
      });
    });
  }

  async deletePo(projectId: string, poId: string) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrderHeader.findUniqueOrThrow({
        where: { id: poId, projectId }
      });
      
      if (po.status === 'PARTIAL_RECEIPT' || po.status === 'CLOSED') {
        throw new BadRequestException('Cannot delete a purchase order that has been received or closed.');
      }
      
      // Delete items first due to foreign key
      await tx.purchaseOrderItem.deleteMany({
        where: { poHeaderId: poId }
      });

      return tx.purchaseOrderHeader.delete({
        where: { id: poId }
      });
    });
  }
}
