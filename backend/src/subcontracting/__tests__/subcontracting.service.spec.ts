import { Test, TestingModule } from '@nestjs/testing';
import { SubcontractingService } from '../subcontracting.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SubcontractingService - Inward Receipt (BUG-009 Regression)', () => {
  let service: SubcontractingService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    project: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subcontractOrder: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subcontractReceipt: {
      create: jest.fn(),
    },
    subcontractReceiptItem: {
      findMany: jest.fn(),
    },
    inventoryStock: {
      upsert: jest.fn(),
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

  it('should mark subcontract order as PARTIAL_RECEIPT when partially delivered and sync inventoryStock', async () => {
    const projectId = 'proj-123';
    const orderId = 'sc-order-1';
    const warehouseId = 'wh-001';

    mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));
    mockPrismaService.project.findFirst.mockResolvedValue({ id: projectId });
    mockPrismaService.warehouse.findFirst.mockResolvedValue({ id: warehouseId, status: 'ACTIVE' });

    mockPrismaService.subcontractOrder.findUnique.mockResolvedValue({
      id: orderId,
      items: [
        {
          id: 'sc-item-1',
          sentQty: 50,
          inventoryBatch: {
            materialId: 'mat-steel-1',
            batchNumber: 'BAT-101',
            heatNumber: 'HEAT-1',
            unitCost: 100,
          },
        },
      ],
    });

    mockPrismaService.subcontractReceipt.create.mockResolvedValue({
      id: 'sr-receipt-1',
      receiptNumber: 'SR-1001',
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

    await service.createReceipt(projectId, dto);

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
