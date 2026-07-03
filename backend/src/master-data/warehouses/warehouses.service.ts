import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWarehouseDto: CreateWarehouseDto) {
    const defaultPlant = await this.prisma.plant.findFirst();
    if (!defaultPlant) {
      throw new Error("No plant found in the database. Please run seed script first.");
    }
    
    return this.prisma.warehouse.create({
      data: {
        warehouseCode: createWarehouseDto.code,
        warehouseName: createWarehouseDto.name,
        warehouseType: createWarehouseDto.type,
        status: createWarehouseDto.status,
        plantId: defaultPlant.id,
      },
    });
  }

  async findAll() {
    return this.prisma.warehouse.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      include: { locations: true }
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    return this.prisma.warehouse.update({
      where: { id },
      data: {
        warehouseCode: updateWarehouseDto.code,
        warehouseName: updateWarehouseDto.name,
        warehouseType: updateWarehouseDto.type,
        status: updateWarehouseDto.status,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.warehouse.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
