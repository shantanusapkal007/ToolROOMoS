// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrnDto } from './dto/create-grn.dto';
import { EventBus } from '../platform/event.bus';

@Injectable()
export class GoodsReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus
  ) {}

  async createGrn(projectId: string, dto: CreateGrnDto, userId?: string) {
    const grnResult = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      
      const po = await tx.purchaseOrderHeader.findUnique({ where: { id: dto.poHeaderId } });
      if (!po || (po.status !== 'ISSUED' && po.status !== 'PARTIAL_RECEIPT' && po.status !== 'DRAFT')) {
        throw new BadRequestException('GRN requires a valid Purchase Order reference (DRAFT, ISSUED, or PARTIAL_RECEIPT).');
      }

      const warehouse = dto.warehouseId
        ? await tx.warehouse.findUniqueOrThrow({ where: { id: dto.warehouseId } })
        : await tx.warehouse.findFirst({ where: { warehouseCode: 'DEFAULT-WH' } });

      if (!warehouse) {
        throw new BadRequestException('Warehouse not found. Please ensure a default warehouse (DEFAULT-WH) is configured, or provide a warehouseId.');
      }

      const grnHeader = await tx.goodsReceiptHeader.create({
        data: {
          projectId,
          poHeaderId: dto.poHeaderId,
          grnNumber: dto.grnNumber,
          documentNumber: dto.grnNumber,
          vendorInvoiceNumber: dto.vendorInvoiceNumber || dto.supplierChallan,
          invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : null,
          customFields: dto.customFields,
          status: 'COMPLETED',
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      let totalGrnValue = 0;
      const createdItems = [];

      for (const item of dto.items) {
        if (!item.heatNumber || item.heatNumber.trim() === '') {
          throw new BadRequestException(`GRN Gate Failed: Heat Number (Mill Test Certificate) is strictly required for material traceability.`);
        }

        const poItem = await tx.purchaseOrderItem.findUniqueOrThrow({
          where: { id: item.poItemId },
        });

        const remainingQty = Number(poItem.orderedQty) - Number(poItem.receivedQty);
        const incomingQty = Number(item.acceptedQty) + Number(item.rejectedQty || 0);

        const itemCost = item.acceptedQty * item.actualRate;
        totalGrnValue += itemCost;

        const grnItem = await tx.goodsReceiptItem.create({
          data: {
            grnHeaderId: grnHeader.id,
            poItemId: item.poItemId,
            receivedQty: incomingQty,
            acceptedQty: item.acceptedQty,
            rejectedQty: item.rejectedQty || 0,
            heatNumber: item.heatNumber,
            batchNumber: item.batchNumber,
            hsnCode: item.hsnCode,
            gstPercent: item.gstPercent ? Number(item.gstPercent) : null,
            warehouseId: item.warehouseId,
            rackLocation: item.rackLocation,
            binLocation: item.binLocation,
            actualRate: item.actualRate,
            actualMaterialCost: itemCost,
            customFields: item.customFields,
            remarks: item.remarks,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        await tx.purchaseOrderItem.update({
          where: { id: item.poItemId },
          data: {
            receivedQty: { increment: incomingQty },
            status: Number(poItem.receivedQty) + incomingQty >= Number(poItem.orderedQty) ? 'FULFILLED' : 'PARTIAL'
          }
        });

        createdItems.push({
          grnItem,
          poItem,
          warehouse
        });
      }

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'MATERIAL_RECEIVED',
          description: `GRN ${dto.grnNumber} completed. Actual Material Cost booked: ₹${totalGrnValue.toFixed(2)}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return { grnHeader, createdItems, totalGrnValue };
    });

    // Decoupled Logic: Emit Event for Inventory and Costing to process
    this.eventBus.emit('GoodsReceiptCreated', {
      grnHeaderId: grnResult.grnHeader.id,
      grnNumber: grnResult.grnHeader.grnNumber,
      projectId,
      totalGrnValue: grnResult.totalGrnValue,
      items: grnResult.createdItems,
      userId
    });

    return grnResult.grnHeader;
  }

  async getGoodsReceipts(projectId: string) {
    return this.prisma.goodsReceiptHeader.findMany({
      where: { projectId },
      include: { items: { include: { poItem: { include: { material: true } } } } },
    });
  }
}
