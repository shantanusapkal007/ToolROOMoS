import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * PrismaService
 * 
 * The single database connection gateway for ToolRoomOS.
 * Every module in the system accesses the Digital Twin (PostgreSQL)
 * exclusively through this service.
 * 
 * Configured to use @prisma/adapter-pg as required by Prisma 7.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static pool: Pool;

  constructor() {
    if (!PrismaService.pool) {
      const dbUrl = process.env.DATABASE_URL || '';
      const isSsl =
        process.env.DB_SSL === 'true' ||
        dbUrl.includes('sslmode=require') ||
        dbUrl.includes('sslmode=no-verify');

      PrismaService.pool = new Pool({
        connectionString: dbUrl,
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      });
    }
    const adapter = new PrismaPg(PrismaService.pool);
    super({ adapter });

  }

  async onModuleInit() {
    await this.$connect();
    try {
      await this.$executeRawUnsafe(`
        ALTER TABLE "purchase_order_headers" ALTER COLUMN "projectId" DROP NOT NULL;
      `);
      await this.$executeRawUnsafe(`
        ALTER TABLE "goods_receipt_headers" ALTER COLUMN "projectId" DROP NOT NULL;
      `);
      await this.$executeRawUnsafe(`
        UPDATE "purchase_order_headers"
        SET "projectId" = NULL
        WHERE "purchaseRequestId" IN (
          SELECT id FROM "purchase_request_headers" WHERE "projectId" IS NULL
        );
      `);
      await this.$executeRawUnsafe(`
        DELETE FROM "projects" WHERE "projectNumber" IN ('GENERAL', 'GENERAL-STORES', 'KTD-GENERAL');
      `);
    } catch (e) {
      // Non-blocking auto-alignment
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
