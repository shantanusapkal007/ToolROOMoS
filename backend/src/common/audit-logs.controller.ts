import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Controller('api/v1/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('performedBy') performedBy?: string,
    @Query('search') search?: string,
  ) {
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};

    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType;
    }
    if (action && action !== 'ALL') {
      where.action = action;
    }
    if (performedBy && performedBy !== 'ALL') {
      where.performedBy = performedBy;
    }
    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    const prismaAny = this.prisma as any;

    if (!prismaAny.auditLog) {
       return {
          status: 'success',
          data: [],
          meta: { total: 0, page: pageNumber, limit: pageSize, totalPages: 0 }
       };
    }

    const [total, items] = await Promise.all([
      prismaAny.auditLog.count({ where }),
      prismaAny.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Enhance items with user info (basic join in memory for speed)
    const userIds = [...new Set((items as any[]).map((i: any) => i.performedBy).filter((id: any) => id !== 'SYSTEM'))];
    let users: any[] = [];
    if (userIds.length > 0) {
      users = await this.prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
        select: { id: true, name: true, role: true }
      });
    }

    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const enrichedItems = (items as any[]).map((item: any) => ({
      ...item,
      user: item.performedBy === 'SYSTEM' ? { name: 'System', role: 'SYSTEM' } : userMap.get(item.performedBy) || { name: 'Unknown User' }
    }));

    return {
      status: 'success',
      data: enrichedItems,
      meta: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  @Get('stats')
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const prismaAny = this.prisma as any;
    if (!prismaAny.auditLog) {
       return {
          status: 'success',
          data: { totalToday: 0, mostActiveUser: null, mostActiveEntity: null, uniqueUsersActiveToday: 0 }
       };
    }

    const [totalToday, uniqueUsersToday, mostActiveEntityStats] = await Promise.all([
      prismaAny.auditLog.count({
        where: { createdAt: { gte: today } },
      }),
      prismaAny.auditLog.groupBy({
        by: ['performedBy'],
        where: { createdAt: { gte: today }, performedBy: { not: 'SYSTEM' } },
        _count: { performedBy: true },
        orderBy: { _count: { performedBy: 'desc' } },
        take: 1
      }),
      prismaAny.auditLog.groupBy({
        by: ['entityType'],
        where: { createdAt: { gte: today } },
        _count: { entityType: true },
        orderBy: { _count: { entityType: 'desc' } },
        take: 1
      })
    ]);

    let mostActiveUser = null;
    if (uniqueUsersToday && uniqueUsersToday.length > 0) {
       const user = await this.prisma.user.findUnique({
          where: { id: uniqueUsersToday[0].performedBy },
          select: { name: true }
       });
       mostActiveUser = user ? user.name : 'Unknown';
    }

    const mostActiveEntity = mostActiveEntityStats && mostActiveEntityStats.length > 0 ? mostActiveEntityStats[0].entityType : 'None';

    const activeUsersCount = await prismaAny.auditLog.groupBy({
       by: ['performedBy'],
       where: { createdAt: { gte: today }, performedBy: { not: 'SYSTEM' } },
    });

    return {
      status: 'success',
      data: {
        totalToday,
        mostActiveUser,
        mostActiveEntity,
        uniqueUsersActiveToday: activeUsersCount ? activeUsersCount.length : 0
      }
    };
  }

  @Get('entity/:entityType/:entityId')
  async getEntityLogs(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const prismaAny = this.prisma as any;
    if (!prismaAny.auditLog) {
       return { status: 'success', data: [] };
    }

    const items = await prismaAny.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });

     // Enhance items with user info
    const userIds = [...new Set((items as any[]).map((i: any) => i.performedBy).filter((id: any) => id !== 'SYSTEM'))];
    let users: any[] = [];
    if (userIds.length > 0) {
      users = await this.prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
        select: { id: true, name: true, role: true }
      });
    }

    const userMap = new Map(users.map((u: any) => [u.id, u]));

    const enrichedItems = (items as any[]).map((item: any) => ({
      ...item,
      user: item.performedBy === 'SYSTEM' ? { name: 'System', role: 'SYSTEM' } : userMap.get(item.performedBy) || { name: 'Unknown User' }
    }));

    return {
      status: 'success',
      data: enrichedItems,
    };
  }

  @Get('task-assignments')
  async getTaskAssignments(
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    const searchFilter = search ? search.trim().toLowerCase() : '';

    // 1. Fetch Project Tasks
    const projectTasks = await this.prisma.projectTask.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { projectNumber: true, partName: true } }
      }
    });

    // Resolve user names for assignedTo and createdBy in memory
    const taskUserIds = [...new Set([
      ...projectTasks.map(t => t.assignedTo).filter(Boolean),
      ...projectTasks.map(t => t.createdBy).filter(Boolean)
    ])];
    
    const users = taskUserIds.length > 0 ? await this.prisma.user.findMany({
      where: { id: { in: taskUserIds as string[] } },
      select: { id: true, name: true, role: true }
    }) : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const formattedProjectTasks = projectTasks.map(t => ({
      id: t.id,
      category: 'PROJECT_TASK',
      taskName: t.taskName,
      description: t.description || `Project ${t.project?.projectNumber} - ${t.project?.partName}`,
      projectNumber: t.project?.projectNumber,
      assignedToName: t.assignedTo ? (userMap.get(t.assignedTo)?.name || t.assignedTo) : 'Unassigned',
      assignedByName: t.createdBy ? (userMap.get(t.createdBy)?.name || t.createdBy) : 'System',
      status: t.status,
      startDate: t.startDate,
      endDate: t.endDate,
      assignedAt: t.createdAt,
    }));

    // 2. Fetch Job Cards
    const jobCards = await this.prisma.jobCard.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { projectNumber: true, partName: true } },
        machine: { select: { machineCode: true, machineName: true } },
        operator: { select: { name: true, employeeCode: true } },
        routingOperation: { include: { operation: { select: { operationName: true } } } }
      }
    });

    const formattedJobCards = jobCards.map(j => ({
      id: j.id,
      category: 'JOB_CARD',
      taskName: `Op: ${j.routingOperation?.operation?.operationName || 'Operation'}`,
      description: `Job Card for ${j.project?.projectNumber} (${j.project?.partName}) on Machine ${j.machine?.machineCode || ''}`,
      projectNumber: j.project?.projectNumber,
      assignedToName: j.operator?.name ? `${j.operator.name} (${j.operator.employeeCode})` : 'Unassigned Operator',
      assignedByName: j.createdBy ? (userMap.get(j.createdBy)?.name || j.createdBy) : 'Production Manager',
      status: j.status,
      priority: j.priority,
      assignedAt: j.createdAt,
    }));

    // 3. Fetch Maintenance Tickets
    const maintenanceTickets = await this.prisma.maintenanceTicket.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        machine: { select: { machineCode: true, machineName: true } },
        reportedBy: { select: { name: true } },
        assignedTo: { select: { name: true } }
      }
    });

    const formattedMaintenanceTickets = maintenanceTickets.map(m => ({
      id: m.id,
      category: 'MAINTENANCE_TICKET',
      taskName: `Maintenance: ${m.ticketNumber}`,
      description: `${m.issueDescription} (Machine: ${m.machine?.machineCode})`,
      projectNumber: null,
      assignedToName: m.assignedTo?.name || 'Unassigned Technician',
      assignedByName: m.reportedBy?.name || 'System',
      status: m.status,
      priority: m.priority,
      assignedAt: m.createdAt,
    }));

    // Combine & filter
    let allAssignments = [
      ...formattedProjectTasks,
      ...formattedJobCards,
      ...formattedMaintenanceTickets,
    ].sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());

    if (type && type !== 'ALL') {
      allAssignments = allAssignments.filter(a => a.category === type);
    }

    if (searchFilter) {
      allAssignments = allAssignments.filter(a =>
        a.taskName.toLowerCase().includes(searchFilter) ||
        a.description.toLowerCase().includes(searchFilter) ||
        a.assignedToName.toLowerCase().includes(searchFilter) ||
        a.assignedByName.toLowerCase().includes(searchFilter) ||
        (a.projectNumber && a.projectNumber.toLowerCase().includes(searchFilter))
      );
    }

    return {
      status: 'success',
      data: allAssignments,
    };
  }

  @Get('material-movements')
  async getMaterialMovements(
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
  ) {
    const searchFilter = search ? search.trim().toLowerCase() : '';

    // Fetch Material Issues
    const issues = await this.prisma.materialIssueHeader.findMany({
      take: 50,
      orderBy: { issueDate: 'desc' },
      include: {
        project: { select: { projectNumber: true, partName: true } },
        items: {
          include: {
            inventoryBatch: {
              include: {
                material: { select: { materialCode: true, materialGrade: true } }
              }
            }
          }
        }
      }
    });

    // Resolve stores issuer names
    const issuerUserIds = [...new Set(issues.map(i => i.createdBy).filter(Boolean))];
    const users = issuerUserIds.length > 0 ? await this.prisma.user.findMany({
      where: { id: { in: issuerUserIds as string[] } },
      select: { id: true, name: true, role: true }
    }) : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const formattedIssues = issues.flatMap(h =>
      h.items.map(item => ({
        id: item.id,
        issueNumber: h.issueNumber,
        type: 'MATERIAL_ISSUE',
        date: h.issueDate,
        projectNumber: h.project?.projectNumber,
        partName: h.project?.partName,
        productionSection: h.productionSection || 'Shop Floor',
        materialCode: item.inventoryBatch?.material?.materialCode || 'N/A',
        materialGrade: item.inventoryBatch?.material?.materialGrade || 'N/A',
        batchNumber: item.inventoryBatch?.batchNumber || 'N/A',
        heatNumber: item.inventoryBatch?.heatNumber || 'N/A',
        issuedQty: item.issuedQty,
        materialValue: item.materialValue,
        issuedByName: h.createdBy ? (userMap.get(h.createdBy)?.name || h.createdBy) : 'Stores Officer',
        remarks: h.remarks || item.remarks,
      }))
    );

    let result = formattedIssues;

    if (searchFilter) {
      result = result.filter(i =>
        i.issueNumber.toLowerCase().includes(searchFilter) ||
        i.materialCode.toLowerCase().includes(searchFilter) ||
        i.materialGrade.toLowerCase().includes(searchFilter) ||
        i.batchNumber.toLowerCase().includes(searchFilter) ||
        i.heatNumber.toLowerCase().includes(searchFilter) ||
        i.issuedByName.toLowerCase().includes(searchFilter) ||
        (i.projectNumber && i.projectNumber.toLowerCase().includes(searchFilter))
      );
    }

    return {
      status: 'success',
      data: result,
    };
  }

  @Get('genealogy')
  async getGenealogy(@Query('query') query: string) {
    if (!query) {
      return { status: 'error', message: 'Query parameter is required' };
    }

    const q = query.trim();

    // 1. Look for Inventory Batch by Batch # or Heat #
    const batches = await this.prisma.inventoryBatch.findMany({
      where: {
        OR: [
          { batchNumber: { contains: q, mode: 'insensitive' } },
          { heatNumber: { contains: q, mode: 'insensitive' } },
        ]
      },
      include: {
        material: true,
        location: true,
        grnItem: {
          include: {
            grnHeader: {
              include: {
                poHeader: { include: { vendor: true, project: true } }
              }
            }
          }
        },
        materialIssueItems: {
          include: {
            issueHeader: {
              include: {
                project: true,
                jobCard: { include: { machine: true, operator: true } }
              }
            }
          }
        },
        machineShopDailyReports: {
          include: {
            machine: true,
            employee: true,
            project: true
          }
        }
      }
    });

    const formattedGenealogy = batches.map(batch => {
      const grn = batch.grnItem?.grnHeader;
      const po = grn?.poHeader;
      const vendor = po?.vendor;
      const project = po?.project;

      return {
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        heatNumber: batch.heatNumber || 'N/A',
        materialCode: batch.material?.materialCode,
        materialGrade: batch.material?.materialGrade,
        currentQty: batch.currentQty,
        receivedQty: batch.receivedQty,
        status: batch.status,
        rackLocation: batch.rack || batch.location?.locationName || 'Main Store',
        
        // Inward Phase
        inward: {
          grnNumber: grn?.grnNumber || 'GRN-DIRECT',
          supplierChallan: grn?.supplierChallan || 'N/A',
          receiptDate: grn?.receiptDate || batch.createdAt,
          receivedBy: grn?.createdBy || 'Stores Receiving',
          poNumber: po?.poNumber || 'PO-DIRECT',
          vendorName: vendor?.vendorName || 'Direct Purchase',
          projectNumber: project?.projectNumber || 'N/A',
        },

        // Issuance Phase
        issuances: batch.materialIssueItems.map(item => ({
          issueNumber: item.issueHeader?.issueNumber,
          issueDate: item.issueHeader?.issueDate,
          issuedQty: item.issuedQty,
          projectNumber: item.issueHeader?.project?.projectNumber,
          productionSection: item.issueHeader?.productionSection,
          issuedBy: item.issueHeader?.createdBy || 'Stores Officer',
          machine: item.issueHeader?.jobCard?.machine?.machineCode || 'Unassigned',
          operator: item.issueHeader?.jobCard?.operator?.name || 'Unassigned Operator',
        })),

        // Machine & Consumption Phase
        machineLogs: batch.machineShopDailyReports.map(m => ({
          reportDate: m.reportDate,
          machineCode: m.machine?.machineCode,
          operatorName: m.employee?.name,
          producedQty: m.producedQty,
          scrapQty: m.scrapQty,
          projectNumber: m.project?.projectNumber,
        }))
      };
    });

    return {
      status: 'success',
      data: formattedGenealogy,
    };
  }

  @Get('asset-issuances')
  async getAssetIssuances(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const searchFilter = search ? search.trim().toLowerCase() : '';

    const transactions = await this.prisma.globalAssetIssueTransaction.findMany({
      take: 50,
      orderBy: { issueDate: 'desc' },
      include: {
        asset: { include: { category: true } },
        employee: { include: { department: true } },
      }
    });

    // Resolve issuer user names
    const issuerUserIds = [...new Set(transactions.map(t => t.createdBy).filter(Boolean))];
    const users = issuerUserIds.length > 0 ? await this.prisma.user.findMany({
      where: { id: { in: issuerUserIds as string[] } },
      select: { id: true, name: true }
    }) : [];
    const userMap = new Map(users.map(u => [u.id, u.name]));

    let formatted = transactions.map(t => ({
      id: t.id,
      issueNumber: t.issueNumber,
      assetCode: t.asset?.assetCode,
      assetName: t.asset?.name,
      categoryName: t.asset?.category?.name,
      employeeName: t.employee?.name,
      departmentName: t.employee?.department?.departmentName,
      quantity: t.quantity,
      issueDate: t.issueDate,
      expectedReturnDate: t.expectedReturnDate,
      actualReturnDate: t.actualReturnDate,
      conditionBeforeIssue: t.conditionBeforeIssue,
      conditionAfterReturn: t.conditionAfterReturn,
      status: t.status,
      issuedByName: t.createdBy ? (userMap.get(t.createdBy) || t.createdBy) : 'Toolroom Storekeeper',
      remarks: t.remarks,
    }));

    if (status && status !== 'ALL') {
      formatted = formatted.filter(t => t.status === status);
    }

    if (searchFilter) {
      formatted = formatted.filter(t =>
        t.issueNumber.toLowerCase().includes(searchFilter) ||
        (t.assetCode && t.assetCode.toLowerCase().includes(searchFilter)) ||
        (t.assetName && t.assetName.toLowerCase().includes(searchFilter)) ||
        (t.employeeName && t.employeeName.toLowerCase().includes(searchFilter)) ||
        (t.issuedByName && t.issuedByName.toLowerCase().includes(searchFilter))
      );
    }

    return {
      status: 'success',
      data: formatted,
    };
  }
}

