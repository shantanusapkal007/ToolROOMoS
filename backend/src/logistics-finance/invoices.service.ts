import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoice(projectId: string, dto: CreateInvoiceDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate project stage
      const project = await tx.project.findUniqueOrThrow({ where: { id: projectId } });
      if (project.currentStage !== ProjectStatus.DISPATCHED) {
        throw new BadRequestException('Invoices can only be generated during the Dispatched stage.');
      }

      // 2. Business Rule: Cannot invoice undispatched goods
      const dispatch = await tx.dispatchNote.findUnique({
        where: { id: dto.dispatchNoteId }
      });
      if (!dispatch || dispatch.projectId !== projectId) {
        throw new BadRequestException('Business Rule Violation: Cannot generate invoice without a valid Dispatch Note.');
      }

      // 2. Create Invoice Header
      const invoice = await tx.invoiceHeader.create({
        data: {
          projectId,
          dispatchNoteId: dto.dispatchNoteId,
          invoiceNumber: dto.invoiceNumber,
          documentNumber: dto.invoiceNumber,
          subtotal: dto.subtotal,
          taxAmount: dto.taxAmount,
          totalAmount: dto.totalAmount,
          status: 'GENERATED',
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. Costing & Profitability Integration (Layer 5 - Outcomes)
      const costSummary = await tx.projectCostSummary.findUniqueOrThrow({
        where: { projectId },
      });

      const newRevenue = dto.subtotal; // Use subtotal as pre-tax revenue for margins
      const newProfitability = newRevenue - costSummary.totalCost.toNumber();

      await tx.projectCostSummary.update({
        where: { projectId },
        data: {
          revenue: newRevenue,
          profitability: newProfitability,
        },
      });
      
      // Update the invoice with its profit
      await tx.invoiceHeader.update({
        where: { id: invoice.id },
        data: { profit: newProfitability }
      });

      // 4. Log project activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'INVOICE_GENERATED',
          description: `Invoice ${dto.invoiceNumber} billed. Revenue: ₹${newRevenue}. Live Project Profitability: ₹${newProfitability}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 5. Workflow Automation: Advance Project to INVOICED
      await tx.project.update({
        where: { id: projectId },
        data: { currentStage: ProjectStatus.INVOICED, updatedBy: userId },
      });

      await tx.projectTimeline.create({
        data: {
          projectId,
          fromStage: ProjectStatus.DISPATCHED,
          toStage: ProjectStatus.INVOICED,
          transitionedBy: userId || 'SYSTEM',
          remarks: `Billed to Customer. Finalizing financial outcome layer.`,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'STAGE_CHANGED',
          description: 'Project advanced to INVOICED stage',
          performedBy: userId || 'SYSTEM',
        },
      });

      return invoice;
    });
  }

  async getInvoices(projectId: string) {
    return this.prisma.invoiceHeader.findMany({
      where: { projectId },
      include: { items: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async recordPayment(projectId: string, dto: import('./dto/record-payment.dto').RecordPaymentDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoiceHeader.findFirstOrThrow({
        where: { id: dto.invoiceId, projectId }
      });

      const paymentStatus = 'PAID'; // Assuming full payment for simplicity for now

      const updatedInvoice = await tx.invoiceHeader.update({
        where: { id: dto.invoiceId },
        data: {
          paymentStatus,
          paidAt: new Date(),
          remarks: dto.remarks ? `${invoice.remarks || ''}\nPayment Ref: ${dto.paymentReference || 'N/A'}, Remarks: ${dto.remarks}` : invoice.remarks,
        }
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'PAYMENT_RECEIVED',
          description: `Payment recorded against Invoice ${invoice.invoiceNumber}. Amount: ₹${dto.amount || invoice.totalAmount}`,
          performedBy: userId || 'SYSTEM',
        }
      });

      // Update project stage to PAYMENT_PENDING if it was INVOICED
      // (Assuming PAYMENT_PENDING means we are actively collecting, but if it's PAID, we can just move to CLOSED or let user close it)
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (project && project.currentStage === 'INVOICED') {
        // Move to PAYMENT_PENDING to indicate payment is in progress/completed (stage name is a bit ambiguous, but we follow audit)
        await tx.project.update({
          where: { id: projectId },
          data: { currentStage: 'PAYMENT_PENDING' }
        });
        await tx.projectTimeline.create({
          data: {
            projectId,
            fromStage: 'INVOICED',
            toStage: 'PAYMENT_PENDING',
            transitionedBy: userId || 'SYSTEM',
            remarks: 'Payment recorded.'
          }
        });
      }

      return updatedInvoice;
    });
  }
}
