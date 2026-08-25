import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryMovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getLedger() {
    return this.prisma.inventoryBatch.findMany({
      include: {
        material: true,
        location: {
          include: {
            warehouse: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });
  }

  async getInventoryLedger() {
    return this.getLedger();
  }

  async getStockByMaterial(materialId: string) {
    return this.prisma.inventoryStock.findMany({
      where: { materialId },
      include: {
        warehouse: true,
      }
    });
  }

  async getBatchesByMaterial(materialId: string) {
    return this.prisma.inventoryBatch.findMany({
      where: { materialId, currentQty: { gt: 0 } },
      include: {
        location: {
          include: {
            warehouse: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc', // FIFO default
      }
    });
  }

  async createManualBatch(data: {
    materialId: string;
    batchNumber?: string;
    heatNumber?: string;
    currentQty: number;
    unitCost?: number;
    locationId?: string;
    warehouseId?: string;
  }) {
    const batchNumber = data.batchNumber || `BAT-MAN-${Date.now()}`;
    const newBatch = await this.prisma.inventoryBatch.create({
      data: {
        materialId: data.materialId,
        batchNumber,
        heatNumber: data.heatNumber || 'N/A',
        currentQty: data.currentQty,
        availableQty: data.currentQty,
        unitCost: data.unitCost || 0,
        locationId: data.locationId || null,
        status: 'AVAILABLE',
      },
      include: {
        material: true,
        location: true,
      }
    });

    await this.prisma.inventoryTransaction.create({
      data: {
        inventoryBatchId: newBatch.id,
        movementType: InventoryMovementType.GRN_RECEIPT,
        quantity: data.currentQty,
        remarks: 'Manual Stock Intake',
      }
    });

    // Resolve warehouse and synchronize inventoryStock ledger
    let targetWarehouseId = data.warehouseId;
    if (!targetWarehouseId && data.locationId) {
      const loc = await this.prisma.storageLocation.findUnique({
        where: { id: data.locationId },
        select: { warehouseId: true }
      });
      targetWarehouseId = loc?.warehouseId;
    }
    if (!targetWarehouseId) {
      const defaultWh = await this.prisma.warehouse.findFirst({ where: { status: 'ACTIVE' } }) || await this.prisma.warehouse.findFirst();
      targetWarehouseId = defaultWh?.id;
    }

    if (targetWarehouseId) {
      await this.prisma.inventoryStock.upsert({
        where: {
          materialId_warehouseId: {
            materialId: data.materialId,
            warehouseId: targetWarehouseId,
          }
        },
        create: {
          materialId: data.materialId,
          warehouseId: targetWarehouseId,
          currentQuantity: data.currentQty,
          availableQuantity: data.currentQty,
        },
        update: {
          currentQuantity: { increment: data.currentQty },
          availableQuantity: { increment: data.currentQty },
        }
      });
    }

    return newBatch;
  }
}
