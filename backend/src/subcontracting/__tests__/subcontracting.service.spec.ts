import { Test, TestingModule } from '@nestjs/testing';
import { SubcontractingService } from '../subcontracting.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { InventoryMovementType } from '@prisma/client';

describe('SubcontractingService', () => {
  let service: SubcontractingService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    project: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vendor: {
      findUnique: jest.fn(),
    },
    inventoryBatch: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    inventoryStock: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    inventoryTransaction: {
      create: jest.fn(),
    },
    projectTimeline: {
      create: jest.fn(),
    },
    subcontractOrder: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    subcontractReceipt: {
      create: jest.fn(),
    },
    subcontractReceiptItem: {
      findMany: jest.fn(),
    },
    warehouse: {
      findFirst: jest.fn(),
    },
    projectCostEvent: {
      create: jest.fn(),
    },
    projectCostSummary: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    projectActivity: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubcontractingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SubcontractingService>(SubcontractingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder with Material Issue', () => {
    it('should deduct batch and stock, and record inventory transaction when material is issued to vendor', async () => {
      const projectId = 'proj-123';
      const vendorId = 'vendor-456';
      const batchId = 'batch-789';
      const warehouseId = 'wh-001';

      mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));
      mockPrismaService.project.findFirst.mockResolvedValue({ id: projectId });
      mockPrismaService.project.findUnique.mockResolvedValue({ id: projectId, currentStage: 'PRODUCTION' });
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: vendorId, vendorName: 'Super Heat Treatment' });

      mockPrismaService.subcontractOrder.create.mockResolvedValue({
        id: 'sc-order-1',
        challanNumber: 'SC-1001',
        projectId,
        vendorId,
        totalEstimatedCost: 1500,
        status: 'ISSUED',
        items: [],
      });

      mockPrismaService.inventoryBatch.findUnique.mockResolvedValue({
        id: batchId,
        batchNumber: 'BAT-D2-001',
        materialId: 'mat-d2',
        availableQty: 25,
        currentQty: 25,
        material: { materialGrade: 'D2 Tool Steel' },
        location: { warehouseId },
      });

      mockPrismaService.inventoryBatch.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.inventoryStock.findUnique.mockResolvedValue({
        id: 'stock-1',
        materialId: 'mat-d2',
        warehouseId,
        availableQuantity: 25,
      });
      mockPrismaService.inventoryStock.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.inventoryTransaction.create.mockResolvedValue({ id: 'tx-1' });

      const dto = {
        vendorId,
        documentNumber: 'CHL-001',
        items: [
          {
            operationId: 'op-heat-treat',
            sentQty: 10,
            rate: 150,
            inventoryBatchId: batchId,
          },
        ],
      };

      const result = await service.createOrder(projectId, dto, 'user-1');

      expect(result).toBeDefined();
      // Verified batch decrement
      expect(mockPrismaService.inventoryBatch.updateMany).toHaveBeenCalledWith({
        where: { id: batchId, availableQty: { gte: 10 } },
        data: {
          currentQty: { decrement: 10 },
          availableQty: { decrement: 10 },
          issuedQty: { increment: 10 },
          status: 'AVAILABLE',
        },
      });

      // Verified stock decrement
      expect(mockPrismaService.inventoryStock.updateMany).toHaveBeenCalledWith({
        where: { id: 'stock-1', availableQuantity: { gte: 10 } },
        data: {
          currentQuantity: { decrement: 10 },
          availableQuantity: { decrement: 10 },
        },
      });

      // Verified inventory transaction created for outward issue
      expect(mockPrismaService.inventoryTransaction.create).toHaveBeenCalledWith({
        data: {
          projectId,
          inventoryBatchId: batchId,
          movementType: InventoryMovementType.MATERIAL_ISSUE,
          quantity: 10,
          referenceDocType: 'SUBCONTRACT_CHALLAN',
          referenceDocId: 'sc-order-1',
          remarks: expect.stringContaining('Material issued to Subcontractor Super Heat Treatment'),
          createdBy: 'user-1',
        },
      });
    });

    it('should throw BadRequestException if requested material quantity exceeds available batch stock', async () => {
      const projectId = 'proj-123';
      const vendorId = 'vendor-456';
      const batchId = 'batch-789';

      mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));
      mockPrismaService.project.findFirst.mockResolvedValue({ id: projectId });
      mockPrismaService.project.findUnique.mockResolvedValue({ id: projectId, currentStage: 'PRODUCTION' });
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: vendorId, vendorName: 'Super Heat Treatment' });

      mockPrismaService.subcontractOrder.create.mockResolvedValue({
        id: 'sc-order-1',
        challanNumber: 'SC-1001',
      });

      mockPrismaService.inventoryBatch.findUnique.mockResolvedValue({
        id: batchId,
        batchNumber: 'BAT-D2-001',
        materialId: 'mat-d2',
        availableQty: 5,
        currentQty: 5,
        material: { materialGrade: 'D2 Tool Steel' },
      });

      const dto = {
        vendorId,
        items: [
          {
            operationId: 'op-heat-treat',
            sentQty: 20, // Requesting 20 when only 5 available
            rate: 150,
            inventoryBatchId: batchId,
          },
        ],
      };

      await expect(service.createOrder(projectId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should calculate totalEstimatedCost using sentQty * hoursPerPc * ratePerHour', async () => {
      const projectId = 'proj-123';
      const vendorId = 'vendor-456';

      mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));
      mockPrismaService.project.findFirst.mockResolvedValue({ id: projectId });
      mockPrismaService.project.findUnique.mockResolvedValue({ id: projectId, currentStage: 'PRODUCTION' });
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: vendorId, vendorName: 'Precision CNC Works' });

      let capturedData: any = null;
      mockPrismaService.subcontractOrder.create.mockImplementation(async ({ data }: any) => {
        capturedData = data;
        return {
          id: 'sc-order-hours',
          challanNumber: 'SC-1003',
          ...data,
        };
      });

      const dto = {
        vendorId,
        items: [
          {
            operationId: 'op-cnc-milling',
            sentQty: 4,
            hoursPerPc: 2.5, // 4 * 2.5 = 10 total hours
            rate: 500, // 10 * 500 = 5000
          },
        ],
      };

      const result = await service.createOrder(projectId, dto as any);
      expect(result).toBeDefined();
      expect(capturedData.totalEstimatedCost).toBe(5000);
      expect(capturedData.items.create[0].hoursPerPc).toBe(2.5);
      expect(capturedData.items.create[0].rate).toBe(500);
      expect(capturedData.items.create[0].lineEstimatedCost).toBe(5000);
    });

    it('should create order without modifying inventory when service only (no inventoryBatchId)', async () => {
      const projectId = 'proj-123';
      const vendorId = 'vendor-456';

      mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));
      mockPrismaService.project.findFirst.mockResolvedValue({ id: projectId });
      mockPrismaService.project.findUnique.mockResolvedValue({ id: projectId, currentStage: 'PRODUCTION' });
      mockPrismaService.vendor.findUnique.mockResolvedValue({ id: vendorId, vendorName: 'Calibration Lab' });

      mockPrismaService.subcontractOrder.create.mockResolvedValue({
        id: 'sc-order-2',
        challanNumber: 'SC-1002',
      });

      const dto = {
        vendorId,
        items: [
          {
            operationId: 'op-calibration',
            sentQty: 1,
            rate: 500,
            // No inventoryBatchId
          },
        ],
      };

      const result = await service.createOrder(projectId, dto);
      expect(result).toBeDefined();
      expect(mockPrismaService.inventoryBatch.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaService.inventoryStock.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaService.inventoryTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe('createReceipt - Inward Receipt and Material Return', () => {
    it('should mark subcontract order as PARTIAL_RECEIPT when partially delivered and sync inventoryStock and transactions', async () => {
      const projectId = 'proj-123';
      const orderId = 'sc-order-1';
      const warehouseId = 'wh-001';

      mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));
      mockPrismaService.project.findFirst.mockResolvedValue({ id: projectId });
      mockPrismaService.warehouse.findFirst.mockResolvedValue({ id: warehouseId, status: 'ACTIVE' });

      mockPrismaService.subcontractOrder.findUnique.mockResolvedValue({
        id: orderId,
        challanNumber: 'SC-1001',
        items: [
          {
            id: 'sc-item-1',
            sentQty: 50,
            inventoryBatch: {
              materialId: 'mat-steel-1',
              batchNumber: 'BAT-101',
              heatNumber: 'HEAT-1',
              unitCost: 100,
              location: { warehouseId },
            },
          },
        ],
      });

      mockPrismaService.subcontractReceipt.create.mockResolvedValue({
        id: 'sr-receipt-1',
        receiptNumber: 'SR-1001',
        items: [
          {
            id: 'sri-1',
            inventoryBatches: [
              {
                id: 'new-ret-batch-1',
                receivedQty: 20,
              },
            ],
          },
        ],
      });

      // Currently only 20 received out of 50
      mockPrismaService.subcontractReceiptItem.findMany.mockResolvedValue([
        { orderItemId: 'sc-item-1', receivedQty: 20, acceptedQty: 20 },
      ]);

      const dto = {
        subcontractOrderId: orderId,
        items: [
          {
            orderItemId: 'sc-item-1',
            receivedQty: 20,
            acceptedQty: 20,
            rejectedQty: 0,
            actualRate: 25,
          },
        ],
      };

      await service.createReceipt(projectId, dto, 'user-1');

      // Verify order status is PARTIAL_RECEIPT (NOT CLOSED)
      expect(mockPrismaService.subcontractOrder.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: 'PARTIAL_RECEIPT' },
      });

      // Verify inventoryStock was upserted for the 20 returned units
      expect(mockPrismaService.inventoryStock.upsert).toHaveBeenCalledWith({
        where: {
          materialId_warehouseId: {
            materialId: 'mat-steel-1',
            warehouseId,
          },
        },
        create: {
          materialId: 'mat-steel-1',
          warehouseId,
          currentQuantity: 20,
          availableQuantity: 20,
        },
        update: {
          currentQuantity: { increment: 20 },
          availableQuantity: { increment: 20 },
        },
      });

      // Verify inventoryTransaction created for returned material
      expect(mockPrismaService.inventoryTransaction.create).toHaveBeenCalledWith({
        data: {
          projectId,
          inventoryBatchId: 'new-ret-batch-1',
          movementType: InventoryMovementType.MATERIAL_RETURN,
          quantity: 20,
          referenceDocType: 'SUBCONTRACT_RECEIPT',
          referenceDocId: 'sr-receipt-1',
          remarks: expect.stringContaining('Material returned from subcontracting under Receipt'),
          createdBy: 'user-1',
        },
      });
    });

    it('should mark subcontract order as CLOSED when fully delivered', async () => {
      const projectId = 'proj-123';
      const orderId = 'sc-order-1';
      const warehouseId = 'wh-001';

      mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));
      mockPrismaService.project.findFirst.mockResolvedValue({ id: projectId });
      mockPrismaService.warehouse.findFirst.mockResolvedValue({ id: warehouseId, status: 'ACTIVE' });

      mockPrismaService.subcontractOrder.findUnique.mockResolvedValue({
        id: orderId,
        challanNumber: 'SC-1001',
        items: [
          {
            id: 'sc-item-1',
            sentQty: 50,
            inventoryBatch: {
              materialId: 'mat-steel-1',
              unitCost: 100,
            },
          },
        ],
      });

      mockPrismaService.subcontractReceipt.create.mockResolvedValue({
        id: 'sr-receipt-2',
        receiptNumber: 'SR-1002',
        items: [],
      });

      // All 50 received
      mockPrismaService.subcontractReceiptItem.findMany.mockResolvedValue([
        { orderItemId: 'sc-item-1', receivedQty: 50, acceptedQty: 50 },
      ]);

      const dto = {
        subcontractOrderId: orderId,
        items: [
          {
            orderItemId: 'sc-item-1',
            receivedQty: 50,
            acceptedQty: 50,
            rejectedQty: 0,
            actualRate: 25,
          },
        ],
      };

      await service.createReceipt(projectId, dto);

      // Verify order status is CLOSED
      expect(mockPrismaService.subcontractOrder.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: 'CLOSED' },
      });
    });
  });
});
