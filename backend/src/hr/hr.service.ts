import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllEmployees() {
    return this.prisma.employee.findMany({
      include: {
        department: true,
        shift: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createEmployee(data: any, userId?: string) {
    return this.prisma.employee.create({
      data: {
        ...data,
        createdBy: userId,
      },
    });
  }

  async updateEmployeeRate(id: string, newRate: number, reason: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findUniqueOrThrow({ where: { id } });
      const oldRate = employee.hourlyRate;

      if (Number(oldRate) === Number(newRate)) {
        throw new BadRequestException('New rate must be different from current rate.');
      }

      const updated = await tx.employee.update({
        where: { id },
        data: {
          hourlyRate: newRate,
          updatedBy: userId,
        },
      });

      await tx.costRateHistory.create({
        data: {
          entityType: 'EMPLOYEE',
          entityId: id,
          oldRate,
          newRate,
          reason,
          recordedBy: userId,
        },
      });

      return updated;
    });
  }

  async getRateHistory(entityType: string, entityId: string) {
    return this.prisma.costRateHistory.findMany({
      where: { entityType, entityId },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getMonthlyPayrollAndWork(params: { monthYear?: string; startDate?: string; endDate?: string }) {
    let start: Date;
    let end: Date;

    const monthYear = params.monthYear || new Date().toISOString().substring(0, 7); // e.g. "2026-08"

    if (params.startDate && params.endDate) {
      start = new Date(params.startDate);
      end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      const [year, month] = monthYear.split('-').map(Number);
      start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      end = new Date(year, month, 0, 23, 59, 59, 999);
    }

    // 1. Fetch Employees
    const employees = await this.prisma.employee.findMany({
      include: {
        department: true,
        shift: true,
      },
      orderBy: { name: 'asc' },
    });

    // 2. Fetch Projects mapping
    const projects = await this.prisma.project.findMany({
      include: {
        customer: true,
      },
    });
    const projectMap = new Map(projects.map(p => [p.id, p]));

    // 3. Fetch saved Monthly Salary Overrides
    const savedSalaries = await (this.prisma as any).employeeMonthlySalary.findMany({
      where: { monthYear },
    });
    const salaryMap = new Map<string, any>(savedSalaries.map((s: any) => [s.employeeId, s]));

    // 4. Fetch Work Logs
    // a) MSDR Headers & Operations
    const msdrHeaders = await this.prisma.msdrHeader.findMany({
      where: {
        reportDate: { gte: start, lte: end },
      },
      include: {
        employee: true,
        machine: true,
        operations: {
          include: {
            operation: true,
          },
        },
      },
    });

    // b) Machine Shop Daily Reports
    const msdrDaily = await this.prisma.machineShopDailyReport.findMany({
      where: {
        reportDate: { gte: start, lte: end },
      },
      include: {
        project: true,
        machine: true,
        routingOperation: {
          include: { operation: true },
        },
      },
    });

    // c) Design Work Logs
    const designLogs = await this.prisma.designWorkLog.findMany({
      where: {
        workDate: { gte: start, lte: end },
      },
      include: {
        project: {
          include: { customer: true },
        },
      },
    });

    // d) Production Operations
    const prodOps = await this.prisma.productionOperation.findMany({
      where: {
        startTime: { gte: start, lte: end },
      },
      include: {
        employee: true,
        machine: true,
        productionBatch: {
          include: {
            project: { include: { customer: true } },
          },
        },
      },
    });

    // Map work logs per employee
    const employeeWorkMap = new Map<string, {
      totalHours: number;
      projects: Map<string, {
        projectId: string;
        projectNumber: string;
        partName: string;
        customerName: string;
        hours: number;
        taskCount: number;
        activities: any[];
      }>;
      workLogs: any[];
    }>();

    const addWorkLog = (
      empId: string,
      projId: string | null | undefined,
      hours: number,
      activityType: string,
      date: Date | string,
      description: string,
      details: any = {}
    ) => {
      if (!empId) return;
      if (!employeeWorkMap.has(empId)) {
        employeeWorkMap.set(empId, {
          totalHours: 0,
          projects: new Map(),
          workLogs: [],
        });
      }
      const record = employeeWorkMap.get(empId)!;
      record.totalHours += hours;

      const pObj = projId ? projectMap.get(projId) : null;
      const effectiveProjId = projId || 'GENERAL';
      const projectNumber = pObj?.projectNumber || (projId ? 'PROJ' : 'General / Overhead');
      const partName = pObj?.partName || 'General Shopfloor Work';
      const customerName = pObj?.customer?.companyName || 'Internal';

      if (!record.projects.has(effectiveProjId)) {
        record.projects.set(effectiveProjId, {
          projectId: effectiveProjId,
          projectNumber,
          partName,
          customerName,
          hours: 0,
          taskCount: 0,
          activities: [],
        });
      }

      const projRec = record.projects.get(effectiveProjId)!;
      projRec.hours += hours;
      projRec.taskCount += 1;
      projRec.activities.push({
        activityType,
        date: new Date(date).toISOString(),
        hours,
        description,
        ...details,
      });

      record.workLogs.push({
        projectId: effectiveProjId,
        projectNumber,
        partName,
        customerName,
        activityType,
        date: new Date(date).toISOString(),
        hours,
        description,
        ...details,
      });
    };

    // Aggregate MSDR Headers
    for (const msdr of msdrHeaders) {
      if (!msdr.employeeId) continue;
      for (const op of msdr.operations) {
        const hrs = Number(op.runningHours || 0) + Number(op.setupTime || 0);
        addWorkLog(
          msdr.employeeId,
          msdr.projectId,
          hrs,
          'Machining / Production',
          msdr.reportDate || msdr.createdAt,
          op.description || op.operation?.operationName || 'Machine Shop Operation',
          { machineName: msdr.machine?.machineName, producedQty: Number(op.producedQty || 0) }
        );
      }
    }

    // Aggregate MSDR Daily Reports
    for (const rpt of msdrDaily) {
      const hrs = Number(rpt.actualLabourHours || 0) || (Number(rpt.cuttingTime || 0) + Number(rpt.setupTime || 0));
      addWorkLog(
        rpt.employeeId,
        rpt.projectId,
        hrs,
        'Machining Log',
        rpt.reportDate,
        rpt.remarks || 'Daily Machine Shop Work',
        { machineName: rpt.machine?.machineName, producedQty: Number(rpt.producedQty || 0) }
      );
    }

    // Aggregate Design Work Logs
    for (const dlog of designLogs) {
      let empId = dlog.designerId;
      if (!empId && dlog.designerName) {
        const matchedEmp = employees.find(e => e.name.trim().toLowerCase() === dlog.designerName.trim().toLowerCase());
        if (matchedEmp) empId = matchedEmp.id;
      }
      if (empId) {
        addWorkLog(
          empId,
          dlog.projectId,
          Number(dlog.hoursSpent || 0),
          'CAD Design & Engineering',
          dlog.workDate,
          `${dlog.workStage}: ${dlog.description} (${dlog.partName || ''})`,
          { drawingNumber: dlog.drawingNumber, stage: dlog.workStage }
        );
      }
    }

    // Aggregate Production Operations
    for (const pop of prodOps) {
      const hrs = Number(pop.calculatedLabourHours || 0);
      const projId = pop.productionBatch?.project?.id;
      addWorkLog(
        pop.employeeId,
        projId,
        hrs,
        'Production Assembly',
        pop.startTime,
        pop.remarks || 'Production Operation',
        { machineName: pop.machine?.machineName, producedQty: Number(pop.producedQty || 0) }
      );
    }

    // Compile result per employee
    const resultEmployees = employees.map(emp => {
      const hourlyRate = Number(emp.hourlyRate || 0);
      const workData = employeeWorkMap.get(emp.id) || { totalHours: 0, projects: new Map(), workLogs: [] };
      const totalHours = Math.round(workData.totalHours * 100) / 100;
      
      const standardHours = 160;
      const baseSalaryCalculated = hourlyRate > 0 
        ? (totalHours > 0 ? totalHours * hourlyRate : standardHours * hourlyRate) 
        : 0;

      const saved = salaryMap.get(emp.id);
      const actualSalary = saved ? Number(saved.actualSalary) : baseSalaryCalculated;
      const remarks = saved?.remarks || '';
      const isCustomSalary = !!saved;

      const projectsList = Array.from(workData.projects.values()).map(p => ({
        ...p,
        hours: Math.round(p.hours * 100) / 100,
      }));

      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.name,
        designation: emp.designation || 'Staff',
        employeeType: emp.employeeType,
        department: emp.department ? { id: emp.department.id, name: emp.department.departmentName } : null,
        hourlyRate,
        totalHours,
        standardHours,
        baseSalaryCalculated: Math.round(baseSalaryCalculated * 100) / 100,
        actualSalary: Math.round(actualSalary * 100) / 100,
        variance: Math.round((actualSalary - baseSalaryCalculated) * 100) / 100,
        isCustomSalary,
        remarks,
        projectCount: projectsList.length,
        projects: projectsList,
        workLogs: workData.workLogs,
      };
    });

    const totalHoursWorked = resultEmployees.reduce((sum, e) => sum + e.totalHours, 0);
    const totalBaseSalary = resultEmployees.reduce((sum, e) => sum + e.baseSalaryCalculated, 0);
    const totalActualSalary = resultEmployees.reduce((sum, e) => sum + e.actualSalary, 0);

    return {
      monthYear,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      summary: {
        totalEmployees: resultEmployees.length,
        totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
        totalBaseSalary: Math.round(totalBaseSalary * 100) / 100,
        totalActualSalary: Math.round(totalActualSalary * 100) / 100,
        totalVariance: Math.round((totalActualSalary - totalBaseSalary) * 100) / 100,
      },
      employees: resultEmployees,
    };
  }

  async upsertMonthlySalary(dto: { employeeId: string; monthYear: string; actualSalary: number; remarks?: string }, userId?: string) {
    const { employeeId, monthYear, actualSalary, remarks } = dto;
    return (this.prisma as any).employeeMonthlySalary.upsert({
      where: {
        employeeId_monthYear: {
          employeeId,
          monthYear,
        },
      },
      update: {
        actualSalary,
        remarks: remarks !== undefined ? remarks : undefined,
        updatedBy: userId,
      },
      create: {
        employeeId,
        monthYear,
        actualSalary,
        remarks,
        createdBy: userId,
      },
    });
  }
}

