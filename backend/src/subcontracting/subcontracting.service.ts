import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubcontractOrderDto } from './dto/create-subcontract-order.dto';
import { CreateSubcontractReceiptDto } from './dto/create-subcontract-receipt.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class SubcontractingService {
  constructor(private prisma: PrismaService) {}

  private generateNumber(prefix: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = randomBytes(2).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  async createOrder(projectId: string, dto: CreateSubcontractOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!project) throw new NotFoundException('Project not found');

      let totalEstimatedCost = 0;
      const orderItemsData = dto.items.map((item) => {
        const lineEstimatedCost = item.sentQty * item.rate;
        totalEstimatedCost += lineEstimatedCost;
        return {
          inventoryBatchId: item.inventoryBatchId,
          operationId: item.operationId,
          sentQty: item.sentQty,
          rate: item.rate,
          lineEstimatedCost,
          remarks: item.remarks,
        };
      });

      const challanNumber = this.generateNumber('SC');

      const order = await tx.subcontractOrder.create({
        data: {
          projectId,
          vendorId: dto.vendorId,
          challanNumber,
          documentNumber: dto.documentNumber,
          expectedReturnDate: dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null,
          totalEstimatedCost,
          status: 'ISSUED',
          remarks: dto.remarks,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
          vendor: true,
        },
      });

      // Update project timeline to PRODUCTION if not already
      if (
        project.currentStage === 'CREATED' ||
        project.currentStage === 'ENGINEERING' ||
        project.currentStage === 'PROCUREMENT' ||
        project.currentStage === 'MATERIAL_AVAILABLE'
      ) {
        await tx.project.update({
          where: { id: projectId },
          data: { currentStage: 'PRODUCTION' },
        });

        await tx.projectTimeline.create({
          data: {
            projectId,
            fromStage: project.currentStage,
            toStage: 'PRODUCTION',
            remarks: `Subcontract Order ${challanNumber} issued.`,
          },
        });
      }

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'SUBCONTRACT_ORDER_ISSUED',
          description: `Challan ${challanNumber} generated for Vendor.`,
        },
      });

      return order;
    });
  }

  async getOrders(projectId: string) {
    return this.prisma.subcontractOrder.findMany({
      where: { projectId },
      include: {
        vendor: true,
        items: {
          include: {
            operation: true,
            inventoryBatch: {
              include: {
                material: true,
              },
            },
          },
        },
        subcontractReceipts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReceipt(projectId: string, dto: CreateSubcontractReceiptDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.subcontractOrder.findUnique({
        where: { id: dto.subcontractOrderId },
        include: { items: { include: { inventoryBatch: { include: { material: true } } } } },
      });

      if (!order) throw new NotFoundException('Subcontract Order not found');

      const receiptNumber = this.generateNumber('SR');
      let totalProcessCost = 0;

      const receiptItemsData = dto.items.map((item) => {
        const orderItem = order.items.find((i) => i.id === item.orderItemId);
        if (!orderItem) throw new BadRequestException(`Order item ${item.orderItemId} not found`);

        const actualProcessCost = item.acceptedQty * item.actualRate;
        totalProcessCost += actualProcessCost;

        return {
          orderItemId: item.orderItemId,
          receivedQty: item.receivedQty,
          acceptedQty: item.acceptedQty,
          rejectedQty: item.rejectedQty,
          actualRate: item.actualRate,
          actualProcessCost,
          remarks: item.remarks,
          // Create new batch for accepted quantity
          inventoryBatches: {
            create: [
              {
                materialId: orderItem.inventoryBatch?.materialId || 'UNKNOWN_MATERIAL_SHOULD_NOT_HAPPEN', // We assume material exists
                grnItemId: orderItem.inventoryBatch?.grnItemId || 'UNKNOWN_GRN',
                batchNumber: `${orderItem.inventoryBatch?.batchNumber || 'B'}-S-${this.generateNumber('R').slice(-4)}`,
                heatNumber: orderItem.inventoryBatch?.heatNumber,
                receivedQty: item.acceptedQty,
                currentQty: item.acceptedQty,
                unitCost: (Number(orderItem.inventoryBatch?.unitCost) || 0) + (Number(item.actualRate) || 0),
                status: 'AVAILABLE',
              },
            ],
          },
        };
      });

      const receipt = await tx.subcontractReceipt.create({
        data: {
          projectId,
          subcontractOrderId: dto.subcontractOrderId,
          receiptNumber,
          documentNumber: dto.documentNumber,
          status: 'COMPLETED',
          remarks: dto.remarks,
          items: {
            create: receiptItemsData,
          },
        },
        include: {
          items: {
            include: {
              inventoryBatches: true,
            },
          },
        },
      });

      // Update Order Status
      await tx.subcontractOrder.update({
        where: { id: dto.subcontractOrderId },
        data: { status: 'CLOSED' },
      });

      // Costing Event
      await tx.projectCostEvent.create({
        data: {
          projectId,
          costType: 'OUTSIDE_PROCESS',
          description: `Subcontract Receipt ${receiptNumber}`,
          amount: totalProcessCost,
          referenceDocType: 'SUBCONTRACT_RECEIPT',
          referenceDocId: receipt.id,
        },
      });

      // Update Cost Summary
      const costSummary = await tx.projectCostSummary.findUnique({ where: { projectId } });
      if (costSummary) {
        const newCost = Number(costSummary.outsideProcessCost) + totalProcessCost;
        const newTotal = Number(costSummary.totalCost) + totalProcessCost;
        const newProfit = Number(costSummary.revenue) - newTotal;
        await tx.projectCostSummary.update({
          where: { projectId },
          data: {
            outsideProcessCost: newCost,
            totalCost: newTotal,
            profitability: newProfit,
          },
        });
      }

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'SUBCONTRACT_RECEIPT',
          description: `Receipt ${receiptNumber} processed. Cost: ₹${totalProcessCost}`,
        },
      });

      return receipt;
    });
  }

  async getReceipts(projectId: string) {
    return this.prisma.subcontractReceipt.findMany({
      where: { projectId },
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                operation: true,
              },
            },
            inventoryBatches: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
