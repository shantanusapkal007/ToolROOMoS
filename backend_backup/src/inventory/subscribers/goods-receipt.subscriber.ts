import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GoodsReceiptSubscriber {
  private readonly logger = new Logger(GoodsReceiptSubscriber.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('GoodsReceiptCreated')
  async handleGoodsReceiptCreated(payload: any) {
    this.logger.log(`Received GoodsReceiptCreated event for GRN: ${payload.grnNumber}`);
    
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const item of payload.items) {
          const poItem = item.poItem;
          const grnItem = item.grnItem;
          const warehouse = item.warehouse;

          // 1. Update Current Stock (upsert)
          await tx.inventoryStock.upsert({
            where: {
              materialId_warehouseId: {
                materialId: poItem.materialId,
                warehouseId: warehouse.id,
              },
            },
            update: {
              currentQuantity: { increment: grnItem.acceptedQty },
              availableQuantity: { increment: grnItem.acceptedQty },
            },
            create: {
              materialId: poItem.materialId,
              warehouseId: warehouse.id,
              currentQuantity: grnItem.acceptedQty,
              availableQuantity: grnItem.acceptedQty,
              reservedQuantity: 0,
            },
          });

          // 2. Create Inventory Batch for traceability
          if (grnItem.acceptedQty > 0) {
            const batchNumber = grnItem.batchNumber || `BATCH-${payload.grnNumber}-${poItem.id.substring(0, 4)}`;
            
            await tx.inventoryBatch.create({
              data: {
                materialId: poItem.materialId,
                batchNumber: batchNumber,
                rack: grnItem.rackLocation,
                bin: grnItem.binLocation,
                receivedQty: grnItem.acceptedQty,
                currentQty: grnItem.acceptedQty,
                availableQty: grnItem.acceptedQty,
                unitCost: grnItem.actualRate,
                heatNumber: grnItem.heatNumber,
                grnItemId: grnItem.id,
                createdBy: payload.userId || 'SYSTEM',
              },
            });
          }

          // 3. Record Inventory Transaction
          await tx.inventoryTransaction.create({
            data: {
              projectId: payload.projectId,
              inventoryBatchId: grnItem.id, // Using grnItem ID as reference point since batch creation might be deferred or linked
              movementType: 'GRN_RECEIPT',
              quantity: grnItem.acceptedQty,
              referenceDocType: 'GRN',
              referenceDocId: payload.grnHeaderId,
              remarks: grnItem.remarks || 'Auto-generated from GRN event',
              createdBy: payload.userId || 'SYSTEM',
            },
          });
        }
      });
      this.logger.log(`Successfully processed inventory updates for GRN: ${payload.grnNumber}`);
    } catch (error) {
      this.logger.error(`Failed to process inventory for GRN ${payload.grnNumber}: ${error.message}`);
      throw error;
    }
  }
}
