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
    const [projects, materials, customers, vendors] = await Promise.all([
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
    ]);

    const results: SearchResult[] = [];

    projects.forEach(p => results.push({
      id: p.id,
      type: 'Project',
      label: `${p.projectNumber} - ${p.partName}`,
      path: `/projects/${p.id}/overview`,
      icon: 'Briefcase'
    }));

    materials.forEach(m => results.push({
      id: m.id,
      type: 'Material',
      label: `${m.materialCode} - ${m.materialGrade}`,
      path: `/master-data/materials`, // Add specific path if modal is supported
      icon: 'Package'
    }));

    customers.forEach(c => results.push({
      id: c.id,
      type: 'Customer',
      label: c.companyName,
      path: `/master-data/customers`,
      icon: 'Users'
    }));

    vendors.forEach(v => results.push({
      id: v.id,
      type: 'Vendor',
      label: v.vendorName,
      path: `/master-data/vendors`,
      icon: 'Factory'
    }));

    return results;
  }
}
