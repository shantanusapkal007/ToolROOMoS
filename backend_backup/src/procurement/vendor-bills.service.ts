// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../platform/event.bus';

@Injectable()
export class VendorBillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus
  ) {}

  async createVendorBill(projectId: string, dto: any, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      let poHeaderId = dto.poHeaderId;
      if (!poHeaderId) {
        throw new BadRequestException('PO Header ID is required for a Vendor Bill.');
      }

      const po = await tx.purchaseOrderHeader.findUnique({
        where: { id: poHeaderId, projectId },
        include: { items: true }
      });

      if (!po) {
        throw new BadRequestException('Invalid Purchase Order provided for this project.');
      }

      const existingBill = await tx.vendorBill.findUnique({
        where: { billNumber: dto.billNumber }
      });
      if (existingBill) {
        throw new BadRequestException('Vendor Bill with this number already exists.');
      }

      let calculatedTotal = 0;
      let calculatedGst = 0;

      const billItemsData = dto.items.map((item: any) => {
        const rate = item.rate || 0;
        const lineTotal = item.billedQty * rate;
        const discount = Number(item.discount || 0);
        const gst = Number(item.gstPercent || 0);
        const lineTotalAfterDiscount = lineTotal - discount;
        const lineGst = lineTotalAfterDiscount * (gst / 100);

        calculatedTotal += lineTotalAfterDiscount + lineGst;
        calculatedGst += lineGst;

        return {
          materialId: item.materialId,
          poItemId: item.poItemId,
          billedQty: item.billedQty,
          rate: rate,
          discount: discount,
          gstPercent: gst,
          lineTotal: lineTotalAfterDiscount + lineGst,
          remarks: item.remarks
        };
      });

      const bill = await tx.vendorBill.create({
        data: {
          projectId,
          vendorId: po.vendorId,
          poHeaderId: po.id,
          billNumber: dto.billNumber,
          billDate: new Date(dto.billDate),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          totalAmount: calculatedTotal,
          gstAmount: calculatedGst,
          status: 'PENDING',
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
          items: {
            create: billItemsData
          }
        },
        include: { items: true }
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'VENDOR_BILL_CREATED',
          description: `Vendor Bill ${bill.billNumber} created for PO ${po.poNumber}. Total: ${calculatedTotal}`,
          performedBy: userId || 'SYSTEM',
        }
      });

      return bill;
    });
  }

  async getVendorBills(projectId: string) {
    return this.prisma.vendorBill.findMany({
      where: { projectId },
      include: {
        vendor: true,
        poHeader: true,
        items: {
          include: { material: true }
        }
      }
    });
  }

  async approveVendorBill(projectId: string, billId: string, userId?: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const bill = await tx.vendorBill.findUniqueOrThrow({
        where: { id: billId, projectId }
      });

      if (bill.status !== 'PENDING') {
        throw new BadRequestException('Only PENDING bills can be approved.');
      }

      const updatedBill = await tx.vendorBill.update({
        where: { id: billId },
        data: { status: 'APPROVED', updatedBy: userId }
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'VENDOR_BILL_APPROVED',
          description: `Vendor Bill ${bill.billNumber} approved.`,
          performedBy: userId || 'SYSTEM',
        }
      });

      return updatedBill;
    });

    // Event-driven decoupling: Let Cost Engine / Finance handle the ledger update
    this.eventBus.emit('VendorBillRegistered', {
      vendorBillId: updated.id,
      billNumber: updated.billNumber,
      projectId: updated.projectId,
      vendorId: updated.vendorId,
      totalAmount: updated.totalAmount,
      approvedBy: userId
    });

    return updated;
  }
}
