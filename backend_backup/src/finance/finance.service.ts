import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * FinanceService — Full Accounting & Ledger
 */
@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------
  async getDashboardSummary() {
    // Payables from Purchase Orders (simplified since no Vendor Bill model)
    const purchaseOrders = await this.prisma.purchaseOrderHeader.findMany({
      select: { 
        id: true, 
        poNumber: true, 
        totalAmount: true, 
        vendorId: true, 
        status: true, 
        expectedDeliveryDate: true,
        vendor: { select: { vendorName: true } } 
      },
      where: { status: { notIn: ['CLOSED', 'CANCELLED'] } }
    });

    let totalPayables = 0;
    let outstandingPayables = 0;
    const upcomingPayments = [];

    for (const po of purchaseOrders) {
      const total = Number(po.totalAmount || 0);
      totalPayables += total;
      outstandingPayables += total;

      if (total > 0 && po.expectedDeliveryDate) {
        upcomingPayments.push({
          id: po.id,
          reference: po.poNumber,
          entity: po.vendor?.vendorName || po.vendorId,
          type: 'Payable',
          dueDate: po.expectedDeliveryDate,
          amount: total
        });
      }
    }

    // Receivables from Invoices
    const invoices = await this.prisma.invoiceHeader.findMany({
      select: { 
        id: true, 
        totalAmount: true, 
        amountPaid: true, 
        createdAt: true, 
        invoiceNumber: true, 
        paymentStatus: true, 
        project: { 
          select: { 
            customer: { select: { companyName: true } } 
          } 
        } 
      },
      where: { paymentStatus: { not: 'PAID' } }
    });

    let totalReceivables = 0;
    let outstandingReceivables = 0;

    for (const inv of invoices) {
      const total = Number(inv.totalAmount || 0);
      const paid = Number(inv.amountPaid || 0);
      totalReceivables += total;
      outstandingReceivables += (total - paid);

      if (total - paid > 0) {
        const dueDate = new Date(inv.createdAt);
        dueDate.setDate(dueDate.getDate() + 30);
        
        upcomingPayments.push({
          id: inv.id,
          reference: inv.invoiceNumber,
          entity: inv.project?.customer?.companyName || 'Customer',
          type: 'Receivable',
          dueDate: dueDate,
          amount: total - paid
        });
      }
    }

    upcomingPayments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Avg Project Margin and Watchlist
    const summaries = await this.prisma.projectCostSummary.findMany({
      include: {
        project: {
          select: { projectNumber: true, customer: { select: { companyName: true } } }
        }
      }
    });

    let totalRevenue = 0;
    let totalCost = 0;
    const watchlist = [];

    for (const sum of summaries) {
      const rev = Number(sum.revenue || 0);
      const cost = Number(sum.totalCost || 0);
      totalRevenue += rev;
      totalCost += cost;

      const marginStr = rev > 0 ? ((rev - cost) / rev * 100).toFixed(1) + '%' : '0%';
      
      watchlist.push({
        id: sum.projectId,
        projectNumber: sum.project?.projectNumber,
        customerName: sum.project?.customer?.companyName,
        actualCost: cost,
        marginStr,
        margin: rev > 0 ? ((rev - cost) / rev * 100) : 0
      });
    }

    const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1) : '0.0';

    watchlist.sort((a, b) => a.margin - b.margin);

    return {
      kpis: {
        totalReceivables,
        totalPayables,
        outstanding: outstandingReceivables - outstandingPayables,
        avgMargin: `${avgMargin}%`
      },
      watchlist: watchlist.slice(0, 5),
      upcomingPayments: upcomingPayments.slice(0, 5)
    };
  }
}
