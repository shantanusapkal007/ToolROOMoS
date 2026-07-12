import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMsdrDto } from './dto/create-msdr.dto';
import { EventBus } from '../platform/event.bus';
import { AuditEngine } from '../platform/audit.engine';

@Injectable()
export class ProductionOperationsService {
  private readonly logger = new Logger(ProductionOperationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly audit: AuditEngine,
  ) {}

  async logMachineShopReport(dto: CreateMsdrDto, userId: string = 'SYSTEM') {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Validate Machine & Employee
      const machine = await tx.machine.findUniqueOrThrow({ where: { id: dto.machineId } });
      const employee = await tx.employee.findUniqueOrThrow({ where: { id: dto.employeeId } });

      // 2. Create the MSDR Header
      const msdrHeader = await tx.msdrHeader.create({
        data: {
          projectId: dto.projectId,
          machineId: dto.machineId,
          employeeId: dto.employeeId,
          shift: dto.shift,
          supervisorId: dto.supervisorId,
          reportDate: new Date(dto.reportDate),
          remarks: dto.remarks,
          
          createdBy: userId,
          
        },
      });

      const processedOperations = [];

      // 3. Process each Operation
      for (const op of dto.operations) {
        let opId = (op as any).operationId;
        let routingOperation = null;

        // 4. Update RoutingOperation Progress if applicable
        if (op.routingOperationId) {
          routingOperation = await tx.routingOperation.findUnique({
            where: { id: op.routingOperationId },
            include: { operation: true }
          });

          if (routingOperation) {
            opId = routingOperation.operationId;
            const produced = op.producedQty || 0;
            const completedQty = routingOperation.completedQuantity.toNumber() + produced;
            const currentRemaining = routingOperation.remainingQuantity.toNumber();
            const newRemaining = currentRemaining >= produced ? currentRemaining - produced : 0;
            
            await tx.routingOperation.update({
                where: { id: routingOperation.id },
                data: {
                    completedQuantity: completedQty,
                    remainingQuantity: newRemaining,
                    status: newRemaining === 0 ? 'COMPLETED' : 'IN_PROGRESS'
                }
            });

            // Workflow Automation Activity
            await tx.projectActivity.create({
              data: {
                projectId: dto.projectId,
                action: 'PRODUCTION_LOGGED',
                description: `MSDR recorded for operation ${routingOperation.operation?.operationName || 'N/A'}. Produced: ${op.producedQty}, Scrap: ${op.scrapQty}`,
                performedBy: userId,
              },
            });
          }
        }

        if (!opId) {
          throw new BadRequestException('Operation ID is required');
        }

        // Create the MsdrOperation record
        const msdrOp = await tx.msdrOperation.create({
          data: {
            msdrHeaderId: msdrHeader.id,
            operationId: opId,
            routingOperationId: op.routingOperationId,
            materialIssueId: op.materialIssueId,
            inventoryBatchId: op.inventoryBatchId,
            startTime: op.startTime ? new Date(op.startTime) : null,
            endTime: op.endTime ? new Date(op.endTime) : null,
            setupTime: op.setupTime || 0,
            runningHours: op.runningHours || 0,
            producedQty: op.producedQty || 0,
            scrapQty: op.scrapQty || 0,
          },
        });

        processedOperations.push({
          msdrOp,
          machineId: machine.id,
          machineRate: machine.hourlyRate.toNumber(),
          employeeId: employee.id,
          employeeRate: employee.hourlyRate.toNumber(),
          inventoryBatchId: op.inventoryBatchId,
          routingOperationId: op.routingOperationId,
          totalHrs: (op.setupTime || 0) + (op.runningHours || 0)
        });
      }

      await this.audit.logAction(msdrHeader.id, 'MSDR', 'CREATE', userId, msdrHeader);

      return { msdrHeader, processedOperations };
    });

    // 5. Emit Domain Event for Cost Engine integration
    this.eventBus.emit('ProductionOperationLogged', {
      projectId: dto.projectId,
      msdrHeaderId: result.msdrHeader.id,
      operations: result.processedOperations,
      userId,
    });

    return this.prisma.msdrHeader.findUnique({
      where: { id: result.msdrHeader.id },
      include: { operations: true }
    });
  }

  async getMachineShopReports(projectId: string) {
    return this.prisma.msdrHeader.findMany({
      where: { projectId },
      include: { machine: true, employee: true, operations: true },
      orderBy: { reportDate: 'desc' },
    });
  }
}
