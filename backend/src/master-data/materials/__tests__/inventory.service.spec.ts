import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../inventory.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('InventoryService - Manual Batch Creation (BUG-008 Regression)', () => {
  let service: InventoryService;

  const mockPrismaService = {
    inventoryBatch: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    inventoryTransaction: {
      create: jest.fn(),
    },
    inventoryStock: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    storageLocation: {
      findUnique: jest.fn(),
    },
    warehouse: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create manual batch and update inventoryStock ledger', async () => {
    const materialId = 'mat-steel-101';
    const warehouseId = 'wh-main-01';

    mockPrismaService.warehouse.findFirst.mockResolvedValue({ id: warehouseId, status: 'ACTIVE' });
    mockPrismaService.inventoryBatch.create.mockResolvedValue({
      id: 'batch-manual-1',
      materialId,
      currentQty: 150,
      availableQty: 150,
    });

    const result = await service.createManualBatch({
      materialId,
      currentQty: 150,
      unitCost: 85,
    });

    expect(result.id).toBe('batch-manual-1');

    // Verify inventoryStock was upserted with the new quantity
    expect(mockPrismaService.inventoryStock.upsert).toHaveBeenCalledWith({
      where: {
        materialId_warehouseId: {
          materialId,
          warehouseId,
        },
      },
      create: {
        materialId,
        warehouseId,
        currentQuantity: 150,
        availableQuantity: 150,
      },
      update: {
        currentQuantity: { increment: 150 },
        availableQuantity: { increment: 150 },
      },
    });

    // Verify inventory transaction was logged
    expect(mockPrismaService.inventoryTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        inventoryBatchId: 'batch-manual-1',
        quantity: 150,
        remarks: 'Manual Stock Intake',
      }),
    });
  });
});
