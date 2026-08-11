import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto, userId?: string) {
    let { departmentId, departmentName, department, ...rest } = dto as any;
    const deptInput = department || departmentName || departmentId;

    let targetDeptId: string | undefined = undefined;

    if (deptInput) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deptInput);
      const orConditions: any[] = [
        { departmentCode: deptInput },
        { departmentName: { equals: deptInput, mode: 'insensitive' } },
      ];
      if (isUuid) {
        orConditions.push({ id: deptInput });
      }

      const existing = await this.prisma.department.findFirst({
        where: {
          OR: orConditions,
        },
      });

      if (existing) {
        targetDeptId = existing.id;
      } else {
        let plant = await this.prisma.plant.findFirst();
        if (!plant) {
          let company = await this.prisma.company.findFirst();
          if (!company) {
            company = await this.prisma.company.create({
              data: { companyCode: 'COMP-01', companyName: 'Enterprise Toolroom Organization' },
            });
          }
          plant = await this.prisma.plant.create({
            data: { plantCode: 'PLANT-01', plantName: 'Main Toolroom Plant', companyId: company.id },
          });
        }

        const newDept = await this.prisma.department.create({
          data: {
            departmentCode: `DEPT-${deptInput.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
            departmentName: deptInput,
            plantId: plant.id,
          },
        });
        targetDeptId = newDept.id;
      }
    }

    if (!targetDeptId) {
      let fallback = await this.prisma.department.findFirst();
      if (!fallback) {
        let plant = await this.prisma.plant.findFirst();
        if (!plant) {
          let company = await this.prisma.company.findFirst();
          if (!company) {
            company = await this.prisma.company.create({
              data: { companyCode: 'COMP-01', companyName: 'Enterprise Toolroom Organization' },
            });
          }
          plant = await this.prisma.plant.create({
            data: { plantCode: 'PLANT-01', plantName: 'Main Toolroom Plant', companyId: company.id },
          });
        }
        fallback = await this.prisma.department.create({
          data: { departmentCode: 'DEPT-TOOLROOM', departmentName: 'Toolroom Shopfloor', plantId: plant.id },
        });
      }
      targetDeptId = fallback.id;
    }

    const existingEmp = await this.prisma.employee.findUnique({
      where: { employeeCode: rest.employeeCode },
    });

    if (existingEmp) {
      return this.prisma.employee.update({
        where: { id: existingEmp.id },
        data: {
          name: rest.name,
          designation: rest.designation !== undefined ? rest.designation : existingEmp.designation,
          departmentId: targetDeptId,
          hourlyRate: rest.hourlyRate !== undefined ? rest.hourlyRate : existingEmp.hourlyRate,
          employeeType: rest.employeeType || existingEmp.employeeType,
          status: rest.status || existingEmp.status,
          remarks: rest.remarks !== undefined ? rest.remarks : existingEmp.remarks,
          updatedBy: userId,
        },
      });
    }

    return this.prisma.employee.create({
      data: {
        ...rest,
        departmentId: targetDeptId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    departmentId?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
        { designation: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { department: true, shift: true },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.employee.findUniqueOrThrow({
      where: { id },
      include: { department: true, shift: true },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto, userId?: string) {
    const { departmentName, department, ...updateData } = dto as any;
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: userId,
      },
    });
  }

  async softDelete(id: string, userId?: string) {
    return this.prisma.employee.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        updatedBy: userId,
      },
    });
  }
}
