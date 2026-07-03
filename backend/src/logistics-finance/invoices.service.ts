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

      // 4. Log project activity
      await tx.projectActivity.create({
        data: {
          projectId,
          action: 'INVOICE_GENERATED',
          description: `Invoice ${dto.invoiceNumber} billed. Revenue: $${newRevenue}. Live Project Profitability: $${newProfitability}`,
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
}
