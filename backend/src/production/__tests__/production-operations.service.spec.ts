import { Test, TestingModule } from '@nestjs/testing';
import { ProductionOperationsService } from '../production-operations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WipService } from '../wip.service';

const mockPrismaService = {
  $transaction: jest.fn(),
  machine: {
    findUniqueOrThrow: jest.fn(),
  },
  employee: {
    findUniqueOrThrow: jest.fn(),
  },
  projectCostSummary: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  msdrHeader: {
    create: jest.fn(),
  },
  operation: {
    findFirst: jest.fn(),
  },
  msdrOperation: {
    create: jest.fn(),
  },
  projectCostEvent: {
    create: jest.fn(),
  },
  projectActivity: {
    create: jest.fn(),
  }
};

const mockWipService = {
  calculateWipValue: jest.fn(),
};

describe('ProductionOperationsService', () => {
  let service: ProductionOperationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionOperationsService,
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

    service = module.get<ProductionOperationsService>(ProductionOperationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logMachineShopReport', () => {
    it('should calculate costs and save MSDR operations in a transaction', async () => {
      // Mock the transaction callback behavior
      mockPrismaService.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrismaService);
      });

      mockPrismaService.machine.findUniqueOrThrow.mockResolvedValue({ id: 'm-1', hourlyRate: { toNumber: () => 150 } });
      mockPrismaService.employee.findUniqueOrThrow.mockResolvedValue({ id: 'e-1', hourlyRate: { toNumber: () => 50 } });
      mockPrismaService.projectCostSummary.findUnique.mockResolvedValue(null);
      mockPrismaService.projectCostSummary.create.mockResolvedValue({});
      mockPrismaService.msdrHeader.create.mockResolvedValue({ id: 'header-1' });
      mockPrismaService.operation.findFirst.mockResolvedValue({ id: 'op-1' });
      mockPrismaService.msdrOperation.create.mockResolvedValue({ id: 'msdr-op-1' });

      const dto = {
        machineId: 'm-1',
        employeeId: 'e-1',
        reportDate: '2023-10-01',
        items: [
          {
            jobCardId: 'jc-1',
            qty: 5,
            startTime: '08:00',
            endTime: '10:00', // 2 hours
          }
        ]
      };

      await service.logMachineShopReport('proj-1', dto);

      expect(mockPrismaService.machine.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'm-1' } });
      
      // Cost should be 2 hours * (150 + 50) = 400 total. 
      // Labour: 100, Machine: 300
      expect(mockPrismaService.projectCostSummary.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1' },
          data: expect.objectContaining({
            machineCost: { increment: 300 },
            labourCost: { increment: 100 },
            totalCost: { increment: 400 },
          })
        })
      );
    });
  });
});
