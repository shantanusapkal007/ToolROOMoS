import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateDesignLogDto, UpdateDesignLogDto } from './dto/create-design-log.dto';
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
      // Dynamically resolve Plant (by ID, by plantCode, or fallback to first active plant)
      let resolvedPlantId = dto.plantId;
      const existingPlant = await tx.plant.findFirst({
        where: {
          OR: [
            { id: resolvedPlantId },
            { plantCode: resolvedPlantId }
          ]
        }
      });

      if (existingPlant) {
        resolvedPlantId = existingPlant.id;
      } else {
        const fallbackPlant = await tx.plant.findFirst({ where: { status: 'ACTIVE' } }) || await tx.plant.findFirst();
        if (!fallbackPlant) {
          throw new BadRequestException('No active manufacturing plant exists in the database. Please create a plant first.');
        }
        resolvedPlantId = fallbackPlant.id;
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
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // MTD Revenue - Sum of all InvoiceHeaders created this month
    const mtdInvoices = await this.prisma.invoiceHeader.findMany({
      where: { createdAt: { gte: firstDayOfMonth } }
    });
    const mtdRevenue = mtdInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const mtdSalesWithoutGst = mtdInvoices.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0);

    // Management Indicators derived dynamically from active project pipeline estimates & cost summaries
    const activeProjectSummaries = await this.prisma.projectCostSummary.findMany({
      where: { project: { currentStage: { notIn: ['CANCELLED', 'CLOSED'] } } }
    });
    const totalPipelineEstimatedValue = activeProjectSummaries.reduce(
      (sum, s) => sum + Number(s.estimatedMaterialCost || 0) + Number(s.revenue || 0), 
      0
    );

    // Dynamic Monthly Target based on active open pipeline / 3-month rolling average or minimum baseline
    const monthlyTarget = totalPipelineEstimatedValue > 0 ? Math.round(totalPipelineEstimatedValue / 3) : 5000000;
    const monthlyRemaining = Math.max(0, monthlyTarget - mtdRevenue);
    
    // Dynamic Yearly Projected Revenue (YTD actual revenue + open pipeline estimated value)
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const ytdInvoices = await this.prisma.invoiceHeader.findMany({
      where: { createdAt: { gte: firstDayOfYear } }
    });
    const ytdRevenue = ytdInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    const yearlyProjectedRevenue = ytdRevenue + totalPipelineEstimatedValue;
    
    // Open Invoices - Sum of all unpaid InvoiceHeaders
    const openInvoicesList = await this.prisma.invoiceHeader.findMany({
      where: { paymentStatus: { not: 'PAID' } }
    });
    const openInvoices = openInvoicesList.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);

    // 2. Live Machine Load
    const activeJobs = await this.prisma.jobCard.findMany({
      where: { status: 'IN_PROGRESS' },
      select: { machineId: true },
      distinct: ['machineId']
    });
    const activeMachines = activeJobs.filter(j => j.machineId).length;
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
    const allInvoices = await this.prisma.invoiceHeader.findMany({
      select: { invoiceDate: true, totalAmount: true }
    });
    const revenueHistory = new Array(11).fill(0);
    allInvoices.forEach(inv => {
      if (inv.invoiceDate) {
        const monthDiff = (new Date().getFullYear() - inv.invoiceDate.getFullYear()) * 12 + (new Date().getMonth() - inv.invoiceDate.getMonth());
        if (monthDiff >= 0 && monthDiff < 11) {
           revenueHistory[10 - monthDiff] += Number(inv.totalAmount || 0) / 1000; // in thousands
        }
      }
    });

    // 5. Total Purchase Value based on GRN Materials across ALL projects
    const grnItems = await this.prisma.goodsReceiptItem.findMany({
      include: {
        grnHeader: {
          select: { projectId: true, grnNumber: true }
        }
      }
    });

    const totalGrnPurchaseValue = grnItems.reduce((sum, item) => {
      const basic = Number(item.total || item.basicCost || 0);
      const calculated = Number(item.actualMaterialCost || 0) || (Number(item.acceptedQty || 0) * Number(item.actualRate || 0));
      const val = basic > 0 ? basic : calculated;
      return sum + val;
    }, 0);

    const grnMaterialCount = grnItems.length;
    const grnTotalReceiptsCount = await this.prisma.goodsReceiptHeader.count();

    return {
      totalProjects,
      mtdRevenue,
      mtdSalesWithoutGst,
      monthlyTarget,
      monthlyRemaining,
      yearlyProjectedRevenue,
      openInvoices,
      machineLoad,
      overallYield,
      yieldTrend,
      revenueTrend,
      revenueHistory,
      totalGrnPurchaseValue,
      grnMaterialCount,
      grnTotalReceiptsCount,
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
        },
        materialIssueHeaders: {
          include: {
            items: {
              include: {
                inventoryBatch: {
                  include: {
                    material: true
                  }
                }
              }
            }
          }
        },
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


      // All hardcoded phase locks have been removed to allow independent usage of modules.


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
  
  async getReopenImpact(id: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id },
      include: {
        purchaseOrderHeaders: {
          where: { status: { in: ['DRAFT', 'ISSUED'] } },
          include: { items: true }
        },
        routingHeaders: {
          where: { status: 'APPROVED' },
          include: { operations: true }
        },
        goodsReceiptHeaders: true,
        materialIssueHeaders: true,
        machineShopReports: true,
      }
    });

    const hasGrns = project.goodsReceiptHeaders.length > 0;
    const hasIssues = project.materialIssueHeaders.length > 0;
    const hasProduction = project.machineShopReports.length > 0;

    const isReopenBlocked = false;
    let blockReason = null;


    const affectedPosCount = project.purchaseOrderHeaders.length;
    const affectedRoutingCount = project.routingHeaders.length;
    const affectedMaterialsCount = project.purchaseOrderHeaders.reduce((sum, po) => sum + po.items.length, 0);

    return {
      isBlocked: isReopenBlocked,
      blockReason,
      affectedPOs: affectedPosCount,
      affectedRouting: affectedRoutingCount,
      affectedMaterials: affectedMaterialsCount,
      currentStage: project.currentStage,
    };
  }

  async reopenEngineering(id: string, userId?: string) {
    const impact = await this.getReopenImpact(id);
    if (impact.isBlocked) {
      throw new BadRequestException(impact.blockReason || "Cannot reopen engineering: stage constraints violated.");
    }

    return this.prisma.$transaction(async (tx) => {
      // Get current stage before changing it
      const currentProj = await tx.project.findUniqueOrThrow({ where: { id } });

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
          fromStage: currentProj.currentStage,
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
      
      // 1. Validate Stage - Removed to allow closing from any stage


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
      // Delete the project permanently. Due to Prisma onDelete: Cascade,
      // all related entities will also be deleted.
      const deletedProject = await tx.project.delete({
        where: { id }
      });

      return deletedProject;
    });
  }

  // --- Designer Work Logs Engine ---
  private async getDesignerHourlyRate(designerName?: string, designerId?: string): Promise<number> {
    if (designerId) {
      const emp = await this.prisma.employee.findUnique({ where: { id: designerId } });
      if (emp && Number(emp.hourlyRate) > 0) {
        return Number(emp.hourlyRate);
      }
    }

    if (designerName) {
      const emp = await this.prisma.employee.findFirst({
        where: {
          name: { contains: designerName, mode: 'insensitive' },
        },
      });
      if (emp && Number(emp.hourlyRate) > 0) {
        return Number(emp.hourlyRate);
      }
    }

    // Default standard CAD / Tool Engineering hourly rate (₹350 / hr)
    return 350;
  }

  private async recalculateProjectCostSummary(projectId: string) {
    try {
      // 1. Clean up orphaned design cost events whose design log was deleted
      const designCostEvents = await this.prisma.projectCostEvent.findMany({
        where: { projectId, referenceDocType: 'DESIGN_WORK_LOG' },
      });

      for (const event of designCostEvents) {
        if (event.referenceDocId) {
          const logExists = await (this.prisma as any).designWorkLog.findUnique({
            where: { id: event.referenceDocId },
          });
          if (!logExists) {
            await this.prisma.projectCostEvent.delete({ where: { id: event.id } });
          }
        }
      }

      // 2. Sum up active LABOUR_COST events
      const labourEvents = await this.prisma.projectCostEvent.findMany({
        where: { projectId, costType: 'LABOUR_COST' },
      });
      const totalLabourCost = labourEvents.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // 3. Sum up active MACHINE_COST events
      const machineEvents = await this.prisma.projectCostEvent.findMany({
        where: { projectId, costType: 'MACHINE_COST' },
      });
      const totalMachineCost = machineEvents.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // 4. Sum up active MATERIAL_CONSUMPTION events
      const materialEvents = await this.prisma.projectCostEvent.findMany({
        where: { projectId, costType: 'MATERIAL_CONSUMPTION' },
      });
      const totalMaterialCost = materialEvents.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // 5. Sum up active OUTSIDE_PROCESS events
      const outsideEvents = await this.prisma.projectCostEvent.findMany({
        where: { projectId, costType: 'OUTSIDE_PROCESS' },
      });
      const totalOutsideCost = outsideEvents.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const summary = await this.prisma.projectCostSummary.findUnique({ where: { projectId } });

      const grandTotal = totalMaterialCost + totalMachineCost + totalLabourCost + totalOutsideCost + Number(summary?.inspectionCost || 0) + Number(summary?.packingCost || 0) + Number(summary?.dispatchCost || 0);

      await this.prisma.projectCostSummary.upsert({
        where: { projectId },
        create: {
          projectId,
          actualMaterialCost: totalMaterialCost,
          materialConsumptionCost: totalMaterialCost,
          machineCost: totalMachineCost,
          labourCost: totalLabourCost,
          outsideProcessCost: totalOutsideCost,
          totalCost: grandTotal,
        },
        update: {
          labourCost: totalLabourCost,
          machineCost: totalMachineCost,
          materialConsumptionCost: totalMaterialCost,
          outsideProcessCost: totalOutsideCost,
          totalCost: grandTotal,
        },
      });
    } catch (err) {
      // Ignore background recalculation errors
    }
  }

  private async syncMissingDesignLogCosts(projectId: string) {
    try {
      const logs: any[] = await (this.prisma as any).designWorkLog.findMany({
        where: { projectId },
      });

      for (const log of logs) {
        const existingEvent = await this.prisma.projectCostEvent.findFirst({
          where: { referenceDocType: 'DESIGN_WORK_LOG', referenceDocId: log.id },
        });

        if (!existingEvent && Number(log.hoursSpent) > 0) {
          const hourlyRate = await this.getDesignerHourlyRate(log.designerName, log.designerId);
          const costAmount = Number(log.hoursSpent) * hourlyRate;

          await this.prisma.projectCostEvent.create({
            data: {
              projectId,
              costType: 'LABOUR_COST',
              description: `Designer ${log.designerName} logged ${log.hoursSpent} hrs for ${log.workStage} (${log.partName || 'CAD Design'}) @ ₹${hourlyRate}/hr`,
              amount: costAmount,
              referenceDocType: 'DESIGN_WORK_LOG',
              referenceDocId: log.id,
              createdBy: log.createdBy || log.designerName,
            },
          });
        }
      }

      await this.recalculateProjectCostSummary(projectId);
    } catch (err) {
      // Ignore background sync errors
    }
  }

  async getDesignLogs(
    projectId: string,
    query?: { search?: string; designer?: string; workStage?: string; status?: string }
  ) {
    await this.syncMissingDesignLogCosts(projectId);

    const where: any = { projectId };

    if (query?.designer && query.designer !== 'ALL') {
      where.designerName = query.designer;
    }
    if (query?.workStage && query.workStage !== 'ALL') {
      where.workStage = query.workStage;
    }
    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query?.search) {
      where.OR = [
        { designerName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { partName: { contains: query.search, mode: 'insensitive' } },
        { drawingNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return (this.prisma as any).designWorkLog.findMany({
      where,
      orderBy: { workDate: 'desc' },
    });
  }

  async createDesignLog(projectId: string, dto: CreateDesignLogDto, userId?: string) {
    const workDate = dto.workDate ? new Date(dto.workDate) : new Date();
    const hoursSpent = Number(dto.hoursSpent) || 0;

    const log = await (this.prisma as any).designWorkLog.create({
      data: {
        projectId,
        designerName: dto.designerName,
        designerId: dto.designerId,
        workStage: dto.workStage,
        partName: dto.partName,
        drawingNumber: dto.drawingNumber,
        revision: dto.revision,
        description: dto.description,
        workDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        hoursSpent,
        status: dto.status || 'COMPLETED',
        cadFileUrl: dto.cadFileUrl,
        remarks: dto.remarks,
        createdBy: userId,
      },
    });

    // 1. Calculate labor cost for designer work
    const hourlyRate = await this.getDesignerHourlyRate(dto.designerName, dto.designerId);
    const labourCostAmount = hoursSpent * hourlyRate;

    if (labourCostAmount > 0) {
      // 2. Record ProjectCostEvent for Financial Audits & Breakdown
      await this.prisma.projectCostEvent.create({
        data: {
          projectId,
          costType: 'LABOUR_COST',
          description: `Designer ${dto.designerName} logged ${hoursSpent} hrs for ${dto.workStage} (${dto.partName || 'CAD Design'}) @ ₹${hourlyRate}/hr`,
          amount: labourCostAmount,
          referenceDocType: 'DESIGN_WORK_LOG',
          referenceDocId: log.id,
          createdBy: userId || dto.designerName,
        },
      });

      // 3. Rollup cost to ProjectCostSummary (Finance Section)
      await this.recalculateProjectCostSummary(projectId);
    }

    // 4. Also log activity in Project Timeline/Activity for transparency
    await this.prisma.projectActivity.create({
      data: {
        projectId,
        action: 'DESIGN_WORK_LOGGED',
        description: `Designer ${dto.designerName} logged ${hoursSpent} hrs for ${dto.workStage} (${dto.partName || 'General'}). Cost: ₹${labourCostAmount.toFixed(2)}`,
        performedBy: userId || dto.designerName,
      },
    });

    return log;
  }

  async updateDesignLog(logId: string, dto: UpdateDesignLogDto, userId?: string) {
    const workDate = dto.workDate ? new Date(dto.workDate) : undefined;

    const oldLog = await (this.prisma as any).designWorkLog.findUnique({ where: { id: logId } });
    if (!oldLog) throw new NotFoundException(`Designer log with ID ${logId} not found.`);

    const oldCostEvent = await this.prisma.projectCostEvent.findFirst({
      where: { referenceDocType: 'DESIGN_WORK_LOG', referenceDocId: logId },
    });

    const updatedLog = await (this.prisma as any).designWorkLog.update({
      where: { id: logId },
      data: {
        designerName: dto.designerName,
        designerId: dto.designerId,
        workStage: dto.workStage,
        partName: dto.partName,
        drawingNumber: dto.drawingNumber,
        revision: dto.revision,
        description: dto.description,
        ...(workDate && { workDate }),
        startTime: dto.startTime,
        endTime: dto.endTime,
        hoursSpent: dto.hoursSpent,
        status: dto.status,
        cadFileUrl: dto.cadFileUrl,
        remarks: dto.remarks,
      },
    });

    // Calculate updated cost & financial adjustment
    const newHours = Number(dto.hoursSpent ?? oldLog.hoursSpent) || 0;
    const hourlyRate = await this.getDesignerHourlyRate(dto.designerName || oldLog.designerName, dto.designerId || oldLog.designerId);
    const newAmount = newHours * hourlyRate;

    if (oldCostEvent) {
      await this.prisma.projectCostEvent.update({
        where: { id: oldCostEvent.id },
        data: {
          description: `Designer ${dto.designerName || oldLog.designerName} logged ${newHours} hrs for ${dto.workStage || oldLog.workStage} (${dto.partName || oldLog.partName || 'CAD Design'}) @ ₹${hourlyRate}/hr`,
          amount: newAmount,
        },
      });
    } else if (newAmount > 0) {
      await this.prisma.projectCostEvent.create({
        data: {
          projectId: oldLog.projectId,
          costType: 'LABOUR_COST',
          description: `Designer ${dto.designerName || oldLog.designerName} logged ${newHours} hrs for ${dto.workStage || oldLog.workStage} (${dto.partName || oldLog.partName || 'CAD Design'}) @ ₹${hourlyRate}/hr`,
          amount: newAmount,
          referenceDocType: 'DESIGN_WORK_LOG',
          referenceDocId: logId,
          createdBy: userId || dto.designerName,
        },
      });
    }

    await this.recalculateProjectCostSummary(oldLog.projectId);

    return updatedLog;
  }

  async deleteDesignLog(logId: string, userId?: string) {
    const oldLog = await (this.prisma as any).designWorkLog.findUnique({ where: { id: logId } });
    if (!oldLog) return;

    const oldCostEvent = await this.prisma.projectCostEvent.findFirst({
      where: { referenceDocType: 'DESIGN_WORK_LOG', referenceDocId: logId },
    });

    const deleted = await (this.prisma as any).designWorkLog.delete({
      where: { id: logId },
    });

    if (oldCostEvent) {
      await this.prisma.projectCostEvent.delete({
        where: { id: oldCostEvent.id },
      });
    }

    if (oldLog.projectId) {
      await this.recalculateProjectCostSummary(oldLog.projectId);
    }

    return deleted;
  }

  async getDesignSummary(projectId: string) {
    await this.syncMissingDesignLogCosts(projectId);

    const logs: any[] = await (this.prisma as any).designWorkLog.findMany({
      where: { projectId },
    });

    const totalHours = logs.reduce((sum: number, log: any) => sum + Number(log.hoursSpent || 0), 0);
    const uniqueDesigners = Array.from(new Set(logs.map((l: any) => l.designerName))).filter(Boolean);
    const completedTasks = logs.filter((l: any) => l.status === 'COMPLETED').length;
    const drawingsCount = Array.from(new Set(logs.map((l: any) => l.drawingNumber))).filter(Boolean).length;
    const latestLog = logs.length > 0 ? [...logs].sort((a: any, b: any) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime())[0] : null;

    return {
      totalLogs: logs.length,
      totalHours,
      activeDesignersCount: uniqueDesigners.length,
      designersList: uniqueDesigners,
      completedTasks,
      drawingsCount,
      latestActivity: latestLog
        ? {
            designerName: latestLog.designerName,
            workStage: latestLog.workStage,
            workDate: latestLog.workDate,
            description: latestLog.description,
          }
        : null,
    };
  }
}
