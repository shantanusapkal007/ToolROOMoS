import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@toolroom.com' },
    update: {},
    create: {
      email: 'admin@toolroom.com',
      passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  const purchase = await prisma.user.upsert({
    where: { email: 'purchase@toolroom.com' },
    update: {},
    create: {
      email: 'purchase@toolroom.com',
      passwordHash,
      name: 'Purchase Officer',
      role: 'PURCHASE',
    },
  });

  const production = await prisma.user.upsert({
    where: { email: 'production@toolroom.com' },
    update: {},
    create: {
      email: 'production@toolroom.com',
      passwordHash,
      name: 'Production Operator',
      role: 'PRODUCTION',
    },
  });

  console.log('Seeded initial users:', admin.email, purchase.email, production.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
