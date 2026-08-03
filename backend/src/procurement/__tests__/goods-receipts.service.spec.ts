import { Test, TestingModule } from '@nestjs/testing';
import { GoodsReceiptsService } from '../goods-receipts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('GoodsReceiptsService - Partial GRN Workflow', () => {
  let service: GoodsReceiptsService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    project: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    warehouse: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
    },
    purchaseOrderHeader: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    purchaseOrderItem: {
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    goodsReceiptHeader: {
      create: jest.fn(),
    },
    goodsReceiptItem: {
      create: jest.fn(),
    },
    inventoryStock: {
      upsert: jest.fn(),
    },
    inventoryBatch: {
      create: jest.fn(),
    },
    inventoryTransaction: {
      create: jest.fn(),
    },
    projectCostSummary: {
      upsert: jest.fn(),
    },
    projectCostEvent: {
      create: jest.fn(),
    },
    projectActivity: {
      create: jest.fn(),
    },
    projectTimeline: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodsReceiptsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GoodsReceiptsService>(GoodsReceiptsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGrn - Partial GRN Scenarios', () => {
    const projectId = 'proj-123';
    const poHeaderId = 'po-101';
    const warehouseId = 'wh-001';

    const baseDto = {
      poHeaderId,
      grnNumber: 'GRN-1001',
      supplierChallan: 'CHALLAN-01',
      warehouseId,
      remarks: 'Partial receipt test',
      items: [
        {
          poItemId: 'po-item-1',
          acceptedQty: 30,
          rejectedQty: 0,
          receivedQty: 30,
          heatNumber: 'HEAT-999',
          actualRate: 100,
        },
      ],
    };

    const setupMocksForTransaction = () => {
      mockPrismaService.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrismaService);
      });
      mockPrismaService.project.findUniqueOrThrow.mockResolvedValue({ id: projectId });
      mockPrismaService.warehouse.findUnique.mockResolvedValue({ id: warehouseId, warehouseCode: 'WH-001' });
      mockPrismaService.warehouse.findUniqueOrThrow.mockResolvedValue({ id: warehouseId, warehouseCode: 'WH-001' });
      mockPrismaService.warehouse.findFirst.mockResolvedValue({ id: warehouseId, warehouseCode: 'WH-001' });
      mockPrismaService.goodsReceiptHeader.create.mockResolvedValue({ id: 'grn-hdr-1', grnNumber: 'GRN-1001' });
      mockPrismaService.goodsReceiptItem.create.mockResolvedValue({ id: 'grn-itm-1' });
      mockPrismaService.inventoryBatch.create.mockResolvedValue({ id: 'batch-1' });
    };

    it('Scenario 1: Partial GRN 1 (PO Qty = 100, receive 30 -> pending = 70, status = PARTIAL_RECEIPT)', async () => {
      setupMocksForTransaction();

      mockPrismaService.purchaseOrderHeader.findUnique.mockResolvedValue({
        id: poHeaderId,
        status: 'ISSUED',
        items: [{ id: 'po-item-1', orderedQty: 100, receivedQty: 0 }],
      });

      mockPrismaService.purchaseOrderItem.findUniqueOrThrow.mockResolvedValue({
        id: 'po-item-1',
        materialId: 'mat-1',
        orderedQty: 100,
        receivedQty: 0,
      });

      mockPrismaService.purchaseOrderItem.findMany.mockResolvedValue([
        { id: 'po-item-1', orderedQty: 100, receivedQty: 30 },
      ]);

      await service.createGrn(projectId, baseDto, 'user-1');

      // Verify PO Header status was updated to PARTIAL_RECEIPT
      expect(mockPrismaService.purchaseOrderHeader.update).toHaveBeenCalledWith({
        where: { id: poHeaderId },
        data: { status: 'PARTIAL_RECEIPT' },
      });

      // Verify PO Item receivedQty incremented by 30
      expect(mockPrismaService.purchaseOrderItem.update).toHaveBeenCalledWith({
        where: { id: 'po-item-1' },
        data: {
          receivedQty: { increment: 30 },
          status: 'PARTIAL',
        },
      });
    });

    it('Scenario 2: Partial GRN 2 (Second GRN for 40 -> pending = 30, status = PARTIAL_RECEIPT)', async () => {
      setupMocksForTransaction();

      mockPrismaService.purchaseOrderHeader.findUnique.mockResolvedValue({
        id: poHeaderId,
        status: 'PARTIAL_RECEIPT',
        items: [{ id: 'po-item-1', orderedQty: 100, receivedQty: 30 }],
      });

      mockPrismaService.purchaseOrderItem.findUniqueOrThrow.mockResolvedValue({
        id: 'po-item-1',
        materialId: 'mat-1',
        orderedQty: 100,
        receivedQty: 30,
      });

      mockPrismaService.purchaseOrderItem.findMany.mockResolvedValue([
        { id: 'po-item-1', orderedQty: 100, receivedQty: 70 },
      ]);

      const dtoGrn2 = {
        ...baseDto,
        grnNumber: 'GRN-1002',
        items: [{ ...baseDto.items[0], acceptedQty: 40, receivedQty: 40 }],
      };

      await service.createGrn(projectId, dtoGrn2, 'user-1');

      expect(mockPrismaService.purchaseOrderHeader.update).toHaveBeenCalledWith({
        where: { id: poHeaderId },
        data: { status: 'PARTIAL_RECEIPT' },
      });
    });

    it('Scenario 3: Final GRN 3 (Receive remaining 30 -> pending = 0, status = CLOSED)', async () => {
      setupMocksForTransaction();

      mockPrismaService.purchaseOrderHeader.findUnique.mockResolvedValue({
        id: poHeaderId,
        status: 'PARTIAL_RECEIPT',
        items: [{ id: 'po-item-1', orderedQty: 100, receivedQty: 70 }],
      });

      mockPrismaService.purchaseOrderItem.findUniqueOrThrow.mockResolvedValue({
        id: 'po-item-1',
        materialId: 'mat-1',
        orderedQty: 100,
        receivedQty: 70,
      });

      mockPrismaService.purchaseOrderItem.findMany.mockResolvedValue([
        { id: 'po-item-1', orderedQty: 100, receivedQty: 100 },
      ]);

      const dtoGrn3 = {
        ...baseDto,
        grnNumber: 'GRN-1003',
        items: [{ ...baseDto.items[0], acceptedQty: 30, receivedQty: 30 }],
      };

      await service.createGrn(projectId, dtoGrn3, 'user-1');

      // Verify PO Header status transitioned to CLOSED (Fully Received)
      expect(mockPrismaService.purchaseOrderHeader.update).toHaveBeenCalledWith({
        where: { id: poHeaderId },
        data: { status: 'CLOSED' },
      });

      // Verify PO Item status became FULFILLED
      expect(mockPrismaService.purchaseOrderItem.update).toHaveBeenCalledWith({
        where: { id: 'po-item-1' },
        data: {
          receivedQty: { increment: 30 },
          status: 'FULFILLED',
        },
      });
    });

    it('Scenario 4: Attempt GRN when PO is already Fully Received (pending = 0 -> error)', async () => {
      setupMocksForTransaction();

      mockPrismaService.purchaseOrderHeader.findUnique.mockResolvedValue({
        id: poHeaderId,
        status: 'CLOSED',
        items: [{ id: 'po-item-1', orderedQty: 100, receivedQty: 100 }],
      });

      await expect(service.createGrn(projectId, baseDto, 'user-1')).rejects.toThrow(
        new BadRequestException('All quantities have already been received.')
      );
    });

    it('Scenario 5: Attempt GRN exceeding pending quantity (pending = 20, enter 25 -> validation error)', async () => {
      setupMocksForTransaction();

      mockPrismaService.purchaseOrderHeader.findUnique.mockResolvedValue({
        id: poHeaderId,
        status: 'PARTIAL_RECEIPT',
        items: [{ id: 'po-item-1', orderedQty: 100, receivedQty: 80 }],
      });

      mockPrismaService.purchaseOrderItem.findUniqueOrThrow.mockResolvedValue({
        id: 'po-item-1',
        materialId: 'mat-1',
        orderedQty: 100,
        receivedQty: 80,
      });

      const dtoOverQty = {
        ...baseDto,
        items: [{ ...baseDto.items[0], acceptedQty: 25, receivedQty: 25 }],
      };

      await expect(service.createGrn(projectId, dtoOverQty, 'user-1')).rejects.toThrow(
        new BadRequestException('Receive quantity cannot exceed pending quantity.')
      );
    });
  });
});
