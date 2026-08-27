import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SequenceEngine } from '../../common/sequence.engine';
import { CreatePrnDto, PrnPriority, PrnCategory } from './dto/create-prn.dto';
import { UpdatePrnDto } from './dto/update-prn.dto';
import { ApprovePrnDto } from './dto/approve-prn.dto';
import { RejectPrnDto } from './dto/reject-prn.dto';
import { ConvertPrnToPoDto } from './dto/convert-to-po.dto';
import { ApprovalStatus, PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class PurchaseRequisitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceEngine: SequenceEngine,
  ) {}

  /**
   * Create a new Purchase Requisition Note (PRN)
   */
  async createPrn(dto: CreatePrnDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required to create a Purchase Requisition.');
    }

    // Verify project if projectId provided
    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });
      if (!project) {
        throw new NotFoundException(`Project with ID ${dto.projectId} not found.`);
      }
    }

    // Generate authentic PRN number (e.g. PRN-2026-0001)
    const prNumber = await this.sequenceEngine.generateNextNumber('PRN');

    // Calculate item and header totals
    let totalAmount = 0;
    const itemsData = dto.items.map((item) => {
      const qty = Number(item.requiredQuantity) || 1;
      const rate = Number(item.estimatedRate) || 0;
      const lineTotal = Number((qty * rate).toFixed(2));
      totalAmount += lineTotal;

      return {
        materialId: item.materialId || null,
        itemCode: item.itemCode || null,
        itemName: item.itemName || item.materialGrade || 'Raw Material / Component',
        materialGrade: item.materialGrade || null,
        dimensions: item.dimensions || item.rawSize || null,
        rawSize: item.rawSize || item.dimensions || null,
        requiredQuantity: qty,
        orderedQty: 0,
        uom: (item.uom || 'PCS').toUpperCase(),
        estimatedRate: rate,
        estimatedTotal: lineTotal,
        detNo: item.detNo || null,
        suggestedVendor: item.suggestedVendor || null,
        remarks: item.remarks || null,
        status: 'PENDING',
        customFields: item.customFields || {},
      };
    });

    return await this.prisma.$transaction(async (tx) => {
      const prHeader = await tx.purchaseRequestHeader.create({
        data: {
          prNumber,
          projectId: dto.projectId || null,
          department: dto.department || 'Stores / Tool Crib',
          requestedBy: dto.requestedBy || 'Storekeeper',
          requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : null,
          priority: dto.priority || PrnPriority.NORMAL,
          category: dto.category || PrnCategory.RAW_MATERIAL,
          status: 'DRAFT',
          approvalStatus: ApprovalStatus.PENDING,
          purpose: dto.purpose || null,
          remarks: dto.remarks || null,
          estimatedTotalAmount: totalAmount,
          customFields: dto.customFields || {},
          createdBy: userId || null,
          items: {
            create: itemsData,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              projectNumber: true,
              partName: true,
              customer: { select: { companyName: true } },
            },
          },
          items: {
            include: {
              material: true,
            },
          },
        },
      });

      return prHeader;
    });
  }

  /**
   * One-click create PRN from Project Bill of Materials (BOM)
   */
  async createFromBom(
    projectId: string,
    bomItemIds?: string[],
    department = 'Engineering / Tooling',
    requestedBy = 'Design Engineer',
    userId?: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        customer: true,
        billOfMaterialHeaders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found.`);
    }

    const latestBom = project.billOfMaterialHeaders[0];
    if (!latestBom || !latestBom.items || latestBom.items.length === 0) {
      throw new BadRequestException(`No BOM items found for project ${project.projectNumber}.`);
    }

    // Filter items if specific IDs requested
    let targetItems = latestBom.items;
    if (bomItemIds && bomItemIds.length > 0) {
      targetItems = latestBom.items.filter((item) => bomItemIds.includes(item.id));
    }

    if (targetItems.length === 0) {
      throw new BadRequestException('No eligible BOM items selected for requisition.');
    }

    const prNumber = await this.sequenceEngine.generateNextNumber('PRN');

    let totalAmount = 0;
    const itemsData = targetItems.map((item, index) => {
      const custom = (item.customFields as any) || {};
      const qty = Number(item.requiredQty) || 1;
      const rate = Number(item.estimatedCost) || Number(item.material?.standardCost) || 0;
      const lineTotal = Number((qty * rate).toFixed(2));
      totalAmount += lineTotal;

      return {
        materialId: item.materialId || null,
        itemCode: custom.detNo || `DET-${index + 1}`,
        itemName: custom.partName || item.remarks || item.material?.materialGrade || 'Tool Component',
        materialGrade: item.material?.materialGrade || 'Steel Material',
        dimensions: item.dimensions || item.rawSize || custom.size || null,
        rawSize: item.rawSize || item.dimensions || null,
        requiredQuantity: qty,
        orderedQty: 0,
        uom: (item.material?.defaultUom || 'PCS').toUpperCase(),
        estimatedRate: rate,
        estimatedTotal: lineTotal,
        detNo: custom.detNo || `${index + 1}`,
        suggestedVendor: null,
        remarks: item.remarks || `BOM Part for ${project.projectNumber}`,
        status: 'PENDING',
        customFields: {
          bomItemId: item.id,
          calculatedWeight: item.calculatedWeight ? Number(item.calculatedWeight) : 0,
        },
      };
    });

    return await this.prisma.$transaction(async (tx) => {
      const prHeader = await tx.purchaseRequestHeader.create({
        data: {
          prNumber,
          projectId: project.id,
          department,
          requestedBy,
          priority: PrnPriority.NORMAL,
          category: PrnCategory.RAW_MATERIAL,
          status: 'DRAFT',
          approvalStatus: ApprovalStatus.PENDING,
          purpose: `BOM Material Requisition for Tool ${project.projectNumber} (${project.partName || 'Tooling'})`,
          estimatedTotalAmount: totalAmount,
          createdBy: userId || null,
          items: {
            create: itemsData,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              projectNumber: true,
              partName: true,
              customer: { select: { companyName: true } },
            },
          },
          items: {
            include: {
              material: true,
            },
          },
        },
      });

      return prHeader;
    });
  }

  /**
   * List PRNs with filtering, search, and pagination
   */
  async listPrns(params: {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    projectId?: string;
    department?: string;
  }) {
    const { search, status, priority, category, projectId, department } = params;

    const where: any = {};

    if (status) {
      if (status === 'PENDING') {
        where.status = { in: ['DRAFT', 'SUBMITTED', 'PENDING'] };
      } else if (status === 'CONVERTED') {
        where.status = { in: ['PO_CREATED', 'PARTIALLY_CONVERTED', 'CLOSED'] };
      } else {
        where.status = status;
      }
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { prNumber: { contains: search, mode: 'insensitive' } },
        { requestedBy: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } },
        { project: { projectNumber: { contains: search, mode: 'insensitive' } } },
        { project: { partName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const prns = await this.prisma.purchaseRequestHeader.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            partName: true,
            customer: { select: { companyName: true } },
          },
        },
        items: {
          include: {
            material: true,
          },
        },
        purchaseOrders: {
          select: {
            id: true,
            poNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            vendor: { select: { vendorName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return prns;
  }

  /**
   * Get Summary KPIs for dashboard & PRN header strip
   */
  async getSummary(projectId?: string) {
    const where: any = projectId ? { projectId } : {};

    const [allPrns, urgentCount] = await Promise.all([
      this.prisma.purchaseRequestHeader.findMany({
        where,
        select: {
          id: true,
          status: true,
          priority: true,
          estimatedTotalAmount: true,
        },
      }),
      this.prisma.purchaseRequestHeader.count({
        where: {
          ...where,
          priority: { in: ['URGENT', 'CRITICAL'] },
        },
      }),
    ]);

    let totalEstimatedValue = 0;
    let pendingApproval = 0;
    let approved = 0;
    let convertedToPo = 0;
    let draftCount = 0;

    allPrns.forEach((p) => {
      totalEstimatedValue += Number(p.estimatedTotalAmount || 0);
      const st = (p.status || '').toUpperCase();
      if (st === 'DRAFT') draftCount++;
      if (st === 'SUBMITTED' || st === 'PENDING') pendingApproval++;
      if (st === 'APPROVED') approved++;
      if (st === 'PO_CREATED' || st === 'PARTIALLY_CONVERTED' || st === 'CLOSED') convertedToPo++;
    });

    return {
      totalCount: allPrns.length,
      draftCount,
      pendingApproval,
      approved,
      convertedToPo,
      urgentCount,
      totalEstimatedValue: Number(totalEstimatedValue.toFixed(2)),
    };
  }

  /**
   * Get single PRN by ID with full item details and relations
   */
  async getPrnById(id: string) {
    const prn = await this.prisma.purchaseRequestHeader.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            customer: true,
          },
        },
        items: {
          include: {
            material: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        purchaseOrders: {
          include: {
            vendor: true,
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!prn) {
      throw new NotFoundException(`Purchase Requisition Note with ID ${id} not found.`);
    }

    return prn;
  }

  /**
   * Update PRN details (allowed in DRAFT or SUBMITTED status)
   */
  async updatePrn(id: string, dto: UpdatePrnDto, userId?: string) {
    const existing = await this.prisma.purchaseRequestHeader.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new NotFoundException(`Purchase Requisition with ID ${id} not found.`);
    }

    if (existing.status === 'PO_CREATED' || existing.status === 'CLOSED') {
      throw new BadRequestException('Cannot edit a Purchase Requisition that has already been converted to Purchase Orders.');
    }

    return await this.prisma.$transaction(async (tx) => {
      let totalAmount = Number(existing.estimatedTotalAmount || 0);

      // If items array provided, replace items
      if (dto.items && dto.items.length > 0) {
        await tx.purchaseRequestItem.deleteMany({
          where: { prHeaderId: id },
        });

        totalAmount = 0;
        const itemsData = dto.items.map((item) => {
          const qty = Number(item.requiredQuantity) || 1;
          const rate = Number(item.estimatedRate) || 0;
          const lineTotal = Number((qty * rate).toFixed(2));
          totalAmount += lineTotal;

          return {
            prHeaderId: id,
            materialId: item.materialId || null,
            itemCode: item.itemCode || null,
            itemName: item.itemName || item.materialGrade || 'Component',
            materialGrade: item.materialGrade || null,
            dimensions: item.dimensions || item.rawSize || null,
            rawSize: item.rawSize || item.dimensions || null,
            requiredQuantity: qty,
            orderedQty: 0,
            uom: (item.uom || 'PCS').toUpperCase(),
            estimatedRate: rate,
            estimatedTotal: lineTotal,
            detNo: item.detNo || null,
            suggestedVendor: item.suggestedVendor || null,
            remarks: item.remarks || null,
            status: 'PENDING',
            customFields: item.customFields || {},
          };
        });

        await tx.purchaseRequestItem.createMany({
          data: itemsData,
        });
      }

      const updated = await tx.purchaseRequestHeader.update({
        where: { id },
        data: {
          projectId: dto.projectId !== undefined ? dto.projectId : existing.projectId,
          department: dto.department ?? existing.department,
          requestedBy: dto.requestedBy ?? existing.requestedBy,
          requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : existing.requiredDate,
          priority: dto.priority ?? existing.priority,
          category: dto.category ?? existing.category,
          purpose: dto.purpose ?? existing.purpose,
          remarks: dto.remarks ?? existing.remarks,
          status: dto.status ?? existing.status,
          estimatedTotalAmount: totalAmount,
          customFields: dto.customFields ?? existing.customFields,
          updatedBy: userId || null,
        },
        include: {
          project: true,
          items: {
            include: {
              material: true,
            },
          },
        },
      });

      return updated;
    });
  }

  /**
   * Submit PRN for Managerial Review & Approval
   */
  async submitPrn(id: string, userId?: string) {
    const existing = await this.prisma.purchaseRequestHeader.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Purchase Requisition with ID ${id} not found.`);
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot submit PRN in "${existing.status}" status.`);
    }

    return await this.prisma.purchaseRequestHeader.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        approvalStatus: ApprovalStatus.PENDING,
        updatedBy: userId || null,
      },
    });
  }

  /**
   * Approve PRN
   */
  async approvePrn(id: string, dto: ApprovePrnDto, user: any) {
    const existing = await this.prisma.purchaseRequestHeader.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Purchase Requisition with ID ${id} not found.`);
    }

    if (existing.status === 'APPROVED' || existing.status === 'PO_CREATED') {
      throw new BadRequestException('This Purchase Requisition is already approved.');
    }

    const approverName = user?.name || user?.email || 'Authorized Manager';

    return await this.prisma.purchaseRequestHeader.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvalStatus: ApprovalStatus.APPROVED,
        approvedBy: approverName,
        approvedAt: new Date(),
        remarks: dto.remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}Approved: ${dto.remarks}` : existing.remarks,
        updatedBy: user?.userId || null,
      },
      include: {
        project: true,
        items: true,
      },
    });
  }

  /**
   * Reject PRN with formal reason
   */
  async rejectPrn(id: string, dto: RejectPrnDto, user: any) {
    const existing = await this.prisma.purchaseRequestHeader.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Purchase Requisition with ID ${id} not found.`);
    }

    const reviewerName = user?.name || user?.email || 'Manager';

    return await this.prisma.purchaseRequestHeader.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvalStatus: ApprovalStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
        approvedBy: reviewerName,
        approvedAt: new Date(),
        updatedBy: user?.userId || null,
      },
    });
  }

  /**
   * Convert Approved PRN directly into a supplier Purchase Order (PO)
   */
  async convertToPo(id: string, dto: ConvertPrnToPoDto, userId?: string) {
    const prn = await this.prisma.purchaseRequestHeader.findUnique({
      where: { id },
      include: {
        project: true,
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!prn) {
      throw new NotFoundException(`Purchase Requisition with ID ${id} not found.`);
    }

    if (prn.status !== 'APPROVED' && prn.status !== 'PARTIALLY_CONVERTED') {
      throw new BadRequestException(`Only APPROVED Purchase Requisitions can be converted into Purchase Orders. Current status: ${prn.status}`);
    }

    // Verify vendor
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${dto.vendorId} not found.`);
    }

    // Determine target project (use PRN project or fallback to first active project if general stores)
    let targetProjectId = prn.projectId;
    if (!targetProjectId) {
      const anyProject = await this.prisma.project.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });
      if (!anyProject) {
        throw new BadRequestException('No active project found to associate with this Purchase Order.');
      }
      targetProjectId = anyProject.id;
    }

    // Generate unique official PO number
    const poNumber = await this.sequenceEngine.generateNextNumber('PO');

    // Find items to order
    const itemsToOrder = dto.items && dto.items.length > 0
      ? dto.items
      : prn.items.map((i) => ({
          prItemId: i.id,
          orderedQty: Number(i.requiredQuantity) - Number(i.orderedQty || 0),
          agreedRate: Number(i.estimatedRate) || Number(i.material?.standardCost) || 100,
          gstPercent: 18,
          remarks: i.remarks || '',
        }));

    return await this.prisma.$transaction(async (tx) => {
      let totalPoAmount = 0;
      const poItemsData: any[] = [];

      for (const itemDto of itemsToOrder) {
        const prItem = prn.items.find((i) => i.id === itemDto.prItemId);
        if (!prItem) continue;

        const qty = Number(itemDto.orderedQty) || 1;
        const rate = Number(itemDto.agreedRate) || 0;
        const gst = Number(itemDto.gstPercent || 18);
        const basicValue = Number((qty * rate).toFixed(2));
        const lineTotal = Number((basicValue * (1 + gst / 100)).toFixed(2));
        totalPoAmount += lineTotal;

        // Resolve materialId
        let resolvedMaterialId = prItem.materialId;
        if (!resolvedMaterialId) {
          // Find or fallback to general steel material
          const firstMat = await tx.material.findFirst({
            where: { status: 'ACTIVE' },
          });
          resolvedMaterialId = firstMat?.id || '';
        }

        poItemsData.push({
          materialId: resolvedMaterialId,
          orderedQty: qty,
          agreedRate: rate,
          lineTotal,
          receivedQty: 0,
          status: 'PENDING',
          remarks: itemDto.remarks || prItem.remarks || prItem.itemName || '',
          dimensions: prItem.dimensions || prItem.rawSize || '',
          gstPercent: gst,
          uom: prItem.uom || 'PCS',
          basicValue,
          customFields: {
            prItemId: prItem.id,
            prNumber: prn.prNumber,
            detNo: prItem.detNo || '',
            materialGrade: prItem.materialGrade || '',
            partName: prItem.itemName || '',
          },
        });

        // Update orderedQty and status on the PR item
        const newOrderedQty = Number(prItem.orderedQty || 0) + qty;
        const isFullyOrdered = newOrderedQty >= Number(prItem.requiredQuantity);

        await tx.purchaseRequestItem.update({
          where: { id: prItem.id },
          data: {
            orderedQty: newOrderedQty,
            status: isFullyOrdered ? 'ORDERED' : 'PARTIALLY_ORDERED',
          },
        });
      }

      // Create Purchase Order
      const poHeader = await tx.purchaseOrderHeader.create({
        data: {
          purchaseRequestId: prn.id,
          projectId: targetProjectId,
          vendorId: vendor.id,
          poNumber,
          documentNumber: poNumber,
          totalAmount: totalPoAmount,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          status: PurchaseOrderStatus.ISSUED,
          approvalStatus: ApprovalStatus.APPROVED,
          remarks: dto.remarks || `Generated from ${prn.prNumber}`,
          createdBy: userId || null,
          customFields: {
            rmSlipNo: prn.prNumber,
            sourcePrnId: prn.id,
            sourcePrnNumber: prn.prNumber,
            deliveryTerms: dto.deliveryTerms || 'Door Delivery / CIF Factory Gate',
            vendorName: vendor.vendorName,
            vendorAddress: vendor.address || '',
          },
          items: {
            create: poItemsData,
          },
        },
        include: {
          vendor: true,
          project: true,
          items: {
            include: {
              material: true,
            },
          },
        },
      });

      // Check if all PRN items are ordered
      const updatedPrItems = await tx.purchaseRequestItem.findMany({
        where: { prHeaderId: prn.id },
      });

      const allFullyOrdered = updatedPrItems.every(
        (i) => Number(i.orderedQty || 0) >= Number(i.requiredQuantity),
      );

      await tx.purchaseRequestHeader.update({
        where: { id: prn.id },
        data: {
          status: allFullyOrdered ? 'PO_CREATED' : 'PARTIALLY_CONVERTED',
          updatedBy: userId || null,
        },
      });

      return poHeader;
    });
  }

  /**
   * Delete draft PRN
   */
  async deletePrn(id: string) {
    const existing = await this.prisma.purchaseRequestHeader.findUnique({
      where: { id },
      include: { purchaseOrders: true },
    });

    if (!existing) {
      throw new NotFoundException(`Purchase Requisition with ID ${id} not found.`);
    }

    if (existing.purchaseOrders && existing.purchaseOrders.length > 0) {
      throw new BadRequestException('Cannot delete a Purchase Requisition that has associated Purchase Orders. Cancel the POs first.');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.purchaseRequestItem.deleteMany({
        where: { prHeaderId: id },
      });

      await tx.purchaseRequestHeader.delete({
        where: { id },
      });

      return { success: true, message: `Requisition ${existing.prNumber} deleted successfully.` };
    });
  }
}
