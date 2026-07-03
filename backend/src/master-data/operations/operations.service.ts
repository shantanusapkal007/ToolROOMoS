import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.operation.findMany({
      orderBy: { operationName: 'asc' },
    });
  }
}
