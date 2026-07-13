import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersService } from '../purchase-orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SequenceEngine } from '../../common/sequence.engine';

const mockPrismaService = {
  $transaction: jest.fn(),
  project: {
    findUniqueOrThrow: jest.fn(),
  },
  vendor: {
    findFirst: jest.fn(),
  },
  purchaseOrderHeader: {
    create: jest.fn(),
  },
  purchaseOrderItem: {
    create: jest.fn(),
  },
  projectActivity: {
    create: jest.fn(),
  }
};

const mockSequenceEngine = {
  generateNextNumber: jest.fn(),
};

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SequenceEngine,
          useValue: mockSequenceEngine,
        }
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPo', () => {
    it('should generate a PO with auto-selected vendor and map BOM fields', async () => {
      mockPrismaService.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrismaService);
      });

      mockPrismaService.project.findUniqueOrThrow.mockResolvedValue({ id: 'proj-1', projectStatus: 'PROCUREMENT' });
      mockPrismaService.vendor.findFirst.mockResolvedValue({ id: 'vendor-1' });
      mockSequenceEngine.generateNextNumber.mockResolvedValue('PO-1001');
      mockPrismaService.purchaseOrderHeader.create.mockResolvedValue({ id: 'po-1', poNumber: 'PO-1001' });

      const dto = {
        poNumber: '',
        vendorId: '', // Test auto-vendor logic
        orderDate: '2023-10-01',
        items: [
          {
            materialId: 'mat-1',
            qty: 10,
            unitRate: 50,
            dimensions: '10x10',
            hsnCode: '1234',
            gstPercent: 18,
            bomItemId: 'bom-item-1'
          }
        ]
      };

      const result = await service.createPo('proj-1', dto);

      expect(mockPrismaService.vendor.findFirst).toHaveBeenCalled();
      expect(mockSequenceEngine.generateNextNumber).toHaveBeenCalledWith('PO');
      expect(mockPrismaService.purchaseOrderHeader.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            vendorId: 'vendor-1',
            poNumber: 'PO-1001',
          })
        })
      );
      expect(mockPrismaService.purchaseOrderItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dimensions: '10x10',
            hsnCode: '1234',
            gstPercent: 18,
          })
        })
      );
    });
  });
});
