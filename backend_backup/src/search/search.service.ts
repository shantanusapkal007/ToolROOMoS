import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchResult {
  id: string;
  type: string;
  label: string;
  path: string;
  icon: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchAll(query: string) {
    if (!query || query.length < 2) {
      return [];
    }

    const searchStr = query.toLowerCase();

    // Run searches in parallel
    const [projects, materials, customers, vendors, batches, grns, pos, issues, assemblies] = await Promise.all([
      // Search Projects
      this.prisma.project.findMany({
        where: {
          OR: [
            { projectNumber: { contains: searchStr, mode: 'insensitive' } },
            { partName: { contains: searchStr, mode: 'insensitive' } },
            { customerPoNumber: { contains: searchStr, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, projectNumber: true, partName: true },
      }),
      // Search Materials
      this.prisma.material.findMany({
        where: {
          OR: [
            { materialCode: { contains: searchStr, mode: 'insensitive' } },
            { materialGrade: { contains: searchStr, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, materialCode: true, materialGrade: true },
      }),
      // Search Customers
      this.prisma.customer.findMany({
        where: { companyName: { contains: searchStr, mode: 'insensitive' } },
        take: 5,
        select: { id: true, companyName: true },
      }),
      // Search Vendors
      this.prisma.vendor.findMany({
        where: { vendorName: { contains: searchStr, mode: 'insensitive' } },
        take: 5,
        select: { id: true, vendorName: true },
      }),
      // Search Inventory Batches
      this.prisma.inventoryBatch.findMany({
        where: {
          OR: [
            { batchNumber: { contains: searchStr, mode: 'insensitive' } },
            { heatNumber: { contains: searchStr, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, batchNumber: true, heatNumber: true },
      }),
      // Search GRNs
      this.prisma.goodsReceiptHeader.findMany({
        where: { grnNumber: { contains: searchStr, mode: 'insensitive' } },
        take: 5,
        select: { id: true, grnNumber: true },
      }),
      // Search POs
      this.prisma.purchaseOrderHeader.findMany({
        where: { poNumber: { contains: searchStr, mode: 'insensitive' } },
        take: 5,
        select: { id: true, poNumber: true },
      }),
      // Search Issues
      this.prisma.materialIssueHeader.findMany({
        where: { issueNumber: { contains: searchStr, mode: 'insensitive' } },
        take: 5,
        select: { id: true, issueNumber: true },
      }),
      // Search Assemblies
      this.prisma.assemblyHeader.findMany({
        where: {
          OR: [
            { assemblyNumber: { contains: searchStr, mode: 'insensitive' } },
            { assemblyName: { contains: searchStr, mode: 'insensitive' } },
          ]
        },
        take: 5,
        select: { id: true, assemblyNumber: true, assemblyName: true },
      }),
    ]);

    const results: SearchResult[] = [];

    projects.forEach((p: any) => results.push({
      id: p.id,
      type: 'Project',
      label: `${p.projectNumber} - ${p.partName}`,
      path: `/projects/${p.id}/overview`,
      icon: 'Briefcase'
    }));

    materials.forEach((m: any) => results.push({
      id: m.id,
      type: 'Material',
      label: `${m.materialCode} - ${m.materialGrade}`,
      path: `/master-data/materials`, // Add specific path if modal is supported
      icon: 'Package'
    }));

    customers.forEach((c: any) => results.push({
      id: c.id,
      type: 'Customer',
      label: c.companyName,
      path: `/master-data/customers`,
      icon: 'Users'
    }));

    vendors.forEach((v: any) => results.push({
      id: v.id,
      type: 'Vendor',
      label: v.vendorName,
      path: `/master-data/vendors`,
      icon: 'Factory'
    }));

    batches.forEach((b: any) => results.push({
      id: b.id,
      type: 'Inventory',
      label: `${b.batchNumber}${b.heatNumber ? ' (Heat: ' + b.heatNumber + ')' : ''}`,
      path: `/inventory/batches/${b.id}`,
      icon: 'Box'
    }));

    grns.forEach((g: any) => results.push({
      id: g.id,
      type: 'Goods Receipt',
      label: g.grnNumber,
      path: `/inventory/grn/${g.id}`,
      icon: 'FileText'
    }));

    pos.forEach((p: any) => results.push({
      id: p.id,
      type: 'Purchase Order',
      label: p.poNumber,
      path: `/procurement/orders/${p.id}`,
      icon: 'ShoppingCart'
    }));

    issues.forEach((i: any) => results.push({
      id: i.id,
      type: 'Material Issue',
      label: i.issueNumber,
      path: `/inventory/issues/${i.id}`,
      icon: 'ArrowRight'
    }));

    assemblies.forEach((a: any) => results.push({
      id: a.id,
      type: 'Assembly',
      label: `${a.assemblyNumber} - ${a.assemblyName}`,
      path: `/production/assemblies/${a.id}`,
      icon: 'Settings'
    }));

    return results;
  }
}
