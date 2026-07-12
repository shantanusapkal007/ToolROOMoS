import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBus } from '../platform/event.bus';
import { AuditEngine } from '../platform/audit.engine';

/**
 * @deprecated Use specific domain services (PurchaseOrdersService, GoodsReceiptsService, VendorBillsService, PurchaseRequestsService)
 */
@Injectable()
export class ProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
  ) {}

  // ================= PURCHASE ORDERS =================
  async getPurchaseOrders(query: any = {}) {
    const where: any = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.status) where.status = query.status;

    return this.prisma.purchaseOrderHeader.findMany({
      where,
      include: {
        vendor: true,
        project: true,
        items: { include: { material: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPurchaseOrderFromRequest(projectId: string, prHeaderId: string, vendorId: string, userId: string = 'SYSTEM') {
    const prHeader = await this.prisma.purchaseRequestHeader.findUnique({
      where: { id: prHeaderId },
      include: { items: true },
    });

    if (!prHeader) throw new BadRequestException('Purchase Request not found');
    if (prHeader.status !== 'APPROVED' && prHeader.status !== 'DRAFT') {
      throw new BadRequestException('Purchase Request is already processed or closed');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create PO Header
      const poHeader = await tx.purchaseOrderHeader.create({
        data: {
          projectId,
          vendorId,
          poNumber: `PO-${Date.now()}`,
          createdBy: userId,
          items: {
            create: prHeader.items.map(item => ({
              materialId: item.materialId,
              orderedQty: item.requiredQuantity, // In a real scenario, buyer might adjust this
              agreedRate: 0, // Rate mapped from Vendor/Material or manually entered later
              prItemId: item.id,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Update PR Status
      await tx.purchaseRequestHeader.update({
        where: { id: prHeaderId },
        data: { status: 'PO_CREATED' },
      });

      await this.audit.logAction(poHeader.id, 'PURCHASE_ORDER', 'CREATE', userId, poHeader);
      return poHeader;
    });
  }

  // ================= VENDOR BILLS =================
  async getVendorBills(poHeaderId: string) {
    return this.prisma.vendorBill.findMany({
      where: { poHeaderId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVendorBill(poHeaderId: string, data: any, userId: string = 'SYSTEM') {
    const bill = await this.prisma.vendorBill.create({
      data: { ...data, poHeaderId, createdBy: userId },
    });
    await this.audit.logAction(bill.id, 'VENDOR_BILL', 'CREATE', userId, bill);
    return bill;
  }

  // ================= PURCHASE RETURNS =================
  async getPurchaseReturns(vendorId: string) {
    return this.prisma.purchaseReturn.findMany({
      where: { vendorId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPurchaseReturn(vendorId: string, poHeaderId: string, data: any, userId: string = 'SYSTEM') {
    const ret = await this.prisma.purchaseReturn.create({
      data: { ...data, vendorId, poHeaderId },
    });
    await this.audit.logAction(ret.id, 'PURCHASE_RETURN', 'CREATE', userId, ret);
    return ret;
  }
}
