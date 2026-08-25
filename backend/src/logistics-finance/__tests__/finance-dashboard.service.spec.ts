import { Test, TestingModule } from '@nestjs/testing';
import { FinanceDashboardService } from '../finance-dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FinanceDashboardService', () => {
  let service: FinanceDashboardService;

  const mockPrismaService = {
    projectCostSummary: {
      findMany: jest.fn(),
    },
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    invoiceHeader: {
      findMany: jest.fn(),
    },
    employee: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    projectCostEvent: {
      findMany: jest.fn(),
    },
    msdrHeader: {
      findMany: jest.fn(),
    },
    systemSetting: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceDashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FinanceDashboardService>(FinanceDashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFinanceDashboard (BUG-002 Regression)', () => {
    it('should correctly sum material cost without double-counting procurement and consumption', async () => {
      mockPrismaService.projectCostSummary.findMany.mockResolvedValue([
        {
          revenue: 500000,
          actualMaterialCost: 100000, // GRN Intake value
          materialConsumptionCost: 100000, // Issued to production value
          labourCost: 50000,
          machineCost: 75000,
          outsideProcessCost: 25000,
          inspectionCost: 5000,
          packingCost: 3000,
          dispatchCost: 2000,
          totalCost: 260000,
        },
        {
          revenue: 300000,
          actualMaterialCost: 80000, // Procured, none issued yet
          materialConsumptionCost: 0,
          labourCost: 20000,
          machineCost: 30000,
          outsideProcessCost: 0,
          inspectionCost: 0,
          packingCost: 0,
          dispatchCost: 0,
          totalCost: 50000,
        },
      ]);

      mockPrismaService.project.count.mockResolvedValue(2);
      mockPrismaService.invoiceHeader.findMany.mockResolvedValue([]);
      mockPrismaService.employee.count.mockResolvedValue(10);

      const result = await service.getFinanceDashboard();

      // Total material cost should be 100,000 (from first proj) + 80,000 (from second proj) = 180,000
      // NOT (100k + 100k) + 80k = 280,000
      expect(result.totalMaterialCost).toBe(180000);
      expect(result.totalRevenue).toBe(800000);
      expect(result.totalCost).toBe(310000);
      expect(result.grossProfit).toBe(490000);
    });
  });

  describe('getProjectProfitability (BUG-002 Regression)', () => {
    it('should calculate individual project material cost without double-counting', async () => {
      mockPrismaService.project.findMany.mockResolvedValue([
        {
          id: 'proj-1',
          projectNumber: 'KTD-101',
          partName: 'Die Insert',
          currentStage: 'PRODUCTION',
          customer: { companyName: 'Tata Motors' },
          projectCostSummary: {
            revenue: 200000,
            actualMaterialCost: 60000,
            materialConsumptionCost: 60000,
            labourCost: 20000,
            machineCost: 30000,
            outsideProcessCost: 10000,
            totalCost: 120000,
          },
          invoiceHeaders: [],
        },
      ]);

      const result = await service.getProjectProfitability();

      expect(result).toHaveLength(1);
      expect(result[0].materialCost).toBe(60000); // NOT 120,000
      expect(result[0].totalCost).toBe(120000);
      expect(result[0].profit).toBe(80000);
    });
  });

  describe('getCostBreakdown (BUG-002 Regression)', () => {
    it('should calculate material slice in cost breakdown without double-counting', async () => {
      mockPrismaService.projectCostSummary.findMany.mockResolvedValue([
        {
          materialConsumptionCost: 50000,
          actualMaterialCost: 50000,
          labourCost: 25000,
          machineCost: 25000,
          outsideProcessCost: 0,
          inspectionCost: 0,
          packingCost: 0,
          dispatchCost: 0,
        },
      ]);

      const result = await service.getCostBreakdown();

      const matCategory = result.categories.find((c: any) => c.name === 'Material');
      expect(matCategory?.value).toBe(50000); // NOT 100,000
      expect(result.total).toBe(100000);
    });
  });

  describe('getLabourCostAnalytics (BUG-011 Regression)', () => {
    it('should correctly populate departmentBreakdown from MSDR reports and employee rates', async () => {
      mockPrismaService.projectCostEvent.findMany
        .mockResolvedValueOnce([
          { amount: 5000, description: 'Labour cost', createdAt: new Date('2026-08-10'), project: { id: 'p1' } },
        ])
        .mockResolvedValueOnce([
          { amount: 15000, description: 'Machine cost', createdAt: new Date('2026-08-10'), project: { id: 'p1' } },
        ]);

      mockPrismaService.employee.findMany.mockResolvedValue([
        { id: 'emp-1', hourlyRate: 500, department: { departmentName: 'CNC Machining' } },
      ]);

      mockPrismaService.msdrHeader.findMany.mockResolvedValue([
        {
          id: 'msdr-1',
          employee: { id: 'emp-1', hourlyRate: 500, department: { departmentName: 'CNC Machining' } },
          operations: [{ runningHours: 10 }],
        },
      ]);

      const result = await service.getLabourCostAnalytics('2026-08');

      expect(result.totalLabourCost).toBe(5000);
      expect(result.totalMachineCost).toBe(15000);
      expect(result.departmentBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'CNC Machining',
            labourCost: 5000, // 10 hrs * 500
            machineHours: 10,
          }),
        ])
      );
    });
  });
});
