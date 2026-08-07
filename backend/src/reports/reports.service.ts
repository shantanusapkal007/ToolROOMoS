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
      if (query.section === 'ENGINEERING' || query.section === 'DESIGNER') {
        msdrWhere.id = 'NO_MATCH'; // Exclude MSDR if specifically searching engineering
      } else if (query.section === 'ASSEMBLY' || query.section === 'TOOL_ROOM_FITTING' || query.section === 'ASSEMBLY_SHOP') {
        designerWhere.id = 'NO_MATCH'; // Exclude designer logs if searching assembly shop
        msdrWhere.productionSection = { in: ['TOOL_ROOM_FITTING', 'ASSEMBLY_SHOP', 'ASSEMBLY', 'TOOL_ROOM_FITTING_SHOP'] };
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

    return this.prisma.$transaction(async (tx) => {
      const log = await (tx as any).designWorkLog.create({
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

      // --- Finance Integration: Auto-generate labour cost events ---
      if (dto.projectId && hoursSpent > 0) {
        let labourRate = 0;

        // Look up employee hourly rate if designerId is provided
        if (dto.designerId) {
          try {
            const employee = await tx.employee.findUnique({ where: { id: dto.designerId } });
            if (employee) labourRate = Number(employee.hourlyRate || 0);
          } catch { /* skip if not found */ }
        }

        // Fallback: try CostRate table for default design rate
        if (labourRate <= 0) {
          try {
            const defaultRate = await tx.costRate.findFirst({
              where: { rateType: 'DESIGN_LABOUR', status: 'ACTIVE' },
            });
            labourRate = defaultRate ? Number(defaultRate.rateValue) : 0;
          } catch { /* skip */ }
        }

        const labourCost = hoursSpent * labourRate;

        if (labourCost > 0) {
          // Create cost event
          await tx.projectCostEvent.create({
            data: {
              projectId: dto.projectId,
              costType: 'LABOUR_COST',
              description: `Design labour: ${dto.designerName || 'Designer'} – ${hoursSpent.toFixed(1)}hrs × ₹${labourRate}/hr (${dto.workStage || 'Design'})`,
              amount: labourCost,
              referenceDocType: 'DESIGN_WORK_LOG',
              referenceDocId: log.id,
              createdBy: userId,
            },
          });

          // Update project cost summary
          await tx.projectCostSummary.upsert({
            where: { projectId: dto.projectId },
            create: {
              projectId: dto.projectId,
              labourCost: labourCost,
              totalCost: labourCost,
              profitability: -labourCost,
              estimatedMaterialCost: 0,
              actualMaterialCost: 0,
              materialConsumptionCost: 0,
              machineCost: 0,
              outsideProcessCost: 0,
              inspectionCost: 0,
              packingCost: 0,
              dispatchCost: 0,
              revenue: 0,
            },
            update: {
              labourCost: { increment: labourCost },
              totalCost: { increment: labourCost },
            },
          });

          // Re-sync profitability
          const summary = await tx.projectCostSummary.findUnique({ where: { projectId: dto.projectId } });
          if (summary) {
            await tx.projectCostSummary.update({
              where: { projectId: dto.projectId },
              data: { profitability: Number(summary.revenue) - Number(summary.totalCost) },
            });
          }
        }
      }

      return log;
    });
  }

  async createGlobalMsdrLog(dto: any, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Resolve Project ID safely
      let validProjectId = dto.projectId;
      let project: any = null;
      if (validProjectId) {
        project = await tx.project.findUnique({ where: { id: validProjectId } }).catch(() => null);
      }
      if (!project) {
        project = await tx.project.findFirst({ where: { status: { not: 'CLOSED' } } }) || await tx.project.findFirst();
      }
      if (project) {
        validProjectId = project.id;
      }

      // 2. Resolve Production Section Enum safely
      let sectionEnum = dto.productionSection || 'MACHINE_SHOP';
      if (sectionEnum === 'ASSEMBLY_SHOP' || sectionEnum === 'ASSEMBLY' || sectionEnum === 'TOOL_ROOM_FITTING_SHOP') {
        sectionEnum = 'TOOL_ROOM_FITTING';
      }
      const validSections = ['MACHINE_SHOP', 'TOOL_ROOM_FITTING', 'PRESS_SHOP', 'FABRICATION_INDIAN', 'FABRICATION_EXPORT'];
      if (!validSections.includes(sectionEnum)) {
        sectionEnum = 'TOOL_ROOM_FITTING';
      }

      // 3. Resolve Machine ID safely
      let validMachineId = dto.machineId;
      let machine: any = null;
      if (validMachineId) {
        machine = await tx.machine.findUnique({ where: { id: validMachineId } }).catch(() => null);
      }
      if (!machine) {
        machine = await tx.machine.findFirst({ where: { status: 'ACTIVE' } }) || await tx.machine.findFirst();
      }
      if (!machine) {
        let company = await tx.company.findFirst();
        if (!company) {
          company = await tx.company.create({ data: { companyCode: 'COMP-01', companyName: 'Enterprise Toolroom Org' } });
        }
        let plant = await tx.plant.findFirst();
        if (!plant) {
          plant = await tx.plant.create({ data: { plantCode: 'PLANT-01', plantName: 'Main Toolroom Plant', companyId: company.id } });
        }
        let dept = await tx.department.findFirst();
        if (!dept) {
          dept = await tx.department.create({ data: { departmentCode: 'DEPT-01', departmentName: 'Toolroom Shopfloor', plantId: plant.id } });
        }
        machine = await tx.machine.create({
          data: {
            machineCode: 'MAC-DEFAULT',
            machineName: 'Shopfloor Assembly Bench / Machine',
            machineType: 'ASSEMBLY',
            plantId: plant.id,
            departmentId: dept.id,
            hourlyRate: 500,
          }
        });
      }
      validMachineId = machine.id;
      let machineHourlyRate = Number(machine.hourlyRate || 0);
      let machineName = machine.machineCode || 'MAC-DEFAULT';

      // 4. Resolve Employee ID safely
      let validEmployeeId = dto.employeeId;
      let employee: any = null;
      if (validEmployeeId) {
        employee = await tx.employee.findUnique({ where: { id: validEmployeeId } }).catch(() => null);
      }
      if (!employee) {
        employee = await tx.employee.findFirst({ where: { status: 'ACTIVE' } }) || await tx.employee.findFirst();
      }
      if (!employee) {
        let dept = await tx.department.findFirst();
        if (!dept) {
          let company = await tx.company.findFirst() || await tx.company.create({ data: { companyCode: 'COMP-01', companyName: 'Enterprise Toolroom Org' } });
          let plant = await tx.plant.findFirst() || await tx.plant.create({ data: { plantCode: 'PLANT-01', plantName: 'Main Toolroom Plant', companyId: company.id } });
          dept = await tx.department.create({ data: { departmentCode: 'DEPT-01', departmentName: 'Toolroom Shopfloor', plantId: plant.id } });
        }
        employee = await tx.employee.create({
          data: {
            employeeCode: 'EMP-DEFAULT-' + Date.now().toString().slice(-4),
            name: dto.personName || 'Toolroom Specialist',
            departmentId: dept.id,
            designation: 'Specialist',
            hourlyRate: 450,
          }
        });
      }
      validEmployeeId = employee.id;
      let employeeHourlyRate = Number(employee.hourlyRate || 450);

      // 5. Create MSDR Header with guaranteed valid foreign keys & valid enum
      const header = await (tx as any).msdrHeader.create({
        data: {
          projectId: validProjectId,
          machineId: validMachineId,
          employeeId: validEmployeeId,
          reportDate: dto.reportDate ? new Date(dto.reportDate) : new Date(),
          msdrNumber: 'MSDR-' + Date.now(),
          productionSection: sectionEnum,
          remarks: dto.remarks,
          createdBy: userId,
        },
      });

      let totalMachineCost = 0;
      let totalLabourCost = 0;

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
        if (runHrs < 0) runHrs = 0;

        const op = await (tx as any).msdrOperation.create({
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

        // --- Finance Integration: Calculate and log costs ---
        const setupHrs = Number(item.setupTime || 0) / 60; // setupTime is in minutes
        const totalHrs = runHrs + setupHrs;

        if (totalHrs > 0 && dto.projectId) {
          const mCost = totalHrs * machineHourlyRate;
          const lCost = totalHrs * employeeHourlyRate;
          totalMachineCost += mCost;
          totalLabourCost += lCost;

          if (mCost > 0) {
            await tx.projectCostEvent.create({
              data: {
                projectId: dto.projectId,
                costType: 'MACHINE_COST',
                description: `Machine cost: ${machineName} – ${totalHrs.toFixed(2)}hrs × ₹${machineHourlyRate}/hr (Tool: ${item.toolNo || 'N/A'})`,
                amount: mCost,
                referenceDocType: 'MSDR_OP',
                referenceDocId: op.id,
                createdBy: userId,
              },
            });
          }
        }
      }

      // --- Update ProjectCostSummary ---
      if (dto.projectId && (totalMachineCost > 0 || totalLabourCost > 0)) {
        const totalCostDelta = totalMachineCost + totalLabourCost;

        await tx.projectCostSummary.upsert({
          where: { projectId: dto.projectId },
          create: {
            projectId: dto.projectId,
            machineCost: totalMachineCost,
            labourCost: totalLabourCost,
            totalCost: totalCostDelta,
            profitability: -totalCostDelta,
            estimatedMaterialCost: 0,
            actualMaterialCost: 0,
            materialConsumptionCost: 0,
            outsideProcessCost: 0,
            inspectionCost: 0,
            packingCost: 0,
            dispatchCost: 0,
            revenue: 0,
          },
          update: {
            machineCost: { increment: totalMachineCost },
            labourCost: { increment: totalLabourCost },
            totalCost: { increment: totalCostDelta },
          },
        });

        // Re-sync profitability
        const summary = await tx.projectCostSummary.findUnique({ where: { projectId: dto.projectId } });
        if (summary) {
          await tx.projectCostSummary.update({
            where: { projectId: dto.projectId },
            data: { profitability: Number(summary.revenue) - Number(summary.totalCost) },
          });
        }

        // Activity log
        await tx.projectActivity.create({
          data: {
            projectId: dto.projectId,
            action: 'PRODUCTION_LOGGED',
            description: `MSDR ${header.msdrNumber} logged via daily reports. Cost: ₹${totalCostDelta.toFixed(2)} (Machine: ₹${totalMachineCost.toFixed(2)} + Labour: ₹${totalLabourCost.toFixed(2)})`,
            performedBy: userId || 'SYSTEM',
          },
        });
      }

      return header;
    });
  }

  async getProjectMaterialInventory(query?: {
    projectId?: string;
    section?: string;
    search?: string;
  }) {
    const issueWhere: any = {};
    if (query?.projectId && query.projectId !== 'ALL') {
      issueWhere.projectId = query.projectId;
    }

    const materialIssues = await (this.prisma as any).materialIssueHeader.findMany({
      where: issueWhere,
      include: {
        project: {
          select: { id: true, projectNumber: true, partName: true, customer: { select: { companyName: true } } },
        },
        items: {
          include: {
            inventoryBatch: {
              include: {
                material: true,
                location: { include: { warehouse: true } },
              },
            },
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    const batchWhere: any = { status: { in: ['AVAILABLE', 'RESERVED', 'PARTIAL'] } };
    const batches = await (this.prisma as any).inventoryBatch.findMany({
      where: batchWhere,
      include: {
        material: true,
        location: { include: { warehouse: true } },
        grnItem: {
          include: {
            grnHeader: {
              include: {
                project: { select: { id: true, projectNumber: true, partName: true, customer: { select: { companyName: true } } } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const allProjects = await this.prisma.project.findMany({
      select: { id: true, projectNumber: true, partName: true, customer: { select: { companyName: true } } },
    });
    const projectMap = new Map(allProjects.map(p => [p.id, p]));

    const items: any[] = [];

    const formatSectionName = (sec?: string | null) => {
      if (!sec) return 'Shopfloor';
      switch (sec) {
        case 'PRESS_SHOP': return 'Press Shop';
        case 'MACHINE_SHOP': return 'Machine Shop';
        case 'TOOL_ROOM_FITTING': return 'Tool Room Fitting';
        case 'FABRICATION_INDIAN': return 'Fabrication (Indian)';
        case 'FABRICATION_EXPORT': return 'Fabrication (Export)';
        default: return sec.replace(/_/g, ' ');
      }
    };

    // A. Issued items -> Location shows Shopfloor Section (e.g. Press Shop)
    materialIssues.forEach((issue: any) => {
      const proj = issue.project;
      const sectionLabel = formatSectionName(issue.productionSection);

      issue.items?.forEach((item: any) => {
        const mat = item.inventoryBatch?.material;
        const batch = item.inventoryBatch;

        items.push({
          id: `ISSUE-${item.id}`,
          projectId: issue.projectId,
          projectCode: proj?.projectNumber || 'N/A',
          projectName: proj?.partName || 'General Tooling',
          customerName: proj?.customer?.companyName || 'Internal',
          materialId: mat?.id || 'N/A',
          materialCode: mat?.materialCode || 'N/A',
          materialGrade: mat?.materialGrade || 'Raw Material',
          batchNumber: batch?.batchNumber || 'N/A',
          heatNumber: batch?.heatNumber || 'N/A',
          quantity: Number(item.issuedQty || 0),
          unitCost: Number(batch?.unitCost || 0),
          materialValue: Number(item.materialValue || 0),
          uom: 'NOS',
          rateUom: 'KG',
          isIssued: true,
          section: issue.productionSection || 'MACHINE_SHOP',
          sectionLabel,
          // CRITICAL REQUIREMENT: Show location as Press Shop / Machine Shop when issued
          currentLocation: sectionLabel,
          warehouseName: batch?.location?.warehouse?.warehouseName || 'Main Store',
          rackBin: batch?.rack ? `Rack ${batch.rack}` : batch?.location?.locationName || 'N/A',
          status: `ISSUED TO ${sectionLabel.toUpperCase()}`,
          issueNumber: issue.issueNumber,
          date: issue.issueDate,
          remarks: item.remarks || issue.remarks || `Issued to ${sectionLabel}`,
        });
      });
    });

    // B. Unissued / Store Batches -> Location shows under Project Name / Store
    batches.forEach((batch: any) => {
      if (Number(batch.currentQty || 0) <= 0) return;

      const proj = batch.grnItem?.grnHeader?.project || projectMap.get(allProjects[0]?.id);
      const projCode = proj?.projectNumber || 'GENERAL';
      const projName = proj?.partName || 'Main Raw Material Store';

      const storeLocation = `${projCode} Project Store (${batch.location?.warehouse?.warehouseName || 'Main Warehouse'})`;

      items.push({
        id: `BATCH-${batch.id}`,
        projectId: proj?.id || 'GENERAL',
        projectCode: projCode,
        projectName: projName,
        customerName: proj?.customer?.companyName || 'Internal',
        materialId: batch.material?.id || 'N/A',
        materialCode: batch.material?.materialCode || 'N/A',
        materialGrade: batch.material?.materialGrade || 'Raw Material',
        batchNumber: batch.batchNumber,
        heatNumber: batch.heatNumber || 'N/A',
        quantity: Number(batch.currentQty || 0),
        unitCost: Number(batch.unitCost || 0),
        materialValue: Number(batch.currentQty || 0) * Number(batch.unitCost || 0),
        uom: 'NOS',
        rateUom: 'KG',
        isIssued: false,
        section: 'PROJECT_STORE',
        sectionLabel: 'Project Store',
        // CRITICAL REQUIREMENT: Show location under Project Name when not issued
        currentLocation: storeLocation,
        warehouseName: batch.location?.warehouse?.warehouseName || 'Main Warehouse',
        rackBin: batch.rack ? `Rack ${batch.rack}` : batch.location?.locationName || 'Unassigned',
        status: batch.status === 'RESERVED' ? 'RESERVED FOR PROJECT' : 'IN PROJECT STORE',
        issueNumber: null,
        date: batch.createdAt,
        remarks: `Stored in ${batch.rack || 'Main Bin'}`,
      });
    });

    let filtered = items;

    if (query?.projectId && query.projectId !== 'ALL') {
      filtered = filtered.filter(i => i.projectId === query.projectId);
    }

    if (query?.section && query.section !== 'ALL') {
      filtered = filtered.filter(i => i.section === query.section);
    }

    if (query?.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter(i =>
        i.projectCode.toLowerCase().includes(q) ||
        i.projectName.toLowerCase().includes(q) ||
        i.materialCode.toLowerCase().includes(q) ||
        i.materialGrade.toLowerCase().includes(q) ||
        i.batchNumber.toLowerCase().includes(q) ||
        i.heatNumber.toLowerCase().includes(q) ||
        i.currentLocation.toLowerCase().includes(q)
      );
    }

    const totalItems = filtered.length;
    const totalValue = filtered.reduce((sum, i) => sum + i.materialValue, 0);
    const issuedItems = filtered.filter(i => i.isIssued);
    const storeItems = filtered.filter(i => !i.isIssued);

    const issuedValue = issuedItems.reduce((sum, i) => sum + i.materialValue, 0);
    const storeValue = storeItems.reduce((sum, i) => sum + i.materialValue, 0);

    return {
      summary: {
        totalItems,
        totalValue: Math.round(totalValue * 100) / 100,
        issuedCount: issuedItems.length,
        issuedValue: Math.round(issuedValue * 100) / 100,
        storeCount: storeItems.length,
        storeValue: Math.round(storeValue * 100) / 100,
      },
      items: filtered,
    };
  }
}

