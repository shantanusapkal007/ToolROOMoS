import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AddLogDto } from './dto/add-log.dto';
import { AddSparePartDto } from './dto/add-spare-part.dto';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.maintenanceTicket.findMany({
      include: {
        machine: {
          include: { department: true, plant: true }
        },
        project: true,
        reportedBy: true,
        assignedTo: true,
        spareParts: {
          include: { material: true }
        },
        logs: {
          include: { loggedBy: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
      include: {
        machine: {
          include: { department: true, plant: true }
        },
        project: true,
        reportedBy: true,
        assignedTo: true,
        spareParts: {
          include: { material: true }
        },
        logs: {
          include: { loggedBy: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async create(createDto: CreateTicketDto, userId: string) {
    const machine = await this.prisma.machine.findUnique({ where: { id: createDto.machineId }});
    if (!machine) throw new NotFoundException('Machine not found');

    if (createDto.projectId) {
      const project = await this.prisma.project.findUnique({ where: { id: createDto.projectId } });
      if (!project) throw new NotFoundException('Project not found');
    }

    if (createDto.assignedToId) {
      const assignedUser = await this.prisma.user.findUnique({ where: { id: createDto.assignedToId } });
      if (!assignedUser) throw new NotFoundException('Assigned technician not found');
    }

    const count = await this.prisma.maintenanceTicket.count();
    const ticketNumber = `MT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const ticket = await this.prisma.maintenanceTicket.create({
      data: {
        ticketNumber,
        machineId: createDto.machineId,
        plantId: machine.plantId,
        projectId: createDto.projectId || null,
        issueDescription: createDto.issueDescription,
        priority: createDto.priority || 'NORMAL',
        category: createDto.category || null,
        assignedToId: createDto.assignedToId || null,
        downtimeStartedAt: createDto.downtimeStartedAt ? new Date(createDto.downtimeStartedAt) : null,
        lotoApplied: Boolean(createDto.lotoApplied),
        reportedById: userId,
        status: 'OPEN',
      },
    });

    // Automatically put machine in MAINTENANCE status if breakdown is reported
    await this.prisma.machine.update({
      where: { id: createDto.machineId },
      data: { status: 'MAINTENANCE' },
    });

    return ticket;
  }

  async update(id: string, updateDto: UpdateTicketDto, userId: string) {
    const data: any = {};
    if (updateDto.status) data.status = updateDto.status;
    if (updateDto.assignedToId) data.assignedToId = updateDto.assignedToId;
    if (updateDto.lotoApplied !== undefined) data.lotoApplied = updateDto.lotoApplied;

    if (updateDto.status === 'RESOLVED' || updateDto.status === 'CLOSED') {
      data.resolvedAt = new Date();
      
      const ticket = await this.prisma.maintenanceTicket.findUnique({ where: { id } });
      if (ticket) {
        await this.prisma.machine.update({
          where: { id: ticket.machineId },
          data: { status: 'ACTIVE' },
        });
      }
    }

    const updatedTicket = await this.prisma.maintenanceTicket.update({
      where: { id },
      data,
    });

    // If LOTO status changed, log it automatically
    if (updateDto.lotoApplied !== undefined) {
      await this.prisma.maintenanceLog.create({
        data: {
          ticketId: id,
          actionTaken: updateDto.lotoApplied ? 'LOTO Applied to machine.' : 'LOTO Removed from machine.',
          loggedById: userId,
        },
      });
    }

    return updatedTicket;
  }

  private async logFinancialCost(tx: any, ticketId: string, amount: number, description: string) {
    const ticket = await tx.maintenanceTicket.findUnique({ where: { id: ticketId }});
    if (!ticket || amount === 0) return;

    // Update the total cost on the ticket
    await tx.maintenanceTicket.update({
      where: { id: ticketId },
      data: {
        totalCost: { increment: amount }
      }
    });

    // If linked to a Project, record as Project Cost Event
    if (ticket.projectId) {
      await tx.projectCostEvent.create({
        data: {
          projectId: ticket.projectId,
          costType: 'MACHINE_COST',
          description: `Maintenance Cost [${ticket.ticketNumber}]: ${description}`,
          amount,
          referenceDocType: 'MAINTENANCE_TICKET',
          referenceDocId: ticket.ticketNumber,
        }
      });
      
      // Update the project cost summary
      const summary = await tx.projectCostSummary.findUnique({ where: { projectId: ticket.projectId }});
      if (summary) {
        await tx.projectCostSummary.update({
          where: { id: summary.id },
          data: { machineCost: { increment: amount }, totalCost: { increment: amount }}
        });
      }
    } else {
      // General ledger account entry (Factory Overhead)
      await tx.accountEntry.create({
        data: {
          projectId: null,
          type: 'DEBIT',
          amount,
          category: 'Factory Overhead - Maintenance',
          entryType: 'EXPENSE',
          referenceId: ticket.ticketNumber,
        }
      });
    }
  }

  async addLog(ticketId: string, logDto: AddLogDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Calculate Labor Cost
      let laborCost = 0;
      if (logDto.timeSpentHours && logDto.timeSpentHours > 0) {
        const user = await tx.user.findUnique({ where: { id: userId }});
        if (user && user.hourlyRate) {
          laborCost = Number(user.hourlyRate) * logDto.timeSpentHours;
        }
      }

      const log = await tx.maintenanceLog.create({
        data: {
          ticketId,
          actionTaken: logDto.actionTaken,
          timeSpentHours: logDto.timeSpentHours || 0,
          loggedById: userId,
        },
      });

      if (laborCost > 0) {
        await this.logFinancialCost(tx, ticketId, laborCost, `Labor: ${logDto.timeSpentHours} hrs by ${userId}`);
      }

      return log;
    });
  }

  async addSparePart(ticketId: string, sparePartDto: AddSparePartDto) {
    return this.prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({ where: { id: sparePartDto.materialId }});
      if (!material) throw new Error('Material not found');

      const costAtTime = Number(material.standardCost || 0);
      const totalMaterialCost = costAtTime * sparePartDto.quantityConsumed;

      const sparePart = await tx.maintenanceSparePart.create({
        data: {
          ticketId,
          materialId: sparePartDto.materialId,
          quantityConsumed: sparePartDto.quantityConsumed,
          costAtTime,
        }
      });

      if (totalMaterialCost > 0) {
        await this.logFinancialCost(tx, ticketId, totalMaterialCost, `Spare Part: ${sparePartDto.quantityConsumed}x ${material.materialCode}`);
      }

      // Decrement inventory stock for consumed maintenance spare parts
      const warehouse = await tx.warehouse.findFirst({ where: { status: 'ACTIVE' } }) || await tx.warehouse.findFirst();
      if (warehouse) {
        const stock = await tx.inventoryStock.findUnique({
          where: {
            materialId_warehouseId: {
              materialId: sparePartDto.materialId,
              warehouseId: warehouse.id,
            }
          }
        });

        if (stock) {
          await tx.inventoryStock.update({
            where: {
              materialId_warehouseId: {
                materialId: sparePartDto.materialId,
                warehouseId: warehouse.id,
              }
            },
            data: {
              currentQuantity: { decrement: sparePartDto.quantityConsumed },
              availableQuantity: { decrement: sparePartDto.quantityConsumed },
            }
          });
        }
      }

      // Decrement inventory batches via FIFO and log transaction
      const batches = await tx.inventoryBatch.findMany({
        where: { materialId: sparePartDto.materialId, currentQty: { gt: 0 } },
        orderBy: { createdAt: 'asc' },
      });

      let remainingToDeduct = sparePartDto.quantityConsumed;
      for (const batch of batches) {
        if (remainingToDeduct <= 0) break;
        const deduct = Math.min(Number(batch.currentQty), remainingToDeduct);
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: {
            currentQty: { decrement: deduct },
            availableQty: { decrement: deduct },
          }
        });
        await tx.inventoryTransaction.create({
          data: {
            inventoryBatchId: batch.id,
            movementType: 'MATERIAL_ISSUE',
            quantity: deduct,
            remarks: `Maintenance Spare Part for Ticket`,
          }
        });
        remainingToDeduct -= deduct;
      }

      return sparePart;
    });
  }

  async getMachineMetrics(machineId: string) {
    const resolvedTickets = await this.prisma.maintenanceTicket.findMany({
      where: {
        machineId,
        status: { in: ['RESOLVED', 'CLOSED'] },
        downtimeStartedAt: { not: null },
        resolvedAt: { not: null },
      },
    });

    let totalDowntimeHours = 0;
    resolvedTickets.forEach((ticket) => {
      const diffMs = ticket.resolvedAt!.getTime() - ticket.downtimeStartedAt!.getTime();
      totalDowntimeHours += diffMs / (1000 * 60 * 60);
    });

    const breakdownCount = resolvedTickets.length;
    const mttr = breakdownCount > 0 ? totalDowntimeHours / breakdownCount : 0;

    // Get actual operating running hours from MSDR
    const msdrOperations = await this.prisma.msdrOperation.findMany({
      where: {
        msdrHeader: {
          machineId,
        },
      },
      select: {
        runningHours: true,
      },
    });

    const totalOperatingHours = msdrOperations.reduce((sum, op) => sum + Number(op.runningHours || 0), 0);
    const mtbf = breakdownCount > 0 ? totalOperatingHours / breakdownCount : totalOperatingHours;

    return {
      machineId,
      mttrHours: Number(mttr.toFixed(2)),
      mtbfHours: Number(mtbf.toFixed(2)),
      totalDowntimeHours: Number(totalDowntimeHours.toFixed(2)),
      totalOperatingHours: Number(totalOperatingHours.toFixed(2)),
      breakdownCount,
    };
  }
}
