import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LogisticsSubscriber {
  private readonly logger = new Logger(LogisticsSubscriber.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('DispatchCreated')
  async handleDispatchCreated(payload: any) {
    this.logger.log(`CostEngine handling DispatchCreated for project ${payload.projectId}`);
    
    try {
      await this.prisma.$transaction(async (tx) => {
        // Update Project Cost Summary with Dispatch Cost
        if (payload.logisticsCost > 0) {
          await tx.projectCostSummary.upsert({
            where: { projectId: payload.projectId },
            update: {
              dispatchCost: { increment: payload.logisticsCost },
              totalCost: { increment: payload.logisticsCost }
            },
            create: {
              projectId: payload.projectId,
              dispatchCost: payload.logisticsCost,
              totalCost: payload.logisticsCost
            }
          });

          // Record Cost Event
          await tx.projectCostEvent.create({
            data: {
              projectId: payload.projectId,
              costType: 'DISPATCH_COST',
              description: `Logistics cost for dispatch ${payload.dispatchNumber}`,
              amount: payload.logisticsCost,
              referenceDocType: 'DISPATCH_NOTE',
              referenceDocId: payload.dispatchId,
              createdBy: payload.userId,
            }
          });
        }
      });
    } catch (error) {
      this.logger.error(`Failed to handle DispatchCreated event: ${error.message}`);
    }
  }

  @OnEvent('InvoiceCreated')
  async handleInvoiceCreated(payload: any) {
    this.logger.log(`CostEngine handling InvoiceCreated for project ${payload.projectId}`);
    
    try {
      await this.prisma.$transaction(async (tx) => {
        const costSummary = await tx.projectCostSummary.findUnique({
          where: { projectId: payload.projectId }
        });

        const currentTotalCost = costSummary ? Number(costSummary.totalCost) : 0;
        const newRevenue = Number(payload.revenue);
        const profitability = newRevenue - currentTotalCost;

        await tx.projectCostSummary.upsert({
          where: { projectId: payload.projectId },
          update: {
            revenue: { increment: newRevenue },
            profitability: profitability // This simplifies profitability; actual calc might need all past revenues
          },
          create: {
            projectId: payload.projectId,
            revenue: newRevenue,
            profitability: profitability
          }
        });

        // Update the specific invoice with its profit snapshot
        await tx.invoiceHeader.update({
          where: { id: payload.invoiceId },
          data: { profit: profitability }
        });
      });
    } catch (error) {
      this.logger.error(`Failed to handle InvoiceCreated event: ${error.message}`);
    }
  }
}
