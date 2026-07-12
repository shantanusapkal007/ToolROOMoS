// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoDto } from './dto/create-po.dto';
import { PurchaseOrderStatus, ApprovalStatus } from '@prisma/client';
import { EventBus } from '../platform/event.bus';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus
  ) {}

  async createPo(projectId: string, dto: CreatePoDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      
      // Strict Document Lifecycle: Require APPROVED PR
      if (!dto.purchaseRequestId) {
        throw new BadRequestException('PO generation failed: A Purchase Request ID is required.');
      }

      const pr = await tx.purchaseRequestHeader.findUnique({
        where: { id: dto.purchaseRequestId }
      });

      if (!pr) {
        throw new BadRequestException(`Purchase Request ${dto.purchaseRequestId} not found.`);
      }

      if (pr.status !== 'APPROVED') {
        throw new BadRequestException(`Purchase Request must be APPROVED to generate a PO. Current status: ${pr.status}`);
      }

      let vendorId = dto.vendorId;
      if (!vendorId) {
        const defaultVendor = await tx.vendor.findFirst({
          where: { vendorType: 'MATERIAL_SUPPLIER' }
        });
        if (defaultVendor) {
          vendorId = defaultVendor.id;
        }
      }

      // Calculate total po amount
      let totalAmount = 0;
      for (const item of dto.items) {
        const rate = item.agreedRate || 0;
        const lineTotal = item.orderedQty * rate;
        const discount = Number((item as any).discount || 0);
        totalAmount += lineTotal - discount;
      }

      const freight = Number((dto as any).freight || 0);
      totalAmount += freight;

      // Create PO Header
      const poHeader = await tx.purchaseOrderHeader.create({
        data: {
          projectId,
          vendorId: vendorId,
          purchaseRequestId: dto.purchaseRequestId,
          poNumber: dto.poNumber,
          documentNumber: dto.poNumber,
          totalAmount,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
          vendorGstNumber: dto.vendorGstNumber,
          costCentre: dto.costCentre,
          gstPercent: dto.gstPercent ? Number(dto.gstPercent) : null,
          hsnCode: dto.hsnCode,
          discount: dto.discount ? Number(dto.discount) : 0,
          freight: dto.freight ? Number(dto.freight) : 0,
          customFields: dto.customFields,
          status: PurchaseOrderStatus.DRAFT,
          approvalStatus: ApprovalStatus.PENDING,
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Create PO Items
      await Promise.all(
        dto.items.map((item) =>
          tx.purchaseOrderItem.create({
            data: {
              poHeaderId: poHeader.id,
              materialId: item.materialId,
              orderedQty: item.orderedQty,
              agreedRate: item.agreedRate || 0,
              lineTotal: item.orderedQty * (item.agreedRate || 0),
              dimensions: item.dimensions,
              gstPercent: item.gstPercent ? Number(item.gstPercent) : null,
              hsnCode: item.hsnCode,
              heatNumber: item.heatNumber,
              millCertificate: item.millCertificate,
              discount: item.discount ? Number(item.discount) : 0,
              customFields: item.customFields,
              remarks: item.remarks,
              createdBy: userId,
              updatedBy: userId,
            },
          })
        )
      );

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'PO_GENERATED',
          description: `Purchase Order ${dto.poNumber} issued to Vendor for PR ${pr.prNumber}. Value: ${totalAmount}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return poHeader;
    });
  }

  async approvePo(poId: string, userId?: string) {
    const po = await this.prisma.purchaseOrderHeader.update({
      where: { id: poId },
      data: {
        approvalStatus: 'APPROVED',
        status: 'ISSUED',
        updatedBy: userId
      }
    });

    this.eventBus.emit('PurchaseOrderCreated', {
      poId: po.id,
      poNumber: po.poNumber,
      projectId: po.projectId,
      vendorId: po.vendorId,
      totalAmount: po.totalAmount
    });

    return po;
  }

  async updatePo(projectId: string, poId: string, dto: any, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrderHeader.findUniqueOrThrow({
        where: { id: poId, projectId }
      });

      let totalAmount: any = po.totalAmount;
      if (dto.items && Array.isArray(dto.items)) {
        totalAmount = 0;
        for (const item of dto.items) {
          const rate = item.agreedRate || 0;
          const lineTotal = item.orderedQty * rate;
          const discount = Number(item.discount || 0);
          totalAmount += lineTotal - discount;
        }
        totalAmount += Number(dto.freight || 0);

        await tx.purchaseOrderItem.deleteMany({ where: { poHeaderId: poId } });
        await Promise.all(
          dto.items.map((item: any) =>
            tx.purchaseOrderItem.create({
              data: {
                poHeaderId: poId,
                materialId: item.materialId,
                orderedQty: item.orderedQty,
                agreedRate: item.agreedRate || 0,
                lineTotal: item.orderedQty * (item.agreedRate || 0),
                remarks: item.remarks,
                createdBy: userId,
                updatedBy: userId,
              },
            })
          )
        );
      }

      const updated = await tx.purchaseOrderHeader.update({
        where: { id: poId },
        data: {
          vendorId: dto.vendorId !== undefined ? dto.vendorId : undefined,
          remarks: dto.remarks !== undefined ? dto.remarks : undefined,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
          totalAmount: totalAmount,
          updatedBy: userId,
        }
      });

      return updated;
    });
  }

  async deletePo(projectId: string, poId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrderHeader.findUniqueOrThrow({
        where: { id: poId, projectId },
        include: { goodsReceiptHeaders: true }
      });

      if (po.goodsReceiptHeaders && po.goodsReceiptHeaders.length > 0) {
        throw new BadRequestException(`Cannot delete Purchase Order. Referenced by GRN: ${po.goodsReceiptHeaders.map(g => g.grnNumber).join(', ')}`);
      }

      await tx.purchaseOrderItem.deleteMany({ where: { poHeaderId: poId } });
      const deleted = await tx.purchaseOrderHeader.delete({ where: { id: poId } });

      return deleted;
    });
  }
}
