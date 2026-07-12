import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RoutingValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateNewOperations(routingHeaderId: string, newOps: any[]) {
    // 1. Missing fields check
    for (const op of newOps) {
      if (!op.operationId && !op.operationName) {
        throw new BadRequestException('Operation must have either an ID or a Name.');
      }
      if (op.cycleTime !== undefined && op.cycleTime < 0) {
        throw new BadRequestException('Cycle time cannot be negative.');
      }
      if (op.estimatedHours !== undefined && op.estimatedHours <= 0) {
        throw new BadRequestException('Estimated hours must be greater than zero.');
      }
    }

    // 2. Duplicate Sequence Order Detection
    const existingOps = await this.prisma.routingOperation.findMany({
      where: { routingHeaderId },
      select: { sequenceOrder: true }
    });

    const existingSequences = new Set(existingOps.map((o: any) => o.sequenceOrder));
    const newSequences = new Set();

    for (const op of newOps) {
      if (op.sequenceOrder === undefined || op.sequenceOrder <= 0) {
        throw new BadRequestException('Sequence order must be a positive integer.');
      }
      if (existingSequences.has(op.sequenceOrder) || newSequences.has(op.sequenceOrder)) {
        throw new BadRequestException(`Duplicate sequence order detected: ${op.sequenceOrder}. Operations must have unique sequence numbers.`);
      }
      newSequences.add(op.sequenceOrder);
    }

    // 3. Machine Availability (Mock Check)
    // Here we could check if the machineType exists in Master Data or is not marked as obsolete
  }

  async validateRevision(routingHeaderId: string) {
    const header = await this.prisma.routingHeader.findUniqueOrThrow({ where: { id: routingHeaderId } });
    if (header.approvalStatus === 'APPROVED' || header.status === 'FROZEN') {
      throw new BadRequestException('This Routing is Approved/Frozen and cannot be modified. You must create a new Revision.');
    }
  }
}
