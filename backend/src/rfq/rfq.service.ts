// @ts-nocheck
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceEngine } from '../common/sequence.engine';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { CreateRfqItemDto } from './dto/create-rfq-item.dto';
import { RfqCostEstimateDto } from './dto/rfq-cost-estimate.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateRfqStatusDto } from './dto/update-rfq-status.dto';
import { RfqStatus, ProjectStatus } from '@prisma/client';

@Injectable()
export class RfqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceEngine: SequenceEngine,
  ) {}

  // ─── Full include for RFQ detail ─────────────────────────────
  private readonly rfqDetailInclude = {
    customer: true,
    project: {
      select: {
        id: true,
        projectNumber: true,
        partName: true,
        currentStage: true,
        targetDeliveryDate: true,
        status: true,
      },
    },
    primaryProjects: {
      select: {
        id: true,
        projectNumber: true,
        partName: true,
        currentStage: true,
        targetDeliveryDate: true,
      },
    },
    items: {
      include: {
        costEstimate: true,
        quotationItems: true,
      },
      orderBy: { createdAt: 'asc' as const },
    },
    quotations: {
      include: { items: true },
      orderBy: { revision: 'desc' as const },
    },
  };

  // ─── CREATE RFQ ──────────────────────────────────────────────
  async createRfq(dto: CreateRfqDto, userId?: string) {
    let customerId = dto.customerId;
    let resolvedProjectId = dto.projectId || null;

    // If an existing project is referenced, verify it and auto-inherit customer if needed
    if (resolvedProjectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: resolvedProjectId },
        include: { customer: true },
      });
      if (!project) {
        throw new NotFoundException(`Project ${resolvedProjectId} not found.`);
      }
      if (!customerId) {
        customerId = project.customerId;
      }
    }

    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found.`);
    }

    const rfqNumber = await this.sequenceEngine.generateNextNumber('RFQ');

    return await this.prisma.$transaction(async (tx) => {
      const rfq = await tx.rfqHeader.create({
        data: {
          rfqNumber,
          customerId,
          projectId: resolvedProjectId,
          contactPerson: dto.contactPerson ?? customer.contactPerson,
          contactEmail: dto.contactEmail ?? customer.contactEmail,
          contactPhone: dto.contactPhone ?? customer.contactPhone,
          subject: dto.subject,
          description: dto.description,
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
          items: dto.items?.length
            ? {
                create: dto.items.map((item) => ({
                  partName: item.partName,
                  partDescription: item.partDescription,
                  quantity: item.quantity ?? 1,
                  uom: item.uom ?? 'NOS',
                  specifications: item.specifications,
                  drawingReference: item.drawingReference,
                  targetPrice: item.targetPrice,
                  remarks: item.remarks,
                  createdBy: userId,
                  updatedBy: userId,
                })),
              }
            : undefined,
        },
        include: this.rfqDetailInclude,
      });

      // If associated with a project, log an activity in the project timeline
      if (resolvedProjectId) {
        await tx.projectActivity.create({
          data: {
            projectId: resolvedProjectId,
            action: 'RFQ_CREATED',
            description: `RFQ ${rfqNumber} registered for project (${dto.subject})`,
            performedBy: userId || 'SYSTEM',
          },
        });
      }

      return rfq;
    });
  }

  // ─── LIST RFQs ───────────────────────────────────────────────
  async listRfqs(filters?: {
    status?: string;
    customerId?: string;
    projectId?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status as RfqStatus;
    }
    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters?.projectId) {
      where.OR = [
        { projectId: filters.projectId },
        { primaryProjects: { some: { id: filters.projectId } } },
      ];
    }
    if (filters?.search) {
      where.OR = [
        { rfqNumber: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { customer: { companyName: { contains: filters.search, mode: 'insensitive' } } },
        { project: { projectNumber: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return await this.prisma.rfqHeader.findMany({
      where,
      include: {
        customer: true,
        project: { select: { id: true, projectNumber: true, partName: true } },
        primaryProjects: { select: { id: true, projectNumber: true, partName: true } },
        items: { select: { id: true, partName: true, quantity: true } },
        quotations: { select: { id: true, quotationNumber: true, totalAmount: true, status: true, revision: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── GET RFQ BY ID ───────────────────────────────────────────
  async getRfqById(id: string) {
    const rfq = await this.prisma.rfqHeader.findUnique({
      where: { id },
      include: this.rfqDetailInclude,
    });
    if (!rfq) {
      throw new NotFoundException(`RFQ ${id} not found.`);
    }
    return rfq;
  }

  // ─── UPDATE RFQ HEADER ───────────────────────────────────────
  async updateRfq(id: string, dto: Partial<CreateRfqDto>, userId?: string) {
    const rfq = await this.prisma.rfqHeader.findUnique({ where: { id } });
    if (!rfq) {
      throw new NotFoundException(`RFQ ${id} not found.`);
    }
    if (rfq.status === 'LOST' || rfq.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot update an RFQ with status ${rfq.status}.`);
    }

    return await this.prisma.rfqHeader.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        projectId: dto.projectId,
        contactPerson: dto.contactPerson,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        subject: dto.subject,
        description: dto.description,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
        remarks: dto.remarks,
        updatedBy: userId,
      },
      include: this.rfqDetailInclude,
    });
  }

  // ─── LINK / UNLINK PROJECT ───────────────────────────────────
  async linkToProject(rfqId: string, projectId: string, userId?: string) {
    const rfq = await this.prisma.rfqHeader.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException(`RFQ ${rfqId} not found.`);

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found.`);

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.rfqHeader.update({
        where: { id: rfqId },
        data: { projectId, updatedBy: userId },
        include: this.rfqDetailInclude,
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'RFQ_LINKED',
          description: `Linked existing RFQ ${rfq.rfqNumber} to this project.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return updated;
    });
  }

  async unlinkFromProject(rfqId: string, userId?: string) {
    const rfq = await this.prisma.rfqHeader.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new NotFoundException(`RFQ ${rfqId} not found.`);

    return await this.prisma.rfqHeader.update({
      where: { id: rfqId },
      data: { projectId: null, updatedBy: userId },
      include: this.rfqDetailInclude,
    });
  }

  // ─── ADD/UPDATE LINE ITEMS ───────────────────────────────────
  async upsertItems(rfqId: string, items: CreateRfqItemDto[], userId?: string) {
    const rfq = await this.prisma.rfqHeader.findUnique({ where: { id: rfqId } });
    if (!rfq) {
      throw new NotFoundException(`RFQ ${rfqId} not found.`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // Delete existing items and recreate (simple upsert strategy)
      await tx.rfqItem.deleteMany({ where: { rfqHeaderId: rfqId } });

      const created = await Promise.all(
        items.map((item) =>
          tx.rfqItem.create({
            data: {
              rfqHeaderId: rfqId,
              partName: item.partName,
              partDescription: item.partDescription,
              quantity: item.quantity ?? 1,
              uom: item.uom ?? 'NOS',
              specifications: item.specifications,
              drawingReference: item.drawingReference,
              targetPrice: item.targetPrice,
              remarks: item.remarks,
              createdBy: userId,
              updatedBy: userId,
            },
          }),
        ),
      );

      // Move status to ESTIMATION if still NEW
      if (rfq.status === 'NEW') {
        await tx.rfqHeader.update({
          where: { id: rfqId },
          data: { status: 'ESTIMATION', updatedBy: userId },
        });
      }

      return created;
    });
  }

  // ─── SAVE COST ESTIMATES ─────────────────────────────────────
  async saveCostEstimates(rfqId: string, estimates: RfqCostEstimateDto[], userId?: string) {
    const rfq = await this.prisma.rfqHeader.findUnique({
      where: { id: rfqId },
      include: { items: true },
    });
    if (!rfq) {
      throw new NotFoundException(`RFQ ${rfqId} not found.`);
    }

    const itemIds = new Set(rfq.items.map((i) => i.id));

    return await this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const est of estimates) {
        if (!est.rfqItemId || !itemIds.has(est.rfqItemId)) {
          throw new BadRequestException(`RFQ Item ${est.rfqItemId} does not belong to this RFQ.`);
        }

        const materialCost = Number(est.materialCost ?? 0);
        const machiningCost = Number(est.machiningCost ?? 0);
        const labourCost = Number(est.labourCost ?? 0);
        const subcontractCost = Number(est.subcontractCost ?? 0);
        const overheadPercent = Number(est.overheadPercent ?? 10);

        const directCost = materialCost + machiningCost + labourCost + subcontractCost;
        const overheadCost = directCost * (overheadPercent / 100);
        const totalEstimatedCost = directCost + overheadCost;

        const result = await tx.rfqCostEstimate.upsert({
          where: { rfqItemId: est.rfqItemId },
          update: {
            materialCost,
            machiningHours: Number(est.machiningHours ?? 0),
            machiningCost,
            labourHours: Number(est.labourHours ?? 0),
            labourCost,
            subcontractCost,
            overheadPercent,
            overheadCost,
            totalEstimatedCost,
            remarks: est.remarks,
            updatedBy: userId,
          },
          create: {
            rfqItemId: est.rfqItemId!,
            materialCost,
            machiningHours: Number(est.machiningHours ?? 0),
            machiningCost,
            labourHours: Number(est.labourHours ?? 0),
            labourCost,
            subcontractCost,
            overheadPercent,
            overheadCost,
            totalEstimatedCost,
            remarks: est.remarks,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        results.push(result);
      }

      // Move status to ESTIMATION if still NEW
      if (rfq.status === 'NEW') {
        await tx.rfqHeader.update({
          where: { id: rfqId },
          data: { status: 'ESTIMATION', updatedBy: userId },
        });
      }

      return results;
    });
  }

  // ─── GENERATE QUOTATION ──────────────────────────────────────
  async generateQuotation(rfqId: string, dto: CreateQuotationDto, userId?: string) {
    const rfq = await this.prisma.rfqHeader.findUnique({
      where: { id: rfqId },
      include: {
        items: { include: { costEstimate: true } },
        quotations: { orderBy: { revision: 'desc' }, take: 1 },
      },
    });
    if (!rfq) {
      throw new NotFoundException(`RFQ ${rfqId} not found.`);
    }

    const quotationNumber = await this.sequenceEngine.generateNextNumber('QTN');
    const nextRevision = rfq.quotations.length > 0 ? rfq.quotations[0].revision + 1 : 1;

    const markupPercent = dto.markupPercent ?? 15;
    const taxPercent = dto.taxPercent ?? 18;
    const validityDays = dto.validityDays ?? 30;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Build quotation items from RFQ items + cost estimates, applying markup
    const quotationItems = dto.items?.length
      ? dto.items.map((item) => {
          const lineTotal = (item.quantity ?? 1) * (item.unitPrice ?? 0);
          return {
            rfqItemId: item.rfqItemId,
            description: item.description,
            quantity: item.quantity ?? 1,
            uom: item.uom ?? 'NOS',
            unitPrice: item.unitPrice ?? 0,
            lineTotal,
            remarks: item.remarks,
            createdBy: userId,
          };
        })
      : rfq.items.map((item) => {
          const estimatedCost = item.costEstimate
            ? Number(item.costEstimate.totalEstimatedCost)
            : 0;
          const unitPrice = estimatedCost * (1 + markupPercent / 100);
          const qty = Number(item.quantity);
          return {
            rfqItemId: item.id,
            description: item.partName + (item.partDescription ? ` — ${item.partDescription}` : ''),
            quantity: qty,
            uom: item.uom,
            unitPrice: Math.round(unitPrice * 100) / 100,
            lineTotal: Math.round(unitPrice * qty * 100) / 100,
            remarks: item.remarks,
            createdBy: userId,
          };
        });

    const subtotal = quotationItems.reduce((sum, i) => sum + Number(i.lineTotal), 0);
    const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    return await this.prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          quotationNumber,
          rfqHeaderId: rfqId,
          revision: nextRevision,
          markupPercent,
          subtotal,
          taxPercent,
          taxAmount,
          totalAmount,
          validityDays,
          validUntil,
          termsAndConditions: dto.termsAndConditions,
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
          items: { create: quotationItems },
        },
        include: { items: true },
      });

      // Move status to QUOTED
      await tx.rfqHeader.update({
        where: { id: rfqId },
        data: { status: 'QUOTED', updatedBy: userId },
      });

      return quotation;
    });
  }

  // ─── UPDATE RFQ STATUS ───────────────────────────────────────
  async updateStatus(id: string, dto: UpdateRfqStatusDto, userId?: string) {
    const rfq = await this.prisma.rfqHeader.findUnique({ where: { id } });
    if (!rfq) {
      throw new NotFoundException(`RFQ ${id} not found.`);
    }

    const validStatuses = ['NEW', 'ESTIMATION', 'QUOTED', 'REVISION', 'WON', 'LOST', 'CANCELLED'];
    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException(`Invalid status: ${dto.status}`);
    }

    return await this.prisma.rfqHeader.update({
      where: { id },
      data: {
        status: dto.status as RfqStatus,
        lostReason: dto.status === 'LOST' ? dto.lostReason : undefined,
        updatedBy: userId,
      },
      include: this.rfqDetailInclude,
    });
  }

  // ─── CONVERT RFQ → PROJECT ──────────────────────────────────
  async convertToProject(rfqId: string, plantId?: string, userId?: string) {
    const rfq = await this.prisma.rfqHeader.findUnique({
      where: { id: rfqId },
      include: {
        customer: true,
        project: true,
        primaryProjects: true,
        items: { include: { costEstimate: true } },
        quotations: { orderBy: { revision: 'desc' }, take: 1, include: { items: true } },
      },
    });
    if (!rfq) {
      throw new NotFoundException(`RFQ ${rfqId} not found.`);
    }
    if (rfq.status !== 'WON') {
      throw new BadRequestException('Only RFQs with status WON can be converted to projects.');
    }
    if (rfq.primaryProjects?.length || (rfq.projectId && rfq.project)) {
      throw new BadRequestException('This RFQ has already been converted or linked to an existing project.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Resolve Plant
      let resolvedPlantId = plantId;
      if (!resolvedPlantId) {
        const fallbackPlant = await tx.plant.findFirst({ where: { status: 'ACTIVE' } }) || await tx.plant.findFirst();
        if (!fallbackPlant) {
          throw new BadRequestException('No active manufacturing plant exists in the database.');
        }
        resolvedPlantId = fallbackPlant.id;
      }

      // 2. Generate Project Number (KTD- prefix)
      let projectNumber = '';
      try {
        projectNumber = await this.sequenceEngine.generateNextNumber('PROJECT');
      } catch {
        projectNumber = `KTD-${Date.now().toString().slice(-4)}`;
      }
      if (!projectNumber.toUpperCase().startsWith('KTD-')) {
        projectNumber = `KTD-${projectNumber}`;
      }

      // 3. Build part name from RFQ items
      const partName = rfq.items.length === 1
        ? rfq.items[0].partName
        : `${rfq.subject} (${rfq.items.length} parts)`;

      // 4. Calculate initial revenue from quotation
      const latestQuote = rfq.quotations?.[0];
      const initialRevenue = latestQuote ? Number(latestQuote.totalAmount) : 0;

      // 5. Create Project
      const project = await tx.project.create({
        data: {
          projectNumber,
          partName,
          description: rfq.description ?? rfq.subject,
          customerId: rfq.customerId,
          plantId: resolvedPlantId,
          targetDeliveryDate: rfq.expectedDeliveryDate,
          rfqHeaderId: rfqId,
          createdBy: userId,
          updatedBy: userId,
          currentStage: ProjectStatus.ENGINEERING,
        },
      });

      // 6. Update RFQ header to link to new project
      await tx.rfqHeader.update({
        where: { id: rfqId },
        data: {
          projectId: project.id,
          updatedBy: userId,
        },
      });

      // 7. Initialize Project Cost Summary
      const estimatedMaterialCost = rfq.items.reduce((sum, item) => {
        return sum + (item.costEstimate ? Number(item.costEstimate.materialCost || 0) : 0);
      }, 0);

      await tx.projectCostSummary.create({
        data: {
          projectId: project.id,
          estimatedMaterialCost,
          actualMaterialCost: 0,
          materialConsumptionCost: 0,
          machineCost: 0,
          labourCost: 0,
          outsideProcessCost: 0,
          inspectionCost: 0,
          packingCost: 0,
          dispatchCost: 0,
          totalCost: 0,
          revenue: initialRevenue,
          profitability: initialRevenue,
        },
      });

      // 8. Record Initial Project Timeline
      await tx.projectTimeline.create({
        data: {
          projectId: project.id,
          fromStage: ProjectStatus.ENGINEERING,
          toStage: ProjectStatus.ENGINEERING,
          transitionedBy: userId || 'SYSTEM',
          remarks: `Project created and initialized from won RFQ ${rfq.rfqNumber}${latestQuote ? ` (Quote: ${latestQuote.quotationNumber})` : ''}`,
        },
      });

      // 9. Record Project Activity
      await tx.projectActivity.create({
        data: {
          projectId: project.id,
          action: 'PROJECT_CREATED_FROM_RFQ',
          description: `Project ${project.projectNumber} created from RFQ ${rfq.rfqNumber}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return project;
    });
  }

  // ─── PIPELINE SUMMARY ───────────────────────────────────────
  async getPipelineSummary() {
    const counts = await this.prisma.rfqHeader.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const pipeline: Record<string, number> = {
      NEW: 0,
      ESTIMATION: 0,
      QUOTED: 0,
      REVISION: 0,
      WON: 0,
      LOST: 0,
      CANCELLED: 0,
    };

    counts.forEach((c) => {
      pipeline[c.status] = c._count.id;
    });

    const totalValue = await this.prisma.quotation.aggregate({
      _sum: { totalAmount: true },
      where: { rfqHeader: { status: { in: ['QUOTED', 'WON'] } } },
    });

    return {
      pipeline,
      totalPipelineValue: Number(totalValue._sum.totalAmount ?? 0),
      total: Object.values(pipeline).reduce((a, b) => a + b, 0),
    };
  }

  // ─── LIST QUOTATIONS ─────────────────────────────────────────
  async listQuotations() {
    return await this.prisma.quotation.findMany({
      include: {
        rfqHeader: {
          include: { customer: true, project: true },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── GET QUOTATION BY ID ─────────────────────────────────────
  async getQuotationById(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        rfqHeader: {
          include: { customer: true, project: true, items: { include: { costEstimate: true } } },
        },
        items: { include: { rfqItem: true } },
      },
    });
    if (!quotation) {
      throw new NotFoundException(`Quotation ${id} not found.`);
    }
    return quotation;
  }
}
