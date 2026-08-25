import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from '../invoices.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('InvoicesService', () => {
  let service: InvoicesService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    project: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dispatchNote: {
      findUnique: jest.fn(),
    },
    invoiceHeader: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirstOrThrow: jest.fn(),
      update: jest.fn(),
    },
    invoicePayment: {
      create: jest.fn(),
    },
    projectCostSummary: {
      upsert: jest.fn(),
      update: jest.fn(),
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
        InvoicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInvoice and recordPayment (BUG-003 Regression)', () => {
    const projectId = 'proj-123';

    beforeEach(() => {
      mockPrismaService.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrismaService);
      });
      mockPrismaService.project.findFirst.mockResolvedValue({ id: projectId, projectNumber: 'KTD-101' });
      mockPrismaService.project.findUnique.mockResolvedValue({ id: projectId, currentStage: 'INVOICED' });
    });

    it('createInvoice should log REVENUE cost event for billing', async () => {
      mockPrismaService.dispatchNote.findUnique.mockResolvedValue({ id: 'disp-1', projectId });
      mockPrismaService.invoiceHeader.create.mockResolvedValue({ id: 'inv-1', invoiceNumber: 'INV-1001' });
      mockPrismaService.invoiceHeader.findMany.mockResolvedValue([{ subtotal: 500000 }]);
      mockPrismaService.projectCostSummary.upsert.mockResolvedValue({ totalCost: 300000 });

      const dto = {
        dispatchNoteId: 'disp-1',
        invoiceNumber: 'INV-1001',
        subtotal: 500000,
        taxAmount: 90000,
        totalAmount: 590000,
      };

      await service.createInvoice(projectId, dto as any, 'user-1');

      expect(mockPrismaService.projectCostEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId,
          costType: 'REVENUE',
          amount: 500000,
          referenceDocType: 'INVOICE',
        }),
      });
    });

    it('recordPayment should record payment in invoicePayment table and log activity without double-counting REVENUE in cost events', async () => {
      mockPrismaService.invoiceHeader.findFirstOrThrow.mockResolvedValue({
        id: 'inv-1',
        invoiceNumber: 'INV-1001',
        totalAmount: 590000,
        amountPaid: 0,
      });
      mockPrismaService.invoiceHeader.update.mockResolvedValue({ id: 'inv-1', paymentStatus: 'PAID' });

      const dto = {
        invoiceId: 'inv-1',
        amount: 590000,
        paymentReference: 'NEFT-998877',
        remarks: 'Full payment received',
      };

      await service.recordPayment(projectId, dto, 'user-1');

      // Verify payment was recorded in invoicePayment
      expect(mockPrismaService.invoicePayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          invoiceHeaderId: 'inv-1',
          amount: 590000,
          paymentReference: 'NEFT-998877',
        }),
      });

      // Verify invoice status was updated to PAID
      expect(mockPrismaService.invoiceHeader.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: expect.objectContaining({
          paymentStatus: 'PAID',
          amountPaid: 590000,
        }),
      });

      // Verify project activity was logged
      expect(mockPrismaService.projectActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId,
          action: 'PAYMENT_RECEIVED',
        }),
      });

      // Verify no duplicate REVENUE event was created in projectCostEvent
      expect(mockPrismaService.projectCostEvent.create).not.toHaveBeenCalled();
    });
  });
});
