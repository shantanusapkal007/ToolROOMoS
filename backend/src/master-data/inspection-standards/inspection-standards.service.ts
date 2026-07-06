import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInspectionStandardDto, UpdateInspectionStandardDto } from './dto/inspection-standard.dto';

@Injectable()
export class InspectionStandardsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInspectionStandardDto) {
    const existing = await this.prisma.inspectionStandard.findUnique({
      where: { standardCode: dto.standardCode },
    });
    if (existing) throw new ConflictException('Inspection Standard code already exists');

    return this.prisma.inspectionStandard.create({ data: dto });
  }

  async findAll() {
    return this.prisma.inspectionStandard.findMany({
      orderBy: { standardCode: 'asc' },
    });
  }

  async findOne(id: string) {
    const standard = await this.prisma.inspectionStandard.findUnique({ where: { id } });
    if (!standard) throw new NotFoundException('Inspection Standard not found');
    return standard;
  }

  async update(id: string, dto: UpdateInspectionStandardDto) {
    await this.findOne(id);
    return this.prisma.inspectionStandard.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.inspectionStandard.delete({ where: { id } });
  }
}
