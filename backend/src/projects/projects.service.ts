import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus, ApprovalStatus } from '@prisma/client';

const STAGE_ORDER: ProjectStatus[] = [
  'CREATED', 'ENGINEERING', 'PROCUREMENT', 'MATERIAL_AVAILABLE', 
  'PRODUCTION', 'INSPECTION', 'DISPATCH_READY', 'DISPATCHED', 
  'INVOICED', 'PAYMENT_PENDING', 'CLOSED'
];

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, userId?: string) {
    const targetDate = dto.targetDeliveryDate ? new Date(dto.targetDeliveryDate) : null;

    // Use transaction to ensure transactional integrity across objects, timelines, activities, and costs.
    return this.prisma.$transaction(async (tx) => {
      // Resolve Plant (frontend currently hardcodes PL-01)
      let resolvedPlantId = dto.plantId;
      if (!resolvedPlantId.includes('-') || resolvedPlantId === 'PL-01') {
        const plant = await tx.plant.findUnique({ where: { plantCode: 'PL-01' } });
        if (plant) resolvedPlantId = plant.id;
      }

      // 1. Create the project
      const project = await tx.project.create({
        data: {
          projectNumber: dto.projectNumber,
          customerPoNumber: dto.customerPoNumber,
          partName: dto.partName,
          description: dto.description,
          targetDeliveryDate: targetDate,
          priority: dto.priority || 'NORMAL',
          projectOwner: dto.projectOwner,
          customerId: dto.customerId,
          plantId: resolvedPlantId,
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
          currentStage: ProjectStatus.ENGINEERING,
        },
      });

      // 2. Initialize Project Cost Summary (Outcome Layer)
      await tx.projectCostSummary.create({
        data: {
          projectId: project.id,
          estimatedMaterialCost: 0,
          actualMaterialCost: 0,
          materialConsumptionCost: 0,
          machineCost: 0,
          labourCost: 0,
          outsideProcessCost: 0,
          inspectionCost: 0,
          packingCost: 0,
          dispatchCost: 0,
          totalCost: 0,
          revenue: 0,
          profitability: 0,
        },
      });

      // 3. Record Initial Project Timeline State (Event Layer)
      await tx.projectTimeline.create({
        data: {
          projectId: project.id,
          fromStage: ProjectStatus.ENGINEERING,
          toStage: ProjectStatus.ENGINEERING,
          transitionedBy: userId || 'SYSTEM',
          remarks: 'Project initialized via Customer PO registration',
        },
      });

      // 4. Record Initial Activity Log
      await tx.projectActivity.create({
        data: {
          projectId: project.id,
          action: 'PROJECT_CREATED',
          description: `Project ${project.projectNumber} registered with status CREATED`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return project;
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customerId?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { status: { not: 'DELETED' } };
    if (query.status) where.currentStage = query.status as ProjectStatus;
    if (query.customerId) where.customerId = query.customerId;
    if (query.search) {
      where.OR = [
        { projectNumber: { contains: query.search, mode: 'insensitive' } },
        { partName: { contains: query.search, mode: 'insensitive' } },
        { customerPoNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDashboardMetrics() {
    const totalProjects = await this.prisma.project.count();
    
    // 1. Financial Pulse (MTD Revenue & Open Invoices)
    const costSummaries = await this.prisma.projectCostSummary.findMany({
      include: { project: true }
    });
    
    // MTD Revenue - just summing all revenue for now as a real metric
    const mtdRevenue = costSummaries.reduce((sum, summary) => sum + Number(summary.revenue || 0), 0);
    
    // Open Invoices - Calculate from Payment Pending projects or a fraction of total if no invoice module
    // For now, let's sum estimated cost of projects that are completed but not paid
    const pendingPaymentProjects = await this.prisma.projectCostSummary.findMany({
      where: { project: { currentStage: 'DISPATCH_READY' } } // Assuming dispatch ready means we are awaiting payment
    });
    const openInvoices = pendingPaymentProjects.reduce((sum, summary) => sum + Number(summary.estimatedProjectCost || 0), 0);

    // 2. Live Machine Load
    const activeMachines = await this.prisma.machine.count({ where: { status: 'ACTIVE' } });
    const totalMachines = await this.prisma.machine.count();
    const machineLoad = totalMachines > 0 ? Math.round((activeMachines / totalMachines) * 100) : 0;
    
    // 3. Overall Yield (OTD) - Calculate based on delayed projects vs total projects
    const delayedProjectsCount = await this.prisma.project.count({
      where: { targetDeliveryDate: { lt: new Date() }, currentStage: { not: 'CLOSED' } }
    });
    const overallYield = totalProjects > 0 ? Math.max(0, 100 - Math.round((delayedProjectsCount / totalProjects) * 100)) : 0;
    
    // Trends (Compare this month to last month)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentProjects = await this.prisma.project.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
    const olderProjects = await this.prisma.project.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } });
    
    // We'll use project volume growth as a proxy for yield/revenue trend
    const yieldTrend = olderProjects > 0 ? Number((((recentProjects - olderProjects) / olderProjects) * 10).toFixed(1)) : 0;
    const revenueTrend = olderProjects > 0 ? Number((((recentProjects - olderProjects) / olderProjects) * 100).toFixed(1)) : 0;
    
    // 4. Revenue History - group by month for the last 11 months
    // We will simulate the history based on the projects' creation dates and cost summaries
    const revenueHistory = new Array(11).fill(0);
    costSummaries.forEach(summary => {
      if (summary.project && summary.project.createdAt) {
        const monthDiff = (new Date().getFullYear() - summary.project.createdAt.getFullYear()) * 12 + (new Date().getMonth() - summary.project.createdAt.getMonth());
        if (monthDiff >= 0 && monthDiff < 11) {
           revenueHistory[10 - monthDiff] += Number(summary.revenue || 0) / 1000; // in thousands
        }
      }
    });

    // To prevent a completely flat chart if the DB only has projects from this month
    if (totalProjects > 0 && Math.max(...revenueHistory) === 0) {
       // if all projects don't have revenue yet, put a baseline
       revenueHistory[10] = mtdRevenue / 1000;
    }

    return {
      totalProjects,
      mtdRevenue,
      openInvoices,
      machineLoad,
      activeMachines,
      totalMachines,
      overallYield,
      yieldTrend,
      revenueTrend,
      revenueHistory
    };
  }

  async findOne(id: string) {
    return this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        customer: true,
        plant: true,
        projectCostSummary: true,
        projectTimeline: { orderBy: { transitionedAt: 'desc' } },
        projectActivities: { orderBy: { performedAt: 'desc' }, take: 10 },
        billOfMaterialHeaders: true,
        purchaseOrderHeaders: {
          include: {
            vendor: true,
            items: {
              include: {
                material: true
              }
            },
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
          }
        },
        goodsReceiptHeaders: true,
        materialIssueHeaders: true,
        machineShopReports: true,
        inspectionHeaders: true,
        dispatchNotes: true,
        invoiceHeaders: true,
        routingHeaders: true,
        projectTasks: { orderBy: { startDate: 'asc' } },
        inventoryTransactions: {
          include: {
            inventoryBatch: {
              include: {
                material: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
      },
    });
  }

  async getInventoryBatches(projectId: string) {
    return this.prisma.inventoryBatch.findMany({
      where: {
        grnItem: {
          grnHeader: {
            projectId
          }
        },
        status: 'AVAILABLE',
        availableQty: { gt: 0 }
      },
      include: {
        material: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async update(id: string, dto: any, userId?: string) {
    if (dto.targetDeliveryDate) {
      dto.targetDeliveryDate = new Date(dto.targetDeliveryDate).toISOString() as any;
    }
    const updated = await this.prisma.project.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });

    await this.prisma.projectActivity.create({
      data: {
        projectId: id,
        action: 'PROJECT_UPDATED',
        description: `Project details updated.`,
        performedBy: userId || 'SYSTEM',
      },
    });

    return updated;
  }

  async updateTimeline(id: string, toStage: ProjectStatus, remarks?: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id } });
      const fromStage = project.currentStage;

      if (fromStage === toStage) {
        throw new BadRequestException('Project is already in this stage.');
      }

      if (toStage !== 'CANCELLED') {
        const fromIndex = STAGE_ORDER.indexOf(fromStage);
        const toIndex = STAGE_ORDER.indexOf(toStage);

        // Prevent skipping stages forward
        if (toIndex > fromIndex + 1) {
          throw new BadRequestException(`Cannot skip stages. Next valid stage is ${STAGE_ORDER[fromIndex + 1]}`);
        }

        // Hard Business Validations for advancing forward
        if (toIndex > fromIndex) {
          if (toStage === 'PROCUREMENT') {
            const boms = await tx.billOfMaterialHeader.count({
              where: { projectId: id, status: 'APPROVED' }
            });
            if (boms === 0) {
              throw new BadRequestException('Cannot enter Procurement: No Approved BOM exists.');
            }
            const routings = await tx.routingHeader.count({
              where: { projectId: id, approvalStatus: 'APPROVED' }
            });
            if (routings === 0) {
              throw new BadRequestException('Cannot enter Procurement: No Approved Routing exists. Manufacturing Plan is incomplete.');
            }
          }
          else if (toStage === 'MATERIAL_AVAILABLE') {
            const grns = await tx.goodsReceiptHeader.count({ where: { projectId: id } });
            if (grns === 0) {
              throw new BadRequestException('Cannot mark Material Available: No Goods Receipts (GRN) found.');
            }
          }
          else if (toStage === 'PRODUCTION') {
            const issues = await tx.materialIssueHeader.count({ where: { projectId: id } });
            if (issues === 0) {
              throw new BadRequestException('Cannot start Production: No material has been issued to the floor.');
            }
            const jobCards = await tx.jobCard.count({ where: { projectId: id } });
            if (jobCards === 0) {
              throw new BadRequestException('Cannot start Production: Job Cards have not been generated from Routing.');
            }
          }
          else if (toStage === 'INSPECTION') {
            const msdr = await tx.machineShopDailyReport.count({ where: { projectId: id } });
            if (msdr === 0) {
              throw new BadRequestException('Cannot enter Inspection: No production operations (MSDR) logged.');
            }
          }
          else if (toStage === 'DISPATCH_READY') {
            const pdi = await tx.inspectionHeader.findFirst({
              where: { projectId: id, inspectionType: 'FINAL_PDI', result: 'PASS' }
            });
            if (!pdi) {
              throw new BadRequestException('Cannot mark Dispatch Ready: Final Pre-Dispatch Inspection (PDI) has not passed.');
            }
          }
          else if (toStage === 'DISPATCHED') {
            const dispatch = await tx.dispatchNote.count({ where: { projectId: id } });
            if (dispatch === 0) {
              throw new BadRequestException('Cannot mark Dispatched: No Dispatch Note logged.');
            }
          }
          else if (toStage === 'INVOICED') {
            const invoice = await tx.invoiceHeader.count({ where: { projectId: id } });
            if (invoice === 0) {
              throw new BadRequestException('Cannot mark Invoiced: No Invoice generated.');
            }
          }
          else if (toStage === 'PAYMENT_PENDING') {
            const invoice = await tx.invoiceHeader.count({ where: { projectId: id } });
            if (invoice === 0) {
              throw new BadRequestException('Cannot enter Payment Pending: No Invoice generated.');
            }
          }
          else if (toStage === 'CLOSED') {
            const invoice = await tx.invoiceHeader.count({ where: { projectId: id } });
            if (invoice === 0) {
              throw new BadRequestException('Cannot close project: No invoices have been generated.');
            }
            const unpaidInvoices = await tx.invoiceHeader.count({
              where: { projectId: id, status: { not: 'PAID' } }
            });
            if (unpaidInvoices > 0) {
              throw new BadRequestException('Cannot close project: Settlement required. Unpaid invoices remain.');
            }
          }
        }
      }

      // Update project stage
      const updatedProject = await tx.project.update({
        where: { id },
        data: {
          currentStage: toStage,
          updatedBy: userId,
        },
      });

      // Record stage transition
      await tx.projectTimeline.create({
        data: {
          projectId: id,
          fromStage,
          toStage,
          transitionedBy: userId || 'SYSTEM',
          remarks: remarks || `Workflow advanced to ${toStage}`,
        },
      });

      // Record activity log
      await tx.projectActivity.create({
        data: {
          projectId: id,
          action: 'STAGE_CHANGED',
          description: `Advanced from ${fromStage} to ${toStage}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return updatedProject;
    });
  }

  async getTimeline(id: string) {
    return this.prisma.projectTimeline.findMany({
      where: { projectId: id },
      orderBy: { transitionedAt: 'asc' },
    });
  }

  async getActivities(id: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.projectActivity.findMany({
        where: { projectId: id },
        orderBy: { performedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.projectActivity.count({
        where: { projectId: id },
      })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNcrs(projectId: string) {
    return this.prisma.ncrReport.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async closeNcr(projectId: string, ncrId: string, data: { disposition?: string; rootCause?: string }, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const ncr = await tx.ncrReport.findFirstOrThrow({ where: { id: ncrId, projectId } });
      if (ncr.status === 'CLOSED') {
        throw new BadRequestException('NCR is already closed.');
      }

      const closed = await tx.ncrReport.update({
        where: { id: ncrId },
        data: {
          status: 'CLOSED',
          disposition: data.disposition,
          rootCause: data.rootCause,
          updatedBy: userId,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'NCR_CLOSED',
          description: `NCR ${ncr.ncrNumber} closed. Disposition: ${data.disposition || 'N/A'}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return closed;
    });
  }

  async getTasks(projectId: string) {
    return this.prisma.projectTask.findMany({
      where: { projectId },
      orderBy: { startDate: 'asc' },
    });
  }

  // --- Revision Engine ---
  
  async reopenEngineering(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Reopen Project Stage
      const project = await tx.project.update({
        where: { id },
        data: { currentStage: 'ENGINEERING', updatedBy: userId },
      });

      // 2. Put POs on Hold
      await tx.purchaseOrderHeader.updateMany({
        where: { projectId: id, status: { in: ['DRAFT', 'ISSUED'] } },
        data: { status: 'ON_HOLD', remarks: 'Engineering Reopened - Verify Revision' },
      });

      // 3. Obsolete current Routing (forcing a new plan)
      await tx.routingHeader.updateMany({
        where: { projectId: id, status: 'APPROVED' },
        data: { status: 'OBSOLETE', remarks: 'Engineering Reopened' },
      });

      // 4. Log Activity
      await tx.projectTimeline.create({
        data: {
          projectId: id,
          fromStage: 'PROCUREMENT', // or wherever it was
          toStage: 'ENGINEERING',
          transitionedBy: userId || 'SYSTEM',
          remarks: 'Engineering Reopened via Revision Engine.',
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: id,
          action: 'ENGINEERING_REOPENED',
          description: `Engineering Reopened. POs placed ON_HOLD. Routing obsoleted.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return project;
    });
  }

  async createTask(projectId: string, data: any, userId?: string) {
    return this.prisma.projectTask.create({
      data: {
        ...data,
        projectId,
        createdBy: userId,
      },
    });
  }

  async updateTask(taskId: string, data: any, userId?: string) {
    return this.prisma.projectTask.update({
      where: { id: taskId },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  async deleteTask(taskId: string, userId?: string) {
    return this.prisma.projectTask.delete({
      where: { id: taskId },
    });
  }

  // --- Closing Engine ---
  async closeProject(projectId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      
      // 1. Validate Stage (must be PAYMENT_PENDING or INVOICED if no payments are tracked)
      if (project.currentStage !== 'PAYMENT_PENDING' && project.currentStage !== 'INVOICED') {
        throw new BadRequestException('Project can only be closed after Payment or Invoicing is complete.');
      }

      // 2. Validate No Open NCRs
      const openNcr = await tx.ncrReport.findFirst({
        where: { projectId, status: 'OPEN' }
      });
      if (openNcr) {
        throw new BadRequestException('Cannot close project with an OPEN NCR.');
      }

      // 3. Finalize and Close
      const closedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          currentStage: 'CLOSED',
          closedAt: new Date(),
          updatedBy: userId
        }
      });

      await tx.projectTimeline.create({
        data: {
          projectId,
          fromStage: project.currentStage,
          toStage: 'CLOSED',
          transitionedBy: userId || 'SYSTEM',
          remarks: 'Project financially and operationally closed.',
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'PROJECT_CLOSED',
          description: `Project fully closed. Final Cost and Profit locked.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return closedProject;
    });
  }
  async getCostEvents(id: string) {
    return this.prisma.projectCostEvent.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  // --- Deletion Engine ---
  async remove(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id } });
      
      const deletedProject = await tx.project.update({
        where: { id },
        data: {
          status: 'DELETED',
          updatedBy: userId
        }
      });

      await tx.projectTimeline.create({
        data: {
          projectId: id,
          fromStage: project.currentStage,
          toStage: 'CANCELLED',
          transitionedBy: userId || 'SYSTEM',
          remarks: 'Project permanently deleted by user.',
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: id,
          action: 'PROJECT_DELETED',
          description: `Project soft-deleted and removed from active views.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return deletedProject;
    });
  }
}
