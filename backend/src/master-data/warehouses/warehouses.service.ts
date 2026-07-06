import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWarehouseDto: CreateWarehouseDto) {
    const warehouseCode = createWarehouseDto.warehouseCode || createWarehouseDto.code;
    const warehouseName = createWarehouseDto.warehouseName || createWarehouseDto.name;
    const warehouseType = createWarehouseDto.warehouseType || createWarehouseDto.type;

    if (!warehouseCode || !warehouseName) {
      throw new BadRequestException('warehouseCode and warehouseName are required.');
    }
    
    return this.prisma.warehouse.create({
      data: {
        warehouseCode,
        warehouseName,
        warehouseType,
        status: createWarehouseDto.status || 'ACTIVE',
        remarks: createWarehouseDto.remarks,
        plantId: createWarehouseDto.plantId,
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
    const warehouseCode = updateWarehouseDto.warehouseCode || updateWarehouseDto.code;
    const warehouseName = updateWarehouseDto.warehouseName || updateWarehouseDto.name;
    const warehouseType = updateWarehouseDto.warehouseType || updateWarehouseDto.type;

    return this.prisma.warehouse.update({
      where: { id },
      data: {
        warehouseCode,
        warehouseName,
        warehouseType,
        status: updateWarehouseDto.status,
        plantId: updateWarehouseDto.plantId,
        remarks: updateWarehouseDto.remarks,
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
