// @ts-nocheck
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

      // 1. Ensure projectNumber uses KTD- prefix
      let formattedProjectNumber = (dto.projectNumber || '').trim();
      if (!formattedProjectNumber.toUpperCase().startsWith('KTD-')) {
        const rawNum = formattedProjectNumber.replace(/^KTD-?/i, '');
        formattedProjectNumber = `KTD-${rawNum}`;
      }

      // Create the project
      const project = await tx.project.create({
        data: {
          projectNumber: formattedProjectNumber,
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
          rfqHeaderId: dto.rfqHeaderId || undefined,
        },
      });

      // If created from an RFQ, link back to RFQ and update its status
      let rfqNumber = '';
      if (dto.rfqHeaderId) {
        try {
          const rfq = await tx.rfqHeader.update({
            where: { id: dto.rfqHeaderId },
            data: {
              projectId: project.id,
              status: 'WON',
              updatedBy: userId,
            },
            include: { quotations: { orderBy: { revision: 'desc' }, take: 1 } },
          });
          rfqNumber = rfq.rfqNumber;
        } catch {}
      }

      // 2. Initialize Project Cost Summary (Outcome Layer)
      const initialRevenue = Number(dto.revenue ?? dto.contractValue ?? 0);
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
          revenue: initialRevenue,
          profitability: initialRevenue,
        },
      });

      // 3. Record Initial Project Timeline State (Event Layer)
      await tx.projectTimeline.create({
        data: {
          projectId: project.id,
          fromStage: ProjectStatus.ENGINEERING,
          toStage: ProjectStatus.ENGINEERING,
          transitionedBy: userId || 'SYSTEM',
          remarks: rfqNumber ? `Project initialized from won RFQ ${rfqNumber}` : 'Project initialized via Customer PO registration',
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

  async getDashboardMetrics(plantId?: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const elevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 10, 1);

    const projectFilter = plantId ? { plantId } : undefined;

    const [
      totalProjects,
      mtdInvoicesAgg,
      annualSetting,
      activePipelineAgg,
      ytdInvoicesAgg,
      openInvoicesAgg,
      activeJobs,
      totalMachines,
      delayedProjectsCount,
      recentProjects,
      olderProjects,
      historyInvoices,
      grnItemsAgg,
      grnTotalReceiptsCount,
    ] = await Promise.all([
      // Total Projects count
      this.prisma.project.count({ where: projectFilter }),

      // MTD Invoices (Sum subtotal & totalAmount)
      this.prisma.invoiceHeader.aggregate({
        where: {
          createdAt: { gte: firstDayOfMonth },
          ...(plantId ? { project: { plantId } } : {}),
        },
        _sum: { totalAmount: true, subtotal: true },
      }),

      // Annual target preference
      this.prisma.systemSetting.findUnique({
        where: { settingKey: 'estimated_revenue_target' },
      }),

      // Active Pipeline Estimated Value
      this.prisma.projectCostSummary.aggregate({
        where: {
          project: {
            currentStage: { notIn: ['CANCELLED', 'CLOSED'] },
            ...(plantId ? { plantId } : {}),
          },
        },
        _sum: { estimatedMaterialCost: true, revenue: true },
      }),

      // YTD Revenue
      this.prisma.invoiceHeader.aggregate({
        where: {
          createdAt: { gte: firstDayOfYear },
          ...(plantId ? { project: { plantId } } : {}),
        },
        _sum: { totalAmount: true },
      }),

      // Open (Unpaid) Invoices
      this.prisma.invoiceHeader.aggregate({
        where: {
          paymentStatus: { not: 'PAID' },
          ...(plantId ? { project: { plantId } } : {}),
        },
        _sum: { totalAmount: true },
      }),

      // Active Distinct Machines in use
      this.prisma.jobCard.findMany({
        where: {
          status: 'IN_PROGRESS',
          ...(plantId ? { project: { plantId } } : {}),
        },
        select: { machineId: true },
        distinct: ['machineId'],
      }),

      // Total machines count
      this.prisma.machine.count({ where: plantId ? { plantId } : undefined }),

      // Delayed projects count
      this.prisma.project.count({
        where: {
          targetDeliveryDate: { lt: now },
          currentStage: { not: 'CLOSED' },
          ...(plantId ? { plantId } : {}),
        },
      }),

      // Trends (Last 30 vs 30-60 days)
      this.prisma.project.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          ...(plantId ? { plantId } : {}),
        },
      }),
      this.prisma.project.count({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          ...(plantId ? { plantId } : {}),
        },
      }),

      // Revenue History for last 11 months (minimal field projection)
      this.prisma.invoiceHeader.findMany({
        where: {
          createdAt: { gte: elevenMonthsAgo },
          ...(plantId ? { project: { plantId } } : {}),
        },
        select: { invoiceDate: true, totalAmount: true },
      }),

      // Total GRN Purchase Value
      this.prisma.goodsReceiptItem.aggregate({
        where: plantId ? { grnHeader: { project: { plantId } } } : undefined,
        _sum: { total: true, actualMaterialCost: true, basicCost: true },
        _count: { id: true },
      }),

      // Total GRN headers count
      this.prisma.goodsReceiptHeader.count({
        where: plantId ? { project: { plantId } } : undefined,
      }),
    ]);

    const mtdRevenue = Number(mtdInvoicesAgg._sum.totalAmount || 0);
    const mtdSalesWithoutGst = Number(mtdInvoicesAgg._sum.subtotal || 0);

    const annualTarget = annualSetting && !isNaN(Number(annualSetting.settingValue))
      ? Number(annualSetting.settingValue)
      : 150000000;

    const monthlyTarget = Math.round(annualTarget / 12);
    const monthlyRemaining = Math.max(0, monthlyTarget - mtdRevenue);

    const totalPipelineEstimatedValue =
      Number(activePipelineAgg._sum.estimatedMaterialCost || 0) +
      Number(activePipelineAgg._sum.revenue || 0);

    const ytdRevenue = Number(ytdInvoicesAgg._sum.totalAmount || 0);
    const yearlyProjectedRevenue = ytdRevenue + totalPipelineEstimatedValue;
    const openInvoices = Number(openInvoicesAgg._sum.totalAmount || 0);

    const activeMachines = activeJobs.filter((j) => j.machineId).length;
    const machineLoad = totalMachines > 0 ? Math.round((activeMachines / totalMachines) * 100) : 0;

    const overallYield =
      totalProjects > 0
        ? Math.max(0, 100 - Math.round((delayedProjectsCount / totalProjects) * 100))
        : 0;

    const yieldTrend =
      olderProjects > 0
        ? Number((((recentProjects - olderProjects) / olderProjects) * 10).toFixed(1))
        : 0;
    const revenueTrend =
      olderProjects > 0
        ? Number((((recentProjects - olderProjects) / olderProjects) * 100).toFixed(1))
        : 0;

    const revenueHistory = new Array(11).fill(0);
    historyInvoices.forEach((inv) => {
      if (inv.invoiceDate) {
        const monthDiff =
          (now.getFullYear() - inv.invoiceDate.getFullYear()) * 12 +
          (now.getMonth() - inv.invoiceDate.getMonth());
        if (monthDiff >= 0 && monthDiff < 11) {
          revenueHistory[10 - monthDiff] += Number(inv.totalAmount || 0) / 1000; // in thousands
        }
      }
    });

    const totalGrnPurchaseValue =
      Number(grnItemsAgg._sum.total || 0) ||
      Number(grnItemsAgg._sum.actualMaterialCost || 0) ||
      Number(grnItemsAgg._sum.basicCost || 0);

    const grnMaterialCount = Number(grnItemsAgg._count.id || 0);

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

  async resolveProjectId(idOrCode: string): Promise<string> {
    if (!idOrCode) return idOrCode;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    if (isUuid) return idOrCode;
    
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [
          { projectNumber: idOrCode },
          { projectNumber: { equals: idOrCode, mode: 'insensitive' } }
        ]
      },
      select: { id: true }
    });

    return project ? project.id : idOrCode;
  }

  async findOne(idOrCode: string) {
    const id = await this.resolveProjectId(idOrCode);
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
        rfqHeader: {
          include: {
            items: {
              include: {
                costEstimate: true,
              },
            },
            quotations: {
              include: {
                items: true,
              },
              orderBy: { revision: 'desc' },
            },
          },
        },
        rfqHeaders: {
          include: {
            items: true,
            quotations: {
              orderBy: { revision: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getInventoryBatches(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.inventoryBatch.findMany({
      where: {
        OR: [
          {
            grnItem: {
              grnHeader: {
                projectId: targetProjectId,
              }
            }
          },
          {
            inventoryTransactions: {
              some: {
                projectId: targetProjectId,
              }
            }
          }
        ],
        status: 'AVAILABLE',
        availableQty: { gt: 0 }
      },
      include: {
        material: true,
        grnItem: {
          include: {
            poItem: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  private async assertProjectNotClosed(idOrCode: string) {
    const id = await this.resolveProjectId(idOrCode);
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { currentStage: true, status: true }
    });
    if (project && (project.currentStage === 'CLOSED' || project.status === 'CLOSED' || project.status === 'COMPLETED')) {
      throw new BadRequestException('Project is CLOSED and read-only. All audit records are locked.');
    }
  }

  async update(idOrCode: string, dto: any, userId?: string) {
    const id = await this.resolveProjectId(idOrCode);
    await this.assertProjectNotClosed(id);
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
    const targetProjectId = await this.resolveProjectId(id);
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id: targetProjectId } });
      const fromStage = project.currentStage;

      if (fromStage === toStage) {
        throw new BadRequestException('Project is already in this stage.');
      }

      // Update project stage
      const updatedProject = await tx.project.update({
        where: { id: targetProjectId },
        data: {
          currentStage: toStage,
          ...(toStage === 'CLOSED' ? { status: 'CLOSED', closedAt: new Date(), progress: 100 } : {}),
          updatedBy: userId,
        },
      });

      // Record stage transition
      await tx.projectTimeline.create({
        data: {
          projectId: targetProjectId,
          fromStage,
          toStage,
          transitionedBy: userId || 'SYSTEM',
          remarks: remarks || `Workflow advanced to ${toStage}`,
        },
      });

      // Record activity log
      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'STAGE_CHANGED',
          description: `Advanced from ${fromStage} to ${toStage}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return updatedProject;
    });
  }

  async completeProduction(id: string, remarks?: string, userId?: string) {
    const targetProjectId = await this.resolveProjectId(id);
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({
        where: { id: targetProjectId },
      });

      const fromStage = project.currentStage;
      let msdrCount = 0;
      try {
        msdrCount = await (tx as any).msdrHeader.count({ where: { projectId: targetProjectId } });
      } catch {
        /* skip if table not found */
      }

      // 1. Advance project stage to INSPECTION (Quality Inspection stage)
      const updatedProject = await tx.project.update({
        where: { id: targetProjectId },
        data: {
          currentStage: ProjectStatus.INSPECTION,
          progress: 85,
          updatedBy: userId,
        },
      });

      // 2. Record stage transition in project timeline
      const timelineRemarks = remarks 
        ? remarks 
        : `Production phase marked completed after ${msdrCount} shopfloor daily report log(s). Advanced to Quality Inspection.`;

      await tx.projectTimeline.create({
        data: {
          projectId: targetProjectId,
          fromStage,
          toStage: ProjectStatus.INSPECTION,
          transitionedBy: userId || 'SYSTEM',
          remarks: timelineRemarks,
        },
      });

      // 3. Record project activity log
      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'PRODUCTION_COMPLETED',
          description: `Production phase marked complete (${msdrCount} daily report logs). Advanced stage from ${fromStage} to INSPECTION.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 4. Update status of any related job cards to COMPLETED
      try {
        await (tx as any).jobCard.updateMany({
          where: { projectId: targetProjectId, status: { not: 'COMPLETED' } },
          data: { status: 'COMPLETED' },
        });
      } catch {
        /* skip if job card table not active */
      }

      return updatedProject;
    });
  }

  async getTimeline(id: string) {
    const targetProjectId = await this.resolveProjectId(id);
    return this.prisma.projectTimeline.findMany({
      where: { projectId: targetProjectId },
      orderBy: { transitionedAt: 'asc' },
    });
  }

  async getActivities(id: string, page: number = 1, limit: number = 20) {
    const targetProjectId = await this.resolveProjectId(id);
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.projectActivity.findMany({
        where: { projectId: targetProjectId },
        orderBy: { performedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.projectActivity.count({
        where: { projectId: targetProjectId },
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
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.ncrReport.findMany({
      where: { projectId: targetProjectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async closeNcr(projectId: string, ncrId: string, data: { disposition?: string; rootCause?: string }, userId?: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.$transaction(async (tx) => {
      const ncr = await tx.ncrReport.findFirstOrThrow({ where: { id: ncrId, projectId: targetProjectId } });
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
          projectId: targetProjectId,
          action: 'NCR_CLOSED',
          description: `NCR ${ncr.ncrNumber} closed. Disposition: ${data.disposition || 'N/A'}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return closed;
    });
  }

  async getTasks(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.projectTask.findMany({
      where: { projectId: targetProjectId },
      orderBy: { startDate: 'asc' },
    });
  }

  // --- Revision Engine ---
  
  async getReopenImpact(id: string) {
    const targetProjectId = await this.resolveProjectId(id);
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: targetProjectId },
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
    const targetProjectId = await this.resolveProjectId(id);
    const impact = await this.getReopenImpact(targetProjectId);
    if (impact.isBlocked) {
      throw new BadRequestException(impact.blockReason || "Cannot reopen engineering: stage constraints violated.");
    }

    return this.prisma.$transaction(async (tx) => {
      // Get current stage before changing it
      const currentProj = await tx.project.findUniqueOrThrow({ where: { id: targetProjectId } });

      // 1. Reopen Project Stage
      const project = await tx.project.update({
        where: { id: targetProjectId },
        data: { currentStage: 'ENGINEERING', updatedBy: userId },
      });

      // 2. Put POs on Hold
      await tx.purchaseOrderHeader.updateMany({
        where: { projectId: targetProjectId, status: { in: ['DRAFT', 'ISSUED'] } },
        data: { status: 'ON_HOLD', remarks: 'Engineering Reopened - Verify Revision' },
      });

      // 3. Obsolete current Routing (forcing a new plan)
      await tx.routingHeader.updateMany({
        where: { projectId: targetProjectId, status: 'APPROVED' },
        data: { status: 'OBSOLETE', remarks: 'Engineering Reopened' },
      });

      // 4. Log Activity
      await tx.projectTimeline.create({
        data: {
          projectId: targetProjectId,
          fromStage: currentProj.currentStage,
          toStage: 'ENGINEERING',
          transitionedBy: userId || 'SYSTEM',
          remarks: 'Engineering Reopened via Revision Engine.',
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'ENGINEERING_REOPENED',
          description: `Engineering Reopened. POs placed ON_HOLD. Routing obsoleted.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return project;
    });
  }

  async createTask(projectId: string, data: any, userId?: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    await this.assertProjectNotClosed(targetProjectId);
    const { title, dueDate, priority, estimatedHours, remarks, ...rest } = data;
    return this.prisma.projectTask.create({
      data: {
        taskName: title || rest.taskName,
        description: rest.description,
        assignedTo: rest.assignedTo,
        startDate: rest.startDate ? new Date(rest.startDate) : null,
        endDate: dueDate ? new Date(dueDate) : (rest.endDate ? new Date(rest.endDate) : null),
        status: rest.status || 'PENDING',
        dependsOn: rest.dependsOn,
        projectId: targetProjectId,
        createdBy: userId,
      },
    });
  }

  async updateTask(taskId: string, data: any, userId?: string) {
    const { title, dueDate, priority, estimatedHours, remarks, ...rest } = data;
    const updateData: any = { updatedBy: userId };
    if (title !== undefined) updateData.taskName = title;
    if (rest.taskName !== undefined) updateData.taskName = rest.taskName;
    if (rest.description !== undefined) updateData.description = rest.description;
    if (rest.assignedTo !== undefined) updateData.assignedTo = rest.assignedTo;
    if (rest.startDate !== undefined) updateData.startDate = rest.startDate ? new Date(rest.startDate) : null;
    if (dueDate !== undefined) updateData.endDate = dueDate ? new Date(dueDate) : null;
    if (rest.endDate !== undefined) updateData.endDate = rest.endDate ? new Date(rest.endDate) : null;
    if (rest.status !== undefined) updateData.status = rest.status;
    if (rest.dependsOn !== undefined) updateData.dependsOn = rest.dependsOn;

    return this.prisma.projectTask.update({
      where: { id: taskId },
      data: updateData,
    });
  }

  async deleteTask(taskId: string, userId?: string) {
    return this.prisma.projectTask.delete({
      where: { id: taskId },
    });
  }

  // --- Closing Engine ---
  async closeProject(projectId: string, userId?: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id: targetProjectId } });

      // 2. Validate No Open NCRs
      const openNcr = await tx.ncrReport.findFirst({
        where: { projectId: targetProjectId, status: 'OPEN' }
      });
      if (openNcr) {
        throw new BadRequestException('Cannot close project with an OPEN NCR.');
      }

      // 3. Finalize and Close
      const closedProject = await tx.project.update({
        where: { id: targetProjectId },
        data: {
          currentStage: 'CLOSED',
          closedAt: new Date(),
          updatedBy: userId
        }
      });

      await tx.projectTimeline.create({
        data: {
          projectId: targetProjectId,
          fromStage: project.currentStage,
          toStage: 'CLOSED',
          transitionedBy: userId || 'SYSTEM',
          remarks: 'Project financially and operationally closed.',
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'PROJECT_CLOSED',
          description: `Project fully closed. Final Cost and Profit locked.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return closedProject;
    });
  }

  // --- Project Completion Engine (from Dispatch page or Overview) ---
  async completeProject(projectId: string, remarks?: string, userId?: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({
        where: { id: targetProjectId },
        include: { dispatchNotes: true },
      });

      // Guard: Cannot complete if already CLOSED or CANCELLED
      if (project.currentStage === 'CLOSED' || project.currentStage === 'CANCELLED') {
        throw new BadRequestException('Project is already closed or cancelled.');
      }

      // Guard: No open NCRs
      const openNcr = await tx.ncrReport.findFirst({
        where: { projectId: targetProjectId, status: 'OPEN' },
      });
      if (openNcr) {
        throw new BadRequestException('Cannot complete project with an OPEN NCR.');
      }

      const fromStage = project.currentStage;

      // 1. Update project to CLOSED with completion metadata
      const completedProject = await tx.project.update({
        where: { id: targetProjectId },
        data: {
          currentStage: 'CLOSED',
          status: 'CLOSED',
          closedAt: new Date(),
          actualDeliveryDate: new Date(),
          progress: 100,
          updatedBy: userId,
        },
      });

      // 2. Record stage transition in project timeline
      await tx.projectTimeline.create({
        data: {
          projectId: targetProjectId,
          fromStage,
          toStage: 'CLOSED',
          transitionedBy: userId || 'SYSTEM',
          remarks: remarks || `Project marked as completed. All deliverables fulfilled.`,
        },
      });

      // 3. Record project activity log
      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'PROJECT_COMPLETED',
          description: `Project marked as completed. Stage transitioned from ${fromStage} to CLOSED.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 4. Finalize cost summary profitability snapshot
      const summary = await tx.projectCostSummary.findUnique({ where: { projectId: targetProjectId } });
      if (summary) {
        const finalRevenue = Number(summary.revenue || 0);
        const finalCost = Number(summary.totalCost || 0);
        await tx.projectCostSummary.update({
          where: { projectId: targetProjectId },
          data: {
            profitability: finalRevenue - finalCost,
          },
        });
      }

      return completedProject;
    });
  }

  // --- Dispatch & Invoicing Engine ---
  async createDispatchNote(projectId: string, dto: any, userId?: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id: targetProjectId } });
      const dispatchNumber = `DC-${Date.now().toString().slice(-6)}`;

      const dispatchNote = await tx.dispatchNote.create({
        data: {
          projectId: targetProjectId,
          customerId: project.customerId,
          dispatchNumber,
          vehicleNumber: dto.vehicleNumber,
          driverDetails: dto.driverName ? `${dto.driverName} (${dto.driverPhone || ''})` : null,
          transporterName: dto.transporterName,
          dispatchQty: Number(dto.quantity) || 1,
          remarks: dto.remarks,
          createdBy: userId,
          items: {
            create: [
              {
                partDescription: dto.itemDescription || project.partName,
                quantity: Number(dto.quantity) || 1,
                remarks: dto.remarks,
                createdBy: userId,
              },
            ],
          },
        },
        include: { items: true },
      });

      // Update stage to DISPATCHED
      await tx.project.update({
        where: { id: targetProjectId },
        data: { currentStage: 'DISPATCHED' },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'DISPATCH_NOTE_CREATED',
          description: `Delivery Challan ${dispatchNumber} created for vehicle ${dto.vehicleNumber || 'transport'}.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return dispatchNote;
    });
  }

  async createInvoice(projectId: string, dto: any, userId?: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({
        where: { id: targetProjectId },
        include: { dispatchNotes: true },
      });

      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      const basicValue = Number(dto.basicValue) || 0;
      const gstPercent = Number(dto.gstPercent) || 18;
      const taxAmount = (basicValue * gstPercent) / 100;
      const totalAmount = basicValue + taxAmount;

      const invoice = await tx.invoiceHeader.create({
        data: {
          projectId: targetProjectId,
          dispatchNoteId: project.dispatchNotes[0]?.id || null,
          invoiceNumber,
          subtotal: basicValue,
          taxAmount,
          totalAmount,
          remarks: dto.remarks,
          createdBy: userId,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'INVOICE_ISSUED',
          description: `Tax Invoice ${invoiceNumber} issued for ₹${totalAmount.toLocaleString()}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return invoice;
    });
  }

  async getCostEvents(id: string) {
    const targetProjectId = await this.resolveProjectId(id);
    return this.prisma.projectCostEvent.findMany({
      where: { projectId: targetProjectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // --- Deletion Engine ---
  async remove(id: string, userId?: string) {
    const targetProjectId = await this.resolveProjectId(id);
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUniqueOrThrow({ where: { id: targetProjectId } });

      // 1. Quality, NCRs & Inspections
      await tx.ncrReport.deleteMany({ where: { projectId: targetProjectId } });
      const inspections = await tx.inspectionHeader.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (inspections.length > 0) {
        const inspIds = inspections.map(i => i.id);
        await tx.inspectionMeasurement.deleteMany({ where: { inspectionHeaderId: { in: inspIds } } });
        await tx.inspectionHeader.deleteMany({ where: { projectId: targetProjectId } });
      }

      // 2. Dispatch Notes
      const dispatches = await tx.dispatchNote.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (dispatches.length > 0) {
        const dIds = dispatches.map(d => d.id);
        await tx.dispatchItem.deleteMany({ where: { dispatchNoteId: { in: dIds } } });
        await tx.dispatchNote.deleteMany({ where: { projectId: targetProjectId } });
      }

      // 3. Invoices & Payments
      const invoices = await tx.invoiceHeader.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (invoices.length > 0) {
        const invIds = invoices.map(i => i.id);
        await tx.invoicePayment.deleteMany({ where: { invoiceHeaderId: { in: invIds } } });
        await tx.invoiceItem.deleteMany({ where: { invoiceHeaderId: { in: invIds } } });
        await tx.invoiceHeader.deleteMany({ where: { projectId: targetProjectId } });
      }

      // 4. Shopfloor Jobs, MSDRs, Assembly & Trials
      await tx.jobCardTimeLog.deleteMany({ where: { jobCard: { projectId: targetProjectId } } });
      await tx.jobCard.deleteMany({ where: { projectId: targetProjectId } });
      await tx.msdrOperation.deleteMany({ where: { msdrHeader: { projectId: targetProjectId } } });
      await tx.msdrHeader.deleteMany({ where: { projectId: targetProjectId } });
      await tx.machineShopDailyReport.deleteMany({ where: { projectId: targetProjectId } });
      await tx.designWorkLog.deleteMany({ where: { projectId: targetProjectId } });
      await tx.projectTrial.deleteMany({ where: { projectId: targetProjectId } });
      await tx.assemblyComponent.deleteMany({ where: { assemblyHeader: { projectId: targetProjectId } } });
      await tx.assemblyHeader.deleteMany({ where: { projectId: targetProjectId } });
      await tx.maintenanceTicket.deleteMany({ where: { projectId: targetProjectId } });
      await tx.wipLedger.deleteMany({ where: { projectId: targetProjectId } });
      await tx.productionSchedule.deleteMany({ where: { projectId: targetProjectId } });
      await tx.productionOperation.deleteMany({ where: { productionBatch: { projectId: targetProjectId } } });
      await tx.productionBatch.deleteMany({ where: { projectId: targetProjectId } });

      // 5. Material Issues & Inventory Transactions
      const issues = await tx.materialIssueHeader.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (issues.length > 0) {
        const issueIds = issues.map(i => i.id);
        await tx.materialIssueItem.deleteMany({ where: { issueHeaderId: { in: issueIds } } });
        await tx.materialIssueHeader.deleteMany({ where: { projectId: targetProjectId } });
      }
      await tx.inventoryReservation.deleteMany({ where: { projectId: targetProjectId } });
      await tx.inventoryTransaction.deleteMany({ where: { projectId: targetProjectId } });

      // 6. Subcontracting
      const subReceipts = await tx.subcontractReceipt.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (subReceipts.length > 0) {
        const srIds = subReceipts.map(sr => sr.id);
        await tx.subcontractReceiptItem.deleteMany({ where: { subcontractReceiptId: { in: srIds } } });
        await tx.subcontractReceipt.deleteMany({ where: { projectId: targetProjectId } });
      }
      const subOrders = await tx.subcontractOrder.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (subOrders.length > 0) {
        const soIds = subOrders.map(so => so.id);
        await tx.subcontractOrderItem.deleteMany({ where: { subcontractOrderId: { in: soIds } } });
        await tx.subcontractOrder.deleteMany({ where: { projectId: targetProjectId } });
      }

      // 7. Goods Receipts & Inventory Batches
      const grns = await tx.goodsReceiptHeader.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (grns.length > 0) {
        const grnIds = grns.map(g => g.id);
        const grnItems = await tx.goodsReceiptItem.findMany({ where: { grnHeaderId: { in: grnIds } }, select: { id: true } });
        const grnItemIds = grnItems.map(gi => gi.id);
        if (grnItemIds.length > 0) {
          await tx.inventoryBatch.deleteMany({ where: { grnItemId: { in: grnItemIds } } });
        }
        await tx.goodsReceiptItem.deleteMany({ where: { grnHeaderId: { in: grnIds } } });
        await tx.goodsReceiptHeader.deleteMany({ where: { projectId: targetProjectId } });
      }

      // 8. Purchase Orders & Requests
      const pos = await tx.purchaseOrderHeader.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (pos.length > 0) {
        const poIds = pos.map(p => p.id);
        await tx.purchaseOrderItem.deleteMany({ where: { poHeaderId: { in: poIds } } });
        await tx.purchaseOrderHeader.deleteMany({ where: { projectId: targetProjectId } });
      }
      const prs = await tx.purchaseRequestHeader.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (prs.length > 0) {
        const prIds = prs.map(p => p.id);
        await tx.purchaseRequestItem.deleteMany({ where: { prHeaderId: { in: prIds } } });
        await tx.purchaseRequestHeader.deleteMany({ where: { projectId: targetProjectId } });
      }

      // 9. Routing & BOMs
      const routings = await tx.routingHeader.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (routings.length > 0) {
        const rIds = routings.map(r => r.id);
        await tx.routingOperation.deleteMany({ where: { routingHeaderId: { in: rIds } } });
        await tx.routingHeader.deleteMany({ where: { projectId: targetProjectId } });
      }
      const boms = await tx.billOfMaterialHeader.findMany({ where: { projectId: targetProjectId }, select: { id: true } });
      if (boms.length > 0) {
        const bomIds = boms.map(b => b.id);
        await tx.billOfMaterialItem.deleteMany({ where: { bomHeaderId: { in: bomIds } } });
        await tx.billOfMaterialHeader.deleteMany({ where: { projectId: targetProjectId } });
      }

      // 10. Financial Summary, Cost Events, Approvals, Activities, Documents, Tasks, Teams, Budget, Account Entries, Timeline
      await tx.materialRequirement.deleteMany({ where: { projectId: targetProjectId } });
      await tx.planningRun.deleteMany({ where: { projectId: targetProjectId } });
      await tx.projectCostEvent.deleteMany({ where: { projectId: targetProjectId } });
      await tx.projectCostSummary.deleteMany({ where: { projectId: targetProjectId } });
      await tx.approval.deleteMany({ where: { projectId: targetProjectId } });
      await tx.projectActivity.deleteMany({ where: { projectId: targetProjectId } });
      await tx.projectDocument.deleteMany({ where: { projectId: targetProjectId } });
      await tx.projectTask.deleteMany({ where: { projectId: targetProjectId } });
      await tx.projectTeam.deleteMany({ where: { projectId: targetProjectId } });
      await tx.projectBudget.deleteMany({ where: { projectId: targetProjectId } });
      await tx.accountEntry.deleteMany({ where: { projectId: targetProjectId } });
      await tx.projectTimeline.deleteMany({ where: { projectId: targetProjectId } });

      // 11. Finally delete the Project record
      const deletedProject = await tx.project.delete({
        where: { id: targetProjectId }
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
      const targetProjectId = await this.resolveProjectId(projectId);
      // 1. Clean up orphaned design cost events whose design log was deleted
      const designCostEvents = await this.prisma.projectCostEvent.findMany({
        where: { projectId: targetProjectId, referenceDocType: 'DESIGN_WORK_LOG' },
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
        where: { projectId: targetProjectId, costType: 'LABOUR_COST' },
      });
      const totalLabourCost = labourEvents.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // 3. Sum up active MACHINE_COST events
      const machineEvents = await this.prisma.projectCostEvent.findMany({
        where: { projectId: targetProjectId, costType: 'MACHINE_COST' },
      });
      const totalMachineCost = machineEvents.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // 4. Sum up active MATERIAL_CONSUMPTION events
      const materialEvents = await this.prisma.projectCostEvent.findMany({
        where: { projectId: targetProjectId, costType: 'MATERIAL_CONSUMPTION' },
      });
      const totalMaterialCost = materialEvents.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // 5. Sum up active OUTSIDE_PROCESS events
      const outsideEvents = await this.prisma.projectCostEvent.findMany({
        where: { projectId: targetProjectId, costType: 'OUTSIDE_PROCESS' },
      });
      const totalOutsideCost = outsideEvents.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // 6. Sum up active DISPATCH_COST events
      const dispatchEvents = await this.prisma.projectCostEvent.findMany({
        where: { projectId: targetProjectId, costType: 'DISPATCH_COST' },
      });
      const totalDispatchCost = dispatchEvents.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // 7. Calculate total revenue from all issued invoices for the project
      const projectInvoices = await this.prisma.invoiceHeader.findMany({
        where: { projectId: targetProjectId },
      });
      const totalRevenue = projectInvoices.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0);

      const summary = await this.prisma.projectCostSummary.findUnique({ where: { projectId: targetProjectId } });

      const safeDispatchCost = totalDispatchCost > 0 ? totalDispatchCost : Number(summary?.dispatchCost || 0);
      const grandTotal = totalMaterialCost + totalMachineCost + totalLabourCost + totalOutsideCost + Number(summary?.inspectionCost || 0) + Number(summary?.packingCost || 0) + safeDispatchCost;
      
      const effectiveRevenue = totalRevenue > 0 ? totalRevenue : Number(summary?.revenue || 0);
      const calculatedProfitability = effectiveRevenue - grandTotal;

      await this.prisma.projectCostSummary.upsert({
        where: { projectId: targetProjectId },
        create: {
          projectId: targetProjectId,
          actualMaterialCost: totalMaterialCost,
          materialConsumptionCost: totalMaterialCost,
          machineCost: totalMachineCost,
          labourCost: totalLabourCost,
          outsideProcessCost: totalOutsideCost,
          dispatchCost: safeDispatchCost,
          totalCost: grandTotal,
          revenue: effectiveRevenue,
          profitability: calculatedProfitability,
        },
        update: {
          labourCost: totalLabourCost,
          machineCost: totalMachineCost,
          materialConsumptionCost: totalMaterialCost,
          outsideProcessCost: totalOutsideCost,
          dispatchCost: safeDispatchCost,
          totalCost: grandTotal,
          revenue: effectiveRevenue,
          profitability: calculatedProfitability,
        },
      });
    } catch (err) {
      // Ignore background recalculation errors
    }
  }

  private async syncMissingDesignLogCosts(projectId: string) {
    try {
      const targetProjectId = await this.resolveProjectId(projectId);
      const logs: any[] = await (this.prisma as any).designWorkLog.findMany({
        where: { projectId: targetProjectId },
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
              projectId: targetProjectId,
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

      await this.recalculateProjectCostSummary(targetProjectId);
    } catch (err) {
      // Ignore background sync errors
    }
  }

  async getDesignLogs(
    projectId: string,
    query?: { search?: string; designer?: string; workStage?: string; status?: string }
  ) {
    const targetProjectId = await this.resolveProjectId(projectId);
    await this.syncMissingDesignLogCosts(targetProjectId);

    const where: any = { projectId: targetProjectId };

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
    const targetProjectId = await this.resolveProjectId(projectId);
    const workDate = dto.workDate ? new Date(dto.workDate) : new Date();
    const hoursSpent = Number(dto.hoursSpent) || 0;

    const log = await (this.prisma as any).designWorkLog.create({
      data: {
        projectId: targetProjectId,
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
          projectId: targetProjectId,
          costType: 'LABOUR_COST',
          description: `Designer ${dto.designerName} logged ${hoursSpent} hrs for ${dto.workStage} (${dto.partName || 'CAD Design'}) @ ₹${hourlyRate}/hr`,
          amount: labourCostAmount,
          referenceDocType: 'DESIGN_WORK_LOG',
          referenceDocId: log.id,
          createdBy: userId || dto.designerName,
        },
      });

      // 3. Rollup cost to ProjectCostSummary (Finance Section)
      await this.recalculateProjectCostSummary(targetProjectId);
    }

    // 4. Also log activity in Project Timeline/Activity for transparency
    await this.prisma.projectActivity.create({
      data: {
        projectId: targetProjectId,
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
    const targetProjectId = await this.resolveProjectId(projectId);
    await this.syncMissingDesignLogCosts(targetProjectId);

    const logs: any[] = await (this.prisma as any).designWorkLog.findMany({
      where: { projectId: targetProjectId },
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
