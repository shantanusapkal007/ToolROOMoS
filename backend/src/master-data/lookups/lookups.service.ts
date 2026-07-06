import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LookupsService {
  constructor(private readonly prisma: PrismaService) {}

  async companies() {
    return this.prisma.company.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { companyName: 'asc' },
      select: { id: true, companyCode: true, companyName: true },
    });
  }

  async plants() {
    return this.prisma.plant.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { plantName: 'asc' },
      select: { id: true, plantCode: true, plantName: true, companyId: true },
    });
  }

  async departments() {
    return this.prisma.department.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { departmentName: 'asc' },
      select: { id: true, departmentCode: true, departmentName: true, plantId: true },
    });
  }

  async shifts() {
    return this.prisma.shift.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { shiftName: 'asc' },
      select: { id: true, shiftName: true, startTime: true, endTime: true },
    });
  }

  async materialShapes() {
    return this.prisma.materialShape.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { shapeName: 'asc' },
      select: { id: true, shapeName: true },
    });
  }
}
