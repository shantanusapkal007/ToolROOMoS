import { Test, TestingModule } from '@nestjs/testing';
import { BomsService } from './boms.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BomsService', () => {
  let service: BomsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(async (cb) => {
      // Mock transaction client is just the prisma service itself for simplicity
      return await cb(mockPrismaService);
    }),
    project: {
      findUniqueOrThrow: jest.fn(),
    },
    projectCostSummary: {
      update: jest.fn(),
    },
    projectCostEvent: {
      create: jest.fn(),
    },
    projectActivity: {
      create: jest.fn(),
    },
    billOfMaterialHeader: {
      findUnique: jest.fn(),
      findFirstOrThrow: jest.fn(),
      update: jest.fn(),
    },
    billOfMaterialItem: {
      findMany: jest.fn(),
    },
    purchaseOrderHeader: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    purchaseOrderItem: {
      create: jest.fn(),
    },
    material: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    vendor: {
      findFirst: jest.fn(),
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BomsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BomsService>(BomsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should generate POs with dimensions, hsnCode, and gstPercent when BOM is approved', async () => {
    // Arrange
    const mockBomId = 'bom-123';
    
    mockPrismaService.project.findUniqueOrThrow.mockResolvedValue({
      id: 'proj-1',
      plantId: 'plant-1'
    });

    // Mock the BOM header and items (because it uses findFirstOrThrow with include: { items: { include: { material: true } } })
    mockPrismaService.billOfMaterialHeader.findFirstOrThrow.mockResolvedValue({
      id: mockBomId,
      projectId: 'proj-1',
      approvalStatus: 'DRAFT',
      items: [
        {
          id: 'item-1',
          materialId: 'mat-1',
          dimensions: '10x20x30',
          hsnCode: 'HSN-1234',
          customFields: { gstPercent: 18 },
          sourceType: 'PURCHASE',
          requiredQty: 5,
          estimatedCost: 100,
          bomHeaderId: mockBomId,
          qtyToOrder: 5,
          calculatedRate: 20,
          finalCost: 100,
          material: {
            id: 'mat-1',
            materialName: 'Test Steel',
            defaultVendorId: 'vendor-1',
          }
        }
      ]
    });

    mockPrismaService.billOfMaterialHeader.update.mockResolvedValue({
      id: mockBomId,
      approvalStatus: 'APPROVED',
    });

    mockPrismaService.material.findMany.mockResolvedValue([
      { id: 'mat-1', materialName: 'Test Steel', defaultVendorId: 'vendor-1' }
    ]);

    mockPrismaService.purchaseOrderHeader.findMany.mockResolvedValue([]);

    mockPrismaService.vendor.findFirst.mockResolvedValue({
      id: 'vendor-1',
      vendorName: 'Test Vendor'
    });

    // Mock PO creation to return a PO id
    mockPrismaService.purchaseOrderHeader.create.mockResolvedValue({
      id: 'po-123',
    });

    // Act
    await service.approveBom('proj-1', mockBomId, 'test-user-id');

    // Assert
    // Check if PO items were created with correct mapping
    expect(mockPrismaService.purchaseOrderItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        dimensions: '10x20x30',
        hsnCode: 'HSN-1234',
        gstPercent: 18,
      })
    });
  });
});
