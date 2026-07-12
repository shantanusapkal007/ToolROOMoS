// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ProjectStatus } from '@prisma/client';
import { EventBus } from '../platform/event.bus';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus
  ) {}

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
          hsnCode: dto.hsnCode,
          gstPercent: dto.gstPercent ? Number(dto.gstPercent) : null,
          subtotal: dto.subtotal,
          cgstAmount: dto.cgstAmount ? Number(dto.cgstAmount) : 0,
          sgstAmount: dto.sgstAmount ? Number(dto.sgstAmount) : 0,
          igstAmount: dto.igstAmount ? Number(dto.igstAmount) : 0,
          taxAmount: dto.taxAmount,
          roundOff: dto.roundOff ? Number(dto.roundOff) : 0,
          totalAmount: dto.totalAmount,
          customFields: dto.customFields,
          status: 'GENERATED',
          remarks: dto.remarks,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // 3. Event-Driven Costing - Emit InvoiceCreated
      this.eventBus.emit('InvoiceCreated', {
        projectId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        revenue: dto.subtotal,
        userId: userId || 'SYSTEM'
      });

      // 4. Log project activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'INVOICE_GENERATED',
          description: `Invoice ${dto.invoiceNumber} billed. Revenue: ₹${dto.subtotal}.`,
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

  async getInvoicesByProject(projectId: string) {
    return this.prisma.invoiceHeader.findMany({
      where: { projectId },
      include: { items: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async recordPayment(projectId: string, invoiceId: string, dto: any, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoiceHeader.findFirstOrThrow({
        where: { id: invoiceId, projectId }
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
        where: { id: invoiceId },
        data: {
          paymentStatus,
          amountPaid: newAmountPaid,
          paidAt: isFullyPaid ? new Date() : invoice.paidAt,
          remarks: dto.remarks ? `${invoice.remarks || ''}\nPayment Ref: ${dto.paymentReference || 'N/A'}, Remarks: ${dto.remarks}` : invoice.remarks,
        }
      });

      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'PAYMENT_RECEIVED',
          description: `Payment recorded against Invoice ${invoice.invoiceNumber}. Amount: ₹${paymentAmount}. Status: ${paymentStatus}`,
          performedBy: userId || 'SYSTEM',
        }
      });

      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (project && project.currentStage === 'INVOICED') {
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
