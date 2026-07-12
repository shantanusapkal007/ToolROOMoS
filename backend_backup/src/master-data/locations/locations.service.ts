import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLocationDto: CreateLocationDto) {
    const locationCode = createLocationDto.locationCode || createLocationDto.code;
    const locationName = createLocationDto.locationName || createLocationDto.name || locationCode;

    if (!locationCode || !locationName) {
      throw new BadRequestException('locationCode and locationName are required.');
    }

    // Note: warehouseId must exist. Prisma relational constraints will enforce this.
    return this.prisma.storageLocation.create({
      data: {
        locationCode,
        locationName,
        status: createLocationDto.status || 'ACTIVE',
        remarks: createLocationDto.remarks,
        warehouse: {
          connect: { id: createLocationDto.warehouseId }
        }
      },
    });
  }

  async findAll() {
    return this.prisma.storageLocation.findMany({
      where: { status: 'ACTIVE' },
      include: { warehouse: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const location = await this.prisma.storageLocation.findUnique({
      where: { id },
      include: { warehouse: true }
    });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  async update(id: string, updateLocationDto: UpdateLocationDto) {
    const locationCode = updateLocationDto.locationCode || updateLocationDto.code;
    const locationName = updateLocationDto.locationName || updateLocationDto.name;

    return this.prisma.storageLocation.update({
      where: { id },
      data: {
        locationCode,
        locationName,
        warehouseId: updateLocationDto.warehouseId,
        status: updateLocationDto.status,
        remarks: updateLocationDto.remarks,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.storageLocation.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
