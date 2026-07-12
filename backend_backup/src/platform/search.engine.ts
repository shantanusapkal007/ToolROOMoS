// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchEngine {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Universal search across multiple Master Data and Documents.
   * Leverages the DocumentRegistry from Phase 3 for O(1) multi-table text search.
   */
  async search(query: string) {
    if (!query || query.length < 2) {
      return [];
    }

    // A real implementation would use PostgreSQL Full Text Search, Redisearch, or ElasticSearch.
    // For now, we query the DocumentRegistry for any exact or partial documentNumber matches.
    const documents = await this.prisma.documentRegistry.findMany({
      where: {
        documentNumber: { contains: query, mode: 'insensitive' },
      },
      take: 10,
    });

    return documents.map(doc => ({
      type: doc.documentType,
      id: doc.entityId,
      title: doc.documentNumber,
      subtitle: `Status: ${doc.status} | Rev: ${doc.revision}`,
    }));
  }
}

