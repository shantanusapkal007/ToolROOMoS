import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveProjectId(projectId: string, tx?: any): Promise<string> {
    const db = tx || this.prisma;
    const project = await db.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { projectNumber: projectId }
        ]
      }
    });
    return project?.id || projectId;
  }

  async createInvoice(projectId: string, dto: CreateInvoiceDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId, tx);

      // 1. Fetch project stage
      const project = await tx.project.findFirst({
        where: {
          OR: [
            { id: projectId },
            { projectNumber: projectId }
          ]
        }
      });
      if (!project) {
        throw new NotFoundException(`Project not found for ID or project number '${projectId}'.`);
      }

      // 2. Business Rule: Cannot invoice undispatched goods
      const dispatch = await tx.dispatchNote.findUnique({
        where: { id: dto.dispatchNoteId }
      });
      if (!dispatch || dispatch.projectId !== targetProjectId) {
        throw new BadRequestException('Business Rule Violation: Cannot generate invoice without a valid Dispatch Note.');
      }

      // 2. Create Invoice Header
      const invoice = await tx.invoiceHeader.create({
        data: {
          projectId: targetProjectId,
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
      const allInvoices = await tx.invoiceHeader.findMany({
        where: { projectId: targetProjectId },
      });
      const totalRevenue = allInvoices.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0);

      const costSummary = await tx.projectCostSummary.upsert({
        where: { projectId: targetProjectId },
        create: {
          projectId: targetProjectId,
          revenue: totalRevenue,
          totalCost: 0,
          profitability: totalRevenue,
        },
        update: {
          revenue: totalRevenue,
        },
      });

      const totalCost = Number(costSummary.totalCost || 0);
      const newProfitability = totalRevenue - totalCost;

      await tx.projectCostSummary.update({
        where: { projectId: targetProjectId },
        data: {
          profitability: newProfitability,
        },
      });
      
      // Update the invoice with its profit
      await tx.invoiceHeader.update({
        where: { id: invoice.id },
        data: { profit: newProfitability }
      });

      // Log financial audit trail event for invoice generation
      await tx.projectCostEvent.create({
        data: {
          projectId: targetProjectId,
          costType: 'REVENUE',
          description: `Customer Tax Invoice ${dto.invoiceNumber} generated for ₹${Number(dto.subtotal || 0).toLocaleString('en-IN')}`,
          amount: dto.subtotal,
          referenceDocType: 'INVOICE',
          referenceDocId: invoice.id,
          createdBy: userId,
        },
      });

      // 4. Log project activity
      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'INVOICE_GENERATED',
          description: `Invoice ${dto.invoiceNumber} billed. Subtotal: ₹${dto.subtotal}. Total Revenue: ₹${totalRevenue}. Live Project Profitability: ₹${newProfitability}`,
          performedBy: userId || 'SYSTEM',
        },
      });

      // 5. Workflow Automation: Advance Project to INVOICED
      await tx.project.update({
        where: { id: targetProjectId },
        data: { currentStage: ProjectStatus.INVOICED, updatedBy: userId },
      });

      await tx.projectTimeline.create({
        data: {
          projectId: targetProjectId,
          fromStage: ProjectStatus.DISPATCHED,
          toStage: ProjectStatus.INVOICED,
          transitionedBy: userId || 'SYSTEM',
          remarks: `Billed to Customer. Finalizing financial outcome layer.`,
        },
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'STAGE_CHANGED',
          description: 'Project advanced to INVOICED stage',
          performedBy: userId || 'SYSTEM',
        },
      });

      return invoice;
    });
  }

  async getInvoices(projectId: string) {
    const targetProjectId = await this.resolveProjectId(projectId);
    return this.prisma.invoiceHeader.findMany({
      where: { projectId: targetProjectId },
      include: { items: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async recordPayment(projectId: string, dto: import('./dto/record-payment.dto').RecordPaymentDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const targetProjectId = await this.resolveProjectId(projectId, tx);
      const invoice = await tx.invoiceHeader.findFirstOrThrow({
        where: { id: dto.invoiceId, projectId: targetProjectId }
      });

      const paymentAmount = dto.amount || invoice.totalAmount;
      const newAmountPaid = Number(invoice.amountPaid) + Number(paymentAmount);
      const isFullyPaid = newAmountPaid >= Number(invoice.totalAmount);
      const paymentStatus = isFullyPaid ? 'PAID' : 'PARTIAL';

      await tx.invoicePayment.create({
        data: {
          invoiceHeaderId: invoice.id,
          amount: paymentAmount,
          paymentReference: dto.paymentReference,
          remarks: dto.remarks,
          createdBy: userId || 'SYSTEM',
        }
      });

      const updatedInvoice = await tx.invoiceHeader.update({
        where: { id: dto.invoiceId },
        data: {
          paymentStatus,
          amountPaid: newAmountPaid,
          paidAt: isFullyPaid ? new Date() : invoice.paidAt,
          remarks: dto.remarks ? `${invoice.remarks || ''}\nPayment Ref: ${dto.paymentReference || 'N/A'}, Remarks: ${dto.remarks}` : invoice.remarks,
        }
      });

      await tx.projectActivity.create({
        data: {
          projectId: targetProjectId,
          action: 'PAYMENT_RECEIVED',
          description: `Payment recorded against Invoice ${invoice.invoiceNumber}. Amount: ₹${paymentAmount}. Status: ${paymentStatus}`,
          performedBy: userId || 'SYSTEM',
        }
      });

      // Update project stage to PAYMENT_PENDING if it was INVOICED
      // (Assuming PAYMENT_PENDING means we are actively collecting, but if it's PAID, we can just move to CLOSED or let user close it)
      const project = await tx.project.findUnique({ where: { id: targetProjectId } });
      if (project && project.currentStage === 'INVOICED') {
        // Move to PAYMENT_PENDING to indicate payment is in progress/completed
        await tx.project.update({
          where: { id: targetProjectId },
          data: { currentStage: 'PAYMENT_PENDING' }
        });
        await tx.projectTimeline.create({
          data: {
            projectId: targetProjectId,
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
