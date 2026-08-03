import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    // 1. Total Revenue
    const costSummaries = await this.prisma.projectCostSummary.findMany({
      select: { revenue: true },
    });
    const totalRevenue = costSummaries.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0);

    // 2. Active Projects
    const activeProjectsCount = await this.prisma.project.count({
      where: {
        currentStage: {
          notIn: ['CLOSED', 'CANCELLED', 'PAYMENT_PENDING'],
        },
      },
    });

    // 3. Inventory Value
    const inventoryBatches = await this.prisma.inventoryBatch.findMany({
      where: { status: 'AVAILABLE', currentQty: { gt: 0 } },
      select: { currentQty: true, unitCost: true },
    });
    const inventoryValue = inventoryBatches.reduce((sum, item) => {
      return sum + (Number(item.currentQty) || 0) * (Number(item.unitCost) || 0);
    }, 0);

    // 4. Production Yield
    const inspections = await this.prisma.inspectionHeader.findMany({
      select: { inspectedQty: true, passedQty: true },
    });
    let totalInspected = 0;
    let totalPassed = 0;
    for (const ins of inspections) {
      totalInspected += (Number(ins.inspectedQty) || 0);
      totalPassed += (Number(ins.passedQty) || 0);
    }
    const productionYield = totalInspected > 0 ? ((totalPassed / totalInspected) * 100).toFixed(1) : 0;

    // 5. Production vs Procurement Costs (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const costEvents = await this.prisma.projectCostEvent.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
        costType: { in: ['MATERIAL_CONSUMPTION', 'MACHINE_COST', 'LABOUR_COST', 'OUTSIDE_PROCESS'] }
      },
      select: {
        costType: true,
        amount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const monthlyCosts: Record<string, any> = {};
    for (const event of costEvents) {
      const date = new Date(event.createdAt);
      const monthYear = date.toLocaleString('default', { month: 'short' });
      if (!monthlyCosts[monthYear]) {
        monthlyCosts[monthYear] = { month: monthYear, procurement: 0, production: 0 };
      }
      
      const amt = Number(event.amount) || 0;
      if (event.costType === 'MATERIAL_CONSUMPTION') {
        monthlyCosts[monthYear].procurement += amt;
      } else {
        monthlyCosts[monthYear].production += amt;
      }
    }

    const costTrends = Object.values(monthlyCosts);

    // 6. Machine Utilization
    const msdrs = await this.prisma.machineShopDailyReport.findMany({
      select: {
        machine: { select: { machineType: true } },
        actualMachineHours: true
      }
    });

    const utilizationMap: Record<string, any> = {};
    for (const report of msdrs) {
      const type = report.machine?.machineType || 'OTHER';
      if (!utilizationMap[type]) {
        utilizationMap[type] = { type, hours: 0 };
      }
      utilizationMap[type].hours += Number(report.actualMachineHours) || 0;
    }
    
    // Assume 160 hours standard per machine per month
    const machineUtilization = Object.values(utilizationMap).map((m: any) => ({
      name: m.type,
      percent: Math.min(Math.round((m.hours / 160) * 100), 100), // Cap at 100%
    }));

    if (machineUtilization.length === 0) {
      machineUtilization.push({ name: 'CNC Milling', percent: 0 });
      machineUtilization.push({ name: 'Laser Cutter', percent: 0 });
    }

    return {
      totalRevenue,
      activeProjectsCount,
      inventoryValue,
      productionYield,
      costTrends,
      machineUtilization
    };
  }

  // --- Employee Daily Report Global Module ---

  async getActiveRunningProjects() {
    const projects = await this.prisma.project.findMany({
      where: {
        currentStage: {
          notIn: ['CLOSED', 'CANCELLED', 'PAYMENT_PENDING'],
        },
      },
      select: {
        id: true,
        projectNumber: true,
        partName: true,
        description: true,
        currentStage: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map((p) => ({
      id: p.id,
      projectCode: p.projectNumber,
      name: p.partName || p.description || 'Tool Project',
      toolName: p.partName,
      category: 'TOOLING',
      currentStage: p.currentStage,
    }));
  }

  async getGlobalEmployeeDailyReports(query?: {
    date?: string;
    projectId?: string;
    section?: string;
    employeeId?: string;
    machineId?: string;
    search?: string;
    type?: string; // ALL, DESIGNER, MSDR
  }) {
    const designerWhere: any = {};
    const msdrWhere: any = {};

    if (query?.projectId && query.projectId !== 'ALL') {
      designerWhere.projectId = query.projectId;
      msdrWhere.projectId = query.projectId;
    }

    if (query?.date) {
      const startOfDay = new Date(query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(query.date);
      endOfDay.setHours(23, 59, 59, 999);

      designerWhere.workDate = { gte: startOfDay, lte: endOfDay };
      msdrWhere.reportDate = { gte: startOfDay, lte: endOfDay };
    }

    if (query?.section && query.section !== 'ALL') {
      if (query.section === 'ENGINEERING') {
        msdrWhere.id = 'NO_MATCH'; // Exclude MSDR if specifically searching engineering
      } else {
        designerWhere.id = 'NO_MATCH'; // Exclude designer logs if searching shopfloor sections
        msdrWhere.productionSection = query.section;
      }
    }

    if (query?.machineId && query.machineId !== 'ALL') {
      msdrWhere.machineId = query.machineId;
    }

    if (query?.employeeId && query.employeeId !== 'ALL') {
      designerWhere.designerId = query.employeeId;
      msdrWhere.employeeId = query.employeeId;
    }

    if (query?.search) {
      designerWhere.OR = [
        { designerName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { partName: { contains: query.search, mode: 'insensitive' } },
        { drawingNumber: { contains: query.search, mode: 'insensitive' } },
      ];

      msdrWhere.OR = [
        { msdrNumber: { contains: query.search, mode: 'insensitive' } },
        { remarks: { contains: query.search, mode: 'insensitive' } },
        { operations: { some: { description: { contains: query.search, mode: 'insensitive' } } } },
        { operations: { some: { toolNo: { contains: query.search, mode: 'insensitive' } } } },
        { operations: { some: { detNo: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    // 1. Fetch Designer Logs
    let designerLogs: any[] = [];
    if (query?.type !== 'MSDR') {
      designerLogs = await (this.prisma as any).designWorkLog.findMany({
        where: designerWhere,
        include: {
          project: {
            select: { id: true, projectNumber: true, partName: true, description: true },
          },
        },
        orderBy: { workDate: 'desc' },
      });
    }

    // 2. Fetch MSDR Headers & Operations
    let msdrHeaders: any[] = [];
    if (query?.type !== 'DESIGNER') {
      msdrHeaders = await (this.prisma as any).msdrHeader.findMany({
        where: msdrWhere,
        include: {
          machine: { select: { id: true, machineCode: true, machineName: true, machineType: true } },
          employee: { select: { id: true, employeeCode: true, name: true } },
          operations: true,
        },
        orderBy: { reportDate: 'desc' },
      });

      // Fetch projects for MSDR headers
      const msdrProjectIds = Array.from(new Set(msdrHeaders.map((h: any) => h.projectId))).filter(Boolean);
      const msdrProjects = await this.prisma.project.findMany({
        where: { id: { in: msdrProjectIds as string[] } },
        select: { id: true, projectNumber: true, partName: true, description: true },
      });
      const projectMap = new Map(
        msdrProjects.map((p) => [
          p.id,
          { id: p.id, projectCode: p.projectNumber, name: p.partName || p.description, toolName: p.partName },
        ])
      );

      msdrHeaders.forEach((h: any) => {
        h.project = projectMap.get(h.projectId);
      });
    }

    // 3. Normalize into Unified Global Format
    const items: any[] = [];

    designerLogs.forEach((log) => {
      items.push({
        id: log.id,
        type: 'DESIGNER',
        logDate: log.workDate,
        projectId: log.projectId,
        projectCode: log.project?.projectNumber || 'N/A',
        projectName: log.project?.partName || log.project?.description || 'N/A',
        projectToolName: log.project?.partName || 'N/A',
        section: 'ENGINEERING',
        personName: log.designerName,
        personId: log.designerId,
        machineOrTool: log.workStage || 'CAD/CAM Design',
        workStageOrOperation: log.workStage,
        partOrDrawing: log.partName ? `${log.partName} (${log.drawingNumber || 'REV-0'})` : log.drawingNumber || 'N/A',
        startTime: log.startTime || '09:00',
        endTime: log.endTime || '18:00',
        hoursSpent: Number(log.hoursSpent || 0),
        setupTime: 0,
        cuttingTime: Number(log.hoursSpent || 0),
        producedQty: 1,
        description: log.description,
        status: log.status || 'COMPLETED',
        cadFileUrl: log.cadFileUrl,
        remarks: log.remarks,
        createdAt: log.createdAt,
      });
    });

    msdrHeaders.forEach((header) => {
      if (!header.operations || header.operations.length === 0) {
        items.push({
          id: header.id,
          type: 'MSDR',
          logDate: header.reportDate,
          projectId: header.projectId,
          projectCode: header.project?.projectCode || 'N/A',
          projectName: header.project?.name || 'N/A',
          projectToolName: header.project?.toolName || 'N/A',
          section: header.productionSection || 'MACHINE_SHOP',
          personName: header.employee?.name || 'Operator',
          personId: header.employeeId,
          machineOrTool: header.machine ? `${header.machine.machineCode} - ${header.machine.machineName}` : 'Shopfloor Tool',
          workStageOrOperation: 'Shopfloor Operation',
          partOrDrawing: 'N/A',
          startTime: '08:00',
          endTime: '17:00',
          hoursSpent: 0,
          setupTime: 0,
          cuttingTime: 0,
          producedQty: 0,
          description: header.remarks || 'Daily Machining Report',
          status: header.status || 'COMPLETED',
          cadFileUrl: null,
          remarks: header.remarks,
          createdAt: header.createdAt,
        });
      } else {
        header.operations.forEach((op: any) => {
          const runHrs = Number(op.runningHours || 0);
          const setupHrs = Number(op.setupTime || 0);
          const totalHrs = runHrs + setupHrs;
          items.push({
            id: `${header.id}-${op.id}`,
            headerId: header.id,
            opId: op.id,
            type: 'MSDR',
            logDate: header.reportDate,
            projectId: header.projectId,
            projectCode: header.project?.projectCode || 'N/A',
            projectName: header.project?.name || 'N/A',
            projectToolName: header.project?.toolName || 'N/A',
            section: header.productionSection || 'MACHINE_SHOP',
            personName: header.employee?.name || 'Operator',
            personId: header.employeeId,
            machineOrTool: header.machine ? `${header.machine.machineCode} - ${header.machine.machineName}` : 'Shopfloor Tool',
            workStageOrOperation: op.description || `Tool ${op.toolNo || ''} Det ${op.detNo || ''}`,
            partOrDrawing: op.toolNo || op.detNo ? `Tool: ${op.toolNo || 'N/A'} | Det: ${op.detNo || 'N/A'}` : 'N/A',
            startTime: op.startTime ? new Date(op.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:00',
            endTime: op.endTime ? new Date(op.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '17:00',
            hoursSpent: totalHrs > 0 ? totalHrs : 8,
            setupTime: setupHrs,
            cuttingTime: runHrs,
            producedQty: Number(op.producedQty || 0),
            description: op.description || header.remarks || 'MSDR Operation',
            status: header.status || 'COMPLETED',
            cadFileUrl: null,
            remarks: header.remarks,
            createdAt: header.createdAt,
          });
        });
      }
    });

    // Sort by logDate descending
    items.sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());

    return items;
  }

  async getEmployeeDailyReportStats(query?: { date?: string }) {
    const targetDate = query?.date ? new Date(query.date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Designer stats today
    const designerLogs = await (this.prisma as any).designWorkLog.findMany({
      where: { workDate: { gte: startOfDay, lte: endOfDay } },
      select: { hoursSpent: true, designerName: true, projectId: true },
    });

    const designerHoursToday = designerLogs.reduce((acc: number, curr: any) => acc + Number(curr.hoursSpent || 0), 0);
    const activeDesignersSet = new Set(designerLogs.map((l: any) => l.designerName).filter(Boolean));

    // MSDR stats today
    const msdrHeaders = await (this.prisma as any).msdrHeader.findMany({
      where: { reportDate: { gte: startOfDay, lte: endOfDay } },
      include: {
        employee: { select: { name: true } },
        operations: { select: { runningHours: true, setupTime: true } },
      },
    });

    let msdrHoursToday = 0;
    const activeMachinistsSet = new Set<string>();
    const projectsSet = new Set<string>(designerLogs.map((l: any) => l.projectId));

    msdrHeaders.forEach((h: any) => {
      if (h.employee?.name) activeMachinistsSet.add(h.employee.name);
      if (h.projectId) projectsSet.add(h.projectId);
      h.operations?.forEach((op: any) => {
        msdrHoursToday += Number(op.runningHours || 0) + Number(op.setupTime || 0);
      });
    });

    // Count active running projects overall
    const activeProjectsCount = await this.prisma.project.count({
      where: { currentStage: { notIn: ['CLOSED', 'CANCELLED', 'PAYMENT_PENDING'] } },
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      totalHoursToday: designerHoursToday + msdrHoursToday,
      designerHoursToday: Number(designerHoursToday.toFixed(1)),
      msdrHoursToday: Number(msdrHoursToday.toFixed(1)),
      activeProjectsLogged: projectsSet.size,
      totalActiveProjectsInSystem: activeProjectsCount,
      activeDesignersCount: activeDesignersSet.size,
      activeMachinistsCount: activeMachinistsSet.size,
    };
  }

  async createGlobalDesignerLog(dto: any, userId?: string) {
    const workDate = dto.workDate ? new Date(dto.workDate) : new Date();
    const hoursSpent = Number(dto.hoursSpent) || 0;

    const log = await (this.prisma as any).designWorkLog.create({
      data: {
        projectId: dto.projectId,
        designerName: dto.designerName,
        designerId: dto.designerId,
        workStage: dto.workStage,
        partName: dto.partName,
        drawingNumber: dto.drawingNumber,
        revision: dto.revision,
        description: dto.description || 'Global designer log entry',
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

    return log;
  }

  async createGlobalMsdrLog(dto: any, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const header = await (tx as any).msdrHeader.create({
        data: {
          projectId: dto.projectId,
          machineId: dto.machineId,
          employeeId: dto.employeeId,
          reportDate: dto.reportDate ? new Date(dto.reportDate) : new Date(),
          msdrNumber: 'MSDR-' + Date.now(),
          productionSection: dto.productionSection || 'MACHINE_SHOP',
          remarks: dto.remarks,
          createdBy: userId,
        },
      });

      const items = dto.items && dto.items.length > 0 ? dto.items : [dto];
      for (const item of items) {
        let opId = (await tx.operation.findFirst())?.id;
        if (!opId) {
          const dummyOp = await tx.operation.create({
            data: {
              operationCode: 'GEN-OP-' + Date.now(),
              operationName: 'General Machining',
            },
          });
          opId = dummyOp.id;
        }

        let startTime = item.startTime && dto.reportDate ? new Date(`${dto.reportDate}T${item.startTime}:00Z`) : new Date();
        let endTime = item.endTime && dto.reportDate ? new Date(`${dto.reportDate}T${item.endTime}:00Z`) : new Date();
        if (isNaN(startTime.getTime())) startTime = new Date();
        if (isNaN(endTime.getTime())) endTime = new Date();

        let runHrs = Number(item.runningHours || item.cuttingTime || 0);
        if (!runHrs && startTime && endTime) {
          runHrs = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          if (runHrs < 0) runHrs += 24;
        }

        await (tx as any).msdrOperation.create({
          data: {
            msdrHeaderId: header.id,
            operationId: opId,
            toolNo: item.toolNo,
            detNo: item.detNo,
            description: item.description || 'Shopfloor Operation',
            rawMatlSize: item.rawMatlSize,
            finishMatlSize: item.finishMatlSize,
            producedQty: item.producedQty || item.qty || 0,
            setupTime: item.setupTime || 0,
            startTime,
            endTime,
            runningHours: runHrs > 0 ? runHrs : 0,
          },
        });
      }

      return header;
    });
  }
}
