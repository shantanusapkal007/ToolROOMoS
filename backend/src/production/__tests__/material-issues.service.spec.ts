import { Test, TestingModule } from '@nestjs/testing';
import { MaterialIssuesService } from '../material-issues.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WipService } from '../wip.service';

const mockPrismaService = {
  $transaction: jest.fn(),
  project: {
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  inventoryBatch: {
    findUniqueOrThrow: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
  },
  materialIssueHeader: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  materialIssueItem: {
    create: jest.fn(),
  },
  warehouse: {
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
  },
  inventoryStock: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  inventoryTransaction: {
    create: jest.fn(),
  },
  projectCostSummary: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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

const mockWipService = {
  initializeWipEntry: jest.fn(),
};

describe('MaterialIssuesService', () => {
  let service: MaterialIssuesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialIssuesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WipService,
          useValue: mockWipService,
        },
      ],
    }).compile();

    service = module.get<MaterialIssuesService>(MaterialIssuesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueMaterial (partial issuing)', () => {
    it('should assign status PARTIAL and calculate remaining batch quantity when issuing less than available stock', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrismaService);
      });

      mockPrismaService.project.findUniqueOrThrow.mockResolvedValue({
        id: 'proj-1',
        currentStage: 'PRODUCTION',
      });
      mockPrismaService.project.findFirst.mockResolvedValue({
        id: 'proj-1',
        currentStage: 'PRODUCTION',
      });

      mockPrismaService.inventoryBatch.findUniqueOrThrow.mockResolvedValue({
        id: 'batch-1',
        batchNumber: 'BATCH-001',
        materialId: 'mat-1',
        unitCost: { toNumber: () => 100 },
        availableQty: { toNumber: () => 50 },
      });

      mockPrismaService.materialIssueHeader.create.mockResolvedValue({
        id: 'header-1',
        issueNumber: 'ISS-1001',
        status: 'PARTIAL',
        isPartial: true,
      });

      mockPrismaService.materialIssueItem.create.mockResolvedValue({ id: 'item-1' });
      mockPrismaService.inventoryBatch.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.inventoryStock.findFirst.mockResolvedValue({
        materialId: 'mat-1',
        warehouseId: 'wh-1',
        availableQuantity: { toNumber: () => 100 },
      });
      mockPrismaService.inventoryStock.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.inventoryTransaction.create.mockResolvedValue({});
      mockPrismaService.projectCostSummary.upsert.mockResolvedValue({});
      mockPrismaService.projectCostEvent.create.mockResolvedValue({});
      mockPrismaService.projectActivity.create.mockResolvedValue({});
      mockPrismaService.materialIssueHeader.findUnique.mockResolvedValue({
        id: 'header-1',
        issueNumber: 'ISS-1001',
        status: 'PARTIAL',
        isPartial: true,
        productionSection: 'MACHINE_SHOP',
        items: [
          {
            issuedQty: 20,
            remainingBatchQty: 30,
            isPartial: true,
          },
        ],
      });

      const dto = {
        issueNumber: 'ISS-1001',
        productionSection: 'MACHINE_SHOP',
        items: [
          {
            inventoryBatchId: 'batch-1',
            issuedQty: 20,
            remarks: 'Partial batch issue',
          },
        ],
      };

      const result = await service.issueMaterial('proj-1', dto);

      expect(mockPrismaService.materialIssueHeader.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PARTIAL',
            isPartial: true,
            productionSection: 'MACHINE_SHOP',
          }),
        }),
      );

      expect(mockPrismaService.materialIssueItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            issuedQty: 20,
            remainingBatchQty: 30,
            isPartial: true,
          }),
        }),
      );

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result!.status).toBe('PARTIAL');
    });
  });
});
