import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubcontractOrderDto } from './dto/create-subcontract-order.dto';
import { CreateMultiSubcontractOrderDto } from './dto/create-multi-subcontract-order.dto';
import { CreateSubcontractReceiptDto } from './dto/create-subcontract-receipt.dto';
import { InventoryMovementType } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class SubcontractingService {
  constructor(private prisma: PrismaService) {}

  private generateNumber(prefix: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = randomBytes(2).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private async resolveProjectId(projectId: string, tx?: any): Promise<string> {
    const db = tx || this.prisma;
    const project = await db.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { projectNumber: projectId }
        ]
      }
    });
    return project?.id || projectId;
  }

  /**
   * Shared transactional helper to create a single project's SubcontractOrder,
   * deduct store material batches, record ledger transactions, and advance project stage.
   */
  private async createOrderInTx(
    tx: any,
    projectId: string,
    vendor: any,
    payload: {
      documentNumber?: string;
      expectedReturnDate?: string;
      remarks?: string;
      items: {
        inventoryBatchId?: string;
        operationId: string;
        sentQty: number;
        hoursPerPc?: number;
        rate: number;
        remarks?: string;
      }[];
    },
    userId?: string,
  ) {
    const targetProjectId = await this.resolveProjectId(projectId, tx);
    const project = await tx.project.findUnique({ where: { id: targetProjectId } });
    if (!project) throw new NotFoundException(`Project '${projectId}' not found`);

    let totalEstimatedCost = 0;
    const orderItemsData = payload.items.map((item) => {
      const hoursPerPc = Number(item.hoursPerPc) > 0 ? Number(item.hoursPerPc) : 1;
      const ratePerHour = Number(item.rate) || 0;
      const lineEstimatedCost = item.sentQty * hoursPerPc * ratePerHour;
      totalEstimatedCost += lineEstimatedCost;
      return {
        inventoryBatchId: item.inventoryBatchId,
        operationId: item.operationId,
        sentQty: item.sentQty,
        hoursPerPc,
        rate: ratePerHour,
        lineEstimatedCost,
        remarks: item.remarks,
      };
    });

    const challanNumber = this.generateNumber('SC');

    const order = await tx.subcontractOrder.create({
      data: {
        projectId: targetProjectId,
        vendorId: vendor.id,
        challanNumber,
        documentNumber: payload.documentNumber,
        expectedReturnDate:
          payload.expectedReturnDate && payload.expectedReturnDate.trim() !== ''
            ? new Date(payload.expectedReturnDate)
            : null,
        totalEstimatedCost,
        status: 'ISSUED',
        remarks: payload.remarks,
        createdBy: userId,
        updatedBy: userId,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        project: {
          include: {
            customer: true,
          },
        },
        items: {
          include: {
            operation: true,
            inventoryBatch: {
              include: {
                material: true,
                grnItem: { include: { poItem: true } },
              },
            },
          },
        },
        vendor: true,
      },
    });

    // Deduct material from stores if material batch is specified
    let materialDeductedCount = 0;
    for (const item of payload.items) {
      if (item.inventoryBatchId && item.sentQty > 0) {
        const batch = await tx.inventoryBatch.findUnique({
          where: { id: item.inventoryBatchId },
          include: { material: true, location: true },
        });

        if (!batch) {
          throw new NotFoundException(`Inventory batch ${item.inventoryBatchId} not found.`);
        }

        const availableQty = Number(batch.availableQty || 0);
        if (availableQty < item.sentQty) {
          throw new BadRequestException(
            `Insufficient available stock in Batch ${batch.batchNumber}. Available: ${availableQty}, Requested: ${item.sentQty}`,
          );
        }

        const remainingBatchQty = availableQty - item.sentQty;
        const updateBatchCount = await tx.inventoryBatch.updateMany({
          where: {
            id: item.inventoryBatchId,
            availableQty: { gte: item.sentQty },
          },
          data: {
            currentQty: { decrement: item.sentQty },
            availableQty: { decrement: item.sentQty },
            issuedQty: { increment: item.sentQty },
            status: remainingBatchQty === 0 ? 'CONSUMED' : 'AVAILABLE',
          },
        });

        if (updateBatchCount.count === 0) {
          throw new BadRequestException(
            `Concurrent modification or insufficient stock in Batch ${batch.batchNumber}.`,
          );
        }

        let currentStock = null;
        if (batch.location?.warehouseId) {
          currentStock = await tx.inventoryStock.findUnique({
            where: {
              materialId_warehouseId: {
                materialId: batch.materialId,
                warehouseId: batch.location.warehouseId,
              },
            },
          });
        }

        if (!currentStock || Number(currentStock.availableQuantity) < item.sentQty) {
          currentStock = await tx.inventoryStock.findFirst({
            where: {
              materialId: batch.materialId,
              availableQuantity: { gte: item.sentQty },
            },
          });
        }

        if (!currentStock || Number(currentStock.availableQuantity) < item.sentQty) {
          throw new BadRequestException(
            `Insufficient warehouse stock for material ${batch.material?.materialGrade || batch.materialId}. Available: ${currentStock?.availableQuantity || 0}, Requested: ${item.sentQty}`,
          );
        }

        const updateStockCount = await tx.inventoryStock.updateMany({
          where: {
            id: currentStock.id,
            availableQuantity: { gte: item.sentQty },
          },
          data: {
            currentQuantity: { decrement: item.sentQty },
            availableQuantity: { decrement: item.sentQty },
          },
        });

        if (updateStockCount.count === 0) {
          throw new BadRequestException(
            `Concurrent modification or insufficient warehouse stock for material ${batch.material?.materialGrade || batch.materialId}.`,
          );
        }

        await tx.inventoryTransaction.create({
          data: {
            projectId: targetProjectId,
            inventoryBatchId: batch.id,
            movementType: InventoryMovementType.MATERIAL_ISSUE,
            quantity: item.sentQty,
            referenceDocType: 'SUBCONTRACT_CHALLAN',
            referenceDocId: order.id,
            remarks: `Material issued to Subcontractor ${vendor.vendorName} under Challan ${challanNumber}`,
            createdBy: userId,
          },
        });

        materialDeductedCount++;
      }
    }

    // Update project timeline to PRODUCTION if earlier stage
    if (
      project.currentStage === 'CREATED' ||
      project.currentStage === 'ENGINEERING' ||
      project.currentStage === 'PROCUREMENT' ||
      project.currentStage === 'MATERIAL_AVAILABLE'
    ) {
      await tx.project.update({
        where: { id: targetProjectId },
        data: { currentStage: 'PRODUCTION' },
      });

      await tx.projectTimeline.create({
        data: {
          projectId: targetProjectId,
          fromStage: project.currentStage,
          toStage: 'PRODUCTION',
          remarks: `Subcontract Order ${challanNumber} issued.`,
        },
      });
    }

    await tx.projectActivity.create({
      data: {
        projectId: targetProjectId,
        action: 'SUBCONTRACT_ORDER_ISSUED',
        description: `Challan ${challanNumber} generated for ${vendor.vendorName}.${materialDeductedCount > 0 ? ` Material issued from stores for ${materialDeductedCount} line item(s).` : ''}`,
        performedBy: userId || 'SYSTEM',
      },
    });

    return order;
  }

  async createOrder(projectId: string, dto: CreateSubcontractOrderDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.findUnique({ where: { id: dto.vendorId } });
      if (!vendor) throw new NotFoundException('Vendor not found');

      return this.createOrderInTx(tx, projectId, vendor, dto, userId);
    });
  }

  /**
   * Create Multi-Project Subcontract Challan across multiple tool projects at once.
   * Atomically creates one SubcontractOrder per project sharing the same Gate Pass / documentNumber.
   */
  async createMultiProjectOrders(dto: CreateMultiSubcontractOrderDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.findUnique({ where: { id: dto.vendorId } });
      if (!vendor) throw new NotFoundException('Vendor not found');

      const sharedDocumentNumber =
        dto.documentNumber && dto.documentNumber.trim() !== ''
          ? dto.documentNumber.trim()
          : `CHL-${Date.now().toString().slice(-6)}`;

      // Group items by resolved project ID preserving order
      const groupedByProject = new Map<string, typeof dto.items>();
      for (const item of dto.items) {
        if (!item.projectId) {
          throw new BadRequestException('Every subcontract line item must belong to a project.');
        }
        const resolvedId = await this.resolveProjectId(item.projectId, tx);
        const existing = groupedByProject.get(resolvedId) || [];
        existing.push(item);
        groupedByProject.set(resolvedId, existing);
      }

      const createdOrders = [];
      for (const [resolvedProjectId, projectItems] of groupedByProject.entries()) {
        const order = await this.createOrderInTx(
          tx,
          resolvedProjectId,
          vendor,
          {
            documentNumber: sharedDocumentNumber,
            expectedReturnDate: dto.expectedReturnDate,
            remarks: dto.remarks,
            items: projectItems,
          },
          userId,
        );
        createdOrders.push(order);
      }

      return {
        documentNumber: sharedDocumentNumber,
        vendor,
        projectCount: createdOrders.length,
        orders: createdOrders,
      };
    });
  }

  async getAllGlobalOrders() {
    return this.prisma.subcontractOrder.findMany({
      include: {
        project: {
          include: {
            customer: true,
          },
        },
        vendor: true,
        items: {
          include: {
            operation: true,
            inventoryBatch: {
              include: {
                material: true,
                grnItem: { include: { poItem: true } },
              },
            },
          },
        },
        subcontractReceipts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAvailableBatches() {
    return this.prisma.inventoryBatch.findMany({
      where: { availableQty: { gt: 0 }, status: 'AVAILABLE' },
      include: {
        material: true,
        grnItem: {
          include: {
            poItem: true,
            grnHeader: {
              include: {
                project: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrders(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.subcontractOrder.findMany({
      where: { projectId: targetProjectId },
      include: {
        vendor: true,
        items: {
          include: {
            operation: true,
            inventoryBatch: {
              include: {
                material: true,
              },
            },
          },
        },
        subcontractReceipts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelOrder(projectId: string, orderId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId, tx);
      const order = await tx.subcontractOrder.findFirst({
        where: {
          id: orderId,
          projectId: targetProjectId,
        },
        include: {
          items: {
            include: {
              inventoryBatch: {
                include: {
                  material: true,
                  location: true,
                },
              },
            },
          },
          subcontractReceipts: true,
          vendor: true,
        },
      });

      if (!order) {
        throw new NotFoundException(`Subcontract Order '${orderId}' not found.`);
      }

      if (order.status === 'CANCELLED') {
        throw new BadRequestException('Subcontract Order is already cancelled.');
      }

      if (order.subcontractReceipts && order.subcontractReceipts.length > 0) {
        throw new BadRequestException(
          'Cannot cancel a subcontract order that already has processed return receipts.',
        );
      }

      if (order.status === 'CLOSED' || order.status === 'PARTIAL_RECEIPT') {
        throw new BadRequestException(
          'Cannot cancel a subcontract order that has been partially or fully received.',
        );
      }

      // Revert stores material for items that issued stock
      for (const item of order.items) {
        const sentQty = Number(item.sentQty || 0);
        if (item.inventoryBatchId && sentQty > 0) {
          const batch = item.inventoryBatch;
          if (batch) {
            // Restore batch quantity
            await tx.inventoryBatch.update({
              where: { id: item.inventoryBatchId },
              data: {
                currentQty: { increment: sentQty },
                availableQty: { increment: sentQty },
                issuedQty: { decrement: sentQty },
                status: 'AVAILABLE',
              },
            });

            // Restore warehouse stock
            let currentStock = null;
            if (batch.location?.warehouseId) {
              currentStock = await tx.inventoryStock.findUnique({
                where: {
                  materialId_warehouseId: {
                    materialId: batch.materialId,
                    warehouseId: batch.location.warehouseId,
                  },
                },
              });
            }

            if (!currentStock) {
              currentStock = await tx.inventoryStock.findFirst({
                where: { materialId: batch.materialId },
              });
            }

            if (currentStock) {
              await tx.inventoryStock.update({
                where: { id: currentStock.id },
                data: {
                  currentQuantity: { increment: sentQty },
                  availableQuantity: { increment: sentQty },
                },
              });
            }

            // Create Inventory Transaction (Audit Trail)
            await tx.inventoryTransaction.create({
              data: {
                projectId: targetProjectId,
                inventoryBatchId: batch.id,
                movementType: InventoryMovementType.MATERIAL_RETURN,
                quantity: sentQty,
                referenceDocType: 'SUBCONTRACT_CANCEL',
                referenceDocId: order.id,
                remarks: `Material returned to stores due to cancellation of Subcontract Challan ${order.challanNumber}`,
                createdBy: userId,
              },
            });
          }
        }
      }

      // Update status to CANCELLED
      const updatedOrder = await tx.subcontractOrder.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'SUBCONTRACT_ORDER_CANCELLED',
          description: `Subcontract Challan ${order.challanNumber} for ${order.vendor?.vendorName || 'Vendor'} was cancelled. Deducted store materials were restored.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return updatedOrder;
    });
  }

  async deleteOrder(projectId: string, orderId: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId, tx);
      const order = await tx.subcontractOrder.findFirst({
        where: {
          id: orderId,
          projectId: targetProjectId,
        },
        include: {
          items: {
            include: {
              inventoryBatch: {
                include: {
                  material: true,
                  location: true,
                },
              },
            },
          },
          subcontractReceipts: true,
          vendor: true,
        },
      });

      if (!order) {
        throw new NotFoundException(`Subcontract Order '${orderId}' not found.`);
      }

      if (order.subcontractReceipts && order.subcontractReceipts.length > 0) {
        throw new BadRequestException(
          'Cannot delete a subcontract order that already has processed return receipts.',
        );
      }

      if (order.status === 'CLOSED' || order.status === 'PARTIAL_RECEIPT') {
        throw new BadRequestException(
          'Cannot delete a subcontract order that has been partially or fully received.',
        );
      }

      // If the order was NOT already cancelled, restore the deducted stock before deleting
      if (order.status !== 'CANCELLED') {
        for (const item of order.items) {
          const sentQty = Number(item.sentQty || 0);
          if (item.inventoryBatchId && sentQty > 0) {
            const batch = item.inventoryBatch;
            if (batch) {
              await tx.inventoryBatch.update({
                where: { id: item.inventoryBatchId },
                data: {
                  currentQty: { increment: sentQty },
                  availableQty: { increment: sentQty },
                  issuedQty: { decrement: sentQty },
                  status: 'AVAILABLE',
                },
              });

              let currentStock = null;
              if (batch.location?.warehouseId) {
                currentStock = await tx.inventoryStock.findUnique({
                  where: {
                    materialId_warehouseId: {
                      materialId: batch.materialId,
                      warehouseId: batch.location.warehouseId,
                    },
                  },
                });
              }

              if (!currentStock) {
                currentStock = await tx.inventoryStock.findFirst({
                  where: { materialId: batch.materialId },
                });
              }

              if (currentStock) {
                await tx.inventoryStock.update({
                  where: { id: currentStock.id },
                  data: {
                    currentQuantity: { increment: sentQty },
                    availableQuantity: { increment: sentQty },
                  },
                });
              }

              await tx.inventoryTransaction.create({
                data: {
                  projectId: targetProjectId,
                  inventoryBatchId: batch.id,
                  movementType: InventoryMovementType.MATERIAL_RETURN,
                  quantity: sentQty,
                  referenceDocType: 'SUBCONTRACT_DELETE',
                  referenceDocId: order.id,
                  remarks: `Material returned to stores due to deletion of Subcontract Challan ${order.challanNumber}`,
                  createdBy: userId,
                },
              });
            }
          }
        }
      }

      // Delete line items first due to foreign key
      await tx.subcontractOrderItem.deleteMany({
        where: { subcontractOrderId: order.id },
      });

      await tx.subcontractOrder.delete({
        where: { id: order.id },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'SUBCONTRACT_ORDER_DELETED',
          description: `Subcontract Challan ${order.challanNumber} for ${order.vendor?.vendorName || 'Vendor'} was deleted.`,
          performedBy: userId || 'SYSTEM',
        },
      });

      return { success: true };
    });
  }

  async createReceipt(projectId: string, dto: CreateSubcontractReceiptDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId, tx);
      const order = await tx.subcontractOrder.findUnique({
        where: { id: dto.subcontractOrderId },
        include: { items: { include: { inventoryBatch: { include: { material: true, location: true } } } } },
      });

      if (!order) throw new NotFoundException('Subcontract Order not found');

      const receiptNumber = this.generateNumber('SR');
      let totalProcessCost = 0;

      const receiptItemsData = dto.items.map((item) => {
        const orderItem = order.items.find((i) => i.id === item.orderItemId);
        if (!orderItem) throw new BadRequestException(`Order item ${item.orderItemId} not found`);

        const hoursPerPc = Number(item.hoursPerPc) > 0 
          ? Number(item.hoursPerPc) 
          : (Number((orderItem as any).hoursPerPc) > 0 ? Number((orderItem as any).hoursPerPc) : 1);
        const actualRate = Number(item.actualRate) || 0;
        const actualProcessCost = item.acceptedQty * hoursPerPc * actualRate;
        totalProcessCost += actualProcessCost;

        const baseData: any = {
          orderItemId: item.orderItemId,
          receivedQty: item.receivedQty,
          acceptedQty: item.acceptedQty,
          rejectedQty: item.rejectedQty,
          hoursPerPc,
          actualRate,
          actualProcessCost,
          remarks: item.remarks,
        };

        // Only create a return batch when the source order item has a valid linked inventory batch
        if (orderItem.inventoryBatch?.materialId && item.acceptedQty > 0) {
          const addedCostPerPc = hoursPerPc * actualRate;
          baseData.inventoryBatches = {
            create: [
              {
                materialId: orderItem.inventoryBatch.materialId,
                grnItemId: orderItem.inventoryBatch.grnItemId || null,
                batchNumber: `${orderItem.inventoryBatch.batchNumber || 'B'}-S-${this.generateNumber('R').slice(-4)}`,
                heatNumber: orderItem.inventoryBatch.heatNumber,
                receivedQty: item.acceptedQty,
                currentQty: item.acceptedQty,
                availableQty: item.acceptedQty,
                unitCost: (Number(orderItem.inventoryBatch.unitCost) || 0) + addedCostPerPc,
                status: 'AVAILABLE',
              },
            ],
          };
        }

        return baseData;
      });

      const receipt = await tx.subcontractReceipt.create({
        data: {
          projectId: targetProjectId,
          subcontractOrderId: dto.subcontractOrderId,
          receiptNumber,
          documentNumber: dto.documentNumber,
          status: 'COMPLETED',
          remarks: dto.remarks,
          items: {
            create: receiptItemsData,
          },
        },
        include: {
          items: {
            include: {
              inventoryBatches: true,
            },
          },
        },
      });

      // Update Order Status based on cumulative fulfillment across all receipts
      const allReceiptItems = await tx.subcontractReceiptItem.findMany({
        where: { orderItem: { subcontractOrderId: dto.subcontractOrderId } },
        select: { orderItemId: true, acceptedQty: true, receivedQty: true },
      });

      const totalReceivedByOrderItem = new Map<string, number>();
      for (const ri of allReceiptItems) {
        totalReceivedByOrderItem.set(
          ri.orderItemId,
          (totalReceivedByOrderItem.get(ri.orderItemId) || 0) + Number(ri.receivedQty || ri.acceptedQty || 0)
        );
      }

      const allFulfilled = order.items.every((oi: any) => {
        const received = totalReceivedByOrderItem.get(oi.id) || 0;
        return received >= Number(oi.sentQty);
      });

      const anyReceived = order.items.some((oi: any) => {
        const received = totalReceivedByOrderItem.get(oi.id) || 0;
        return received > 0;
      });

      const orderStatus = allFulfilled ? 'CLOSED' : anyReceived ? 'PARTIAL_RECEIPT' : 'ISSUED';

      await tx.subcontractOrder.update({
        where: { id: dto.subcontractOrderId },
        data: { status: orderStatus },
      });

      // Synchronize inventoryStock ledger for inward return batches
      const defaultWh = await tx.warehouse.findFirst({ where: { status: 'ACTIVE' } }) || await tx.warehouse.findFirst();
      for (const item of dto.items) {
        const orderItem = order.items.find((i: any) => i.id === item.orderItemId);
        if (orderItem?.inventoryBatch?.materialId && item.acceptedQty > 0) {
          const targetWhId = orderItem.inventoryBatch.location?.warehouseId || defaultWh?.id;
          if (targetWhId) {
            await tx.inventoryStock.upsert({
              where: {
                materialId_warehouseId: {
                  materialId: orderItem.inventoryBatch.materialId,
                  warehouseId: targetWhId,
                }
              },
              create: {
                materialId: orderItem.inventoryBatch.materialId,
                warehouseId: targetWhId,
                currentQuantity: item.acceptedQty,
                availableQuantity: item.acceptedQty,
              },
              update: {
                currentQuantity: { increment: item.acceptedQty },
                availableQuantity: { increment: item.acceptedQty },
              }
            });
          }
        }
      }

      // Record Inventory Transactions for returned batches (End-to-End Traceability)
      for (const rItem of receipt.items) {
        if (rItem.inventoryBatches && rItem.inventoryBatches.length > 0) {
          for (const retBatch of rItem.inventoryBatches) {
            await tx.inventoryTransaction.create({
              data: {
                projectId: targetProjectId,
                inventoryBatchId: retBatch.id,
                movementType: InventoryMovementType.MATERIAL_RETURN,
                quantity: retBatch.receivedQty,
                referenceDocType: 'SUBCONTRACT_RECEIPT',
                referenceDocId: receipt.id,
                remarks: `Material returned from subcontracting under Receipt ${receiptNumber} (Challan: ${order.challanNumber})`,
                createdBy: userId,
              },
            });
          }
        }
      }

      // Log reject activity if any items had rejects
      for (const item of dto.items) {
        if (Number(item.rejectedQty) > 0) {
          await tx.projectActivity.create({
            data: {
              projectId: targetProjectId,
              action: 'SUBCONTRACT_REJECT',
              description: `Receipt ${receiptNumber}: ${item.rejectedQty} pcs rejected for order item ${item.orderItemId}.`,
              performedBy: userId || 'SYSTEM',
            },
          });
        }
      }

      // Costing Event
      await tx.projectCostEvent.create({
        data: {
          projectId: targetProjectId,
          costType: 'OUTSIDE_PROCESS',
          description: `Subcontract Receipt ${receiptNumber}`,
          amount: totalProcessCost,
          referenceDocType: 'SUBCONTRACT_RECEIPT',
          referenceDocId: receipt.id,
        },
      });

      // Update Cost Summary
      const costSummary = await tx.projectCostSummary.findUnique({ where: { projectId: targetProjectId } });
      if (costSummary) {
        const newCost = Number(costSummary.outsideProcessCost) + totalProcessCost;
        const newTotal = Number(costSummary.totalCost) + totalProcessCost;
        const newProfit = Number(costSummary.revenue) - newTotal;
        await tx.projectCostSummary.update({
          where: { projectId: targetProjectId },
          data: {
            outsideProcessCost: newCost,
            totalCost: newTotal,
            profitability: newProfit,
          },
        });
      }

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'SUBCONTRACT_RECEIPT',
          description: `Receipt ${receiptNumber} processed. Cost: ₹${totalProcessCost}`,
        },
      });

      return receipt;
    });
  }

  async getReceipts(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.subcontractReceipt.findMany({
      where: { projectId: targetProjectId },
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                operation: true,
              },
            },
            inventoryBatches: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
