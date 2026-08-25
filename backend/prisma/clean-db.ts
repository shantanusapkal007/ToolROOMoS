import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://root:rootpassword@localhost:5432/toolroomos?schema=public';
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Clearing all seeded database tables...');

  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';
  `;

  const tables = tablenames
    .map(({ tablename }) => `"${tablename}"`)
    .join(', ');

  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
    console.log('✅ All seeded data successfully removed from database tables.');
  }

  console.log('🌱 Seeding core initial Admin users and Role Permissions...');
  
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@toolroom.com' },
    update: { passwordHash, status: 'ACTIVE' },
    create: {
      email: 'admin@toolroom.com',
      passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const purchase = await prisma.user.upsert({
    where: { email: 'purchase@toolroom.com' },
    update: { passwordHash, status: 'ACTIVE' },
    create: {
      email: 'purchase@toolroom.com',
      passwordHash,
      name: 'Purchase Officer',
      role: 'PURCHASE',
      status: 'ACTIVE',
    },
  });

  const production = await prisma.user.upsert({
    where: { email: 'production@toolroom.com' },
    update: { passwordHash, status: 'ACTIVE' },
    create: {
      email: 'production@toolroom.com',
      passwordHash,
      name: 'Production Operator',
      role: 'PRODUCTION',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Seeded Core Users: ${admin.email}, ${purchase.email}, ${production.email}`);

  const modules = [
    'dashboard', 'projects', 'master_data', 'procurement', 'production',
    'quality', 'inventory', 'engineering', 'finance', 'reports',
    'maintenance', 'settings', 'activity_log', 'hr', 'assets'
  ];

  const adminPermissions = modules.map((module) => ({
    role: 'ADMIN' as const,
    module,
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canApprove: true,
    canExport: true,
  }));

  const salesPermissions = [
    { role: 'SALES' as const, module: 'dashboard', canView: true },
    { role: 'SALES' as const, module: 'projects', canView: true, canCreate: true, canEdit: true },
    { role: 'SALES' as const, module: 'reports', canView: true },
    { role: 'SALES_ENGINEER' as const, module: 'dashboard', canView: true },
    { role: 'SALES_ENGINEER' as const, module: 'projects', canView: true, canCreate: true, canEdit: true },
    { role: 'SALES_ENGINEER' as const, module: 'reports', canView: true },
  ];

  const engineeringPermissions = [
    { role: 'ENGINEERING' as const, module: 'dashboard', canView: true },
    { role: 'ENGINEERING' as const, module: 'projects', canView: true, canCreate: true, canEdit: true },
    { role: 'ENGINEERING' as const, module: 'master_data', canView: true, canCreate: true, canEdit: true },
    { role: 'ENGINEERING' as const, module: 'engineering', canView: true, canCreate: true, canEdit: true, canDelete: true },
  ];

  const purchasePermissions = [
    { role: 'PURCHASE' as const, module: 'dashboard', canView: true },
    { role: 'PURCHASE' as const, module: 'procurement', canView: true, canCreate: true, canEdit: true, canApprove: true },
    { role: 'PURCHASE' as const, module: 'master_data', canView: true },
    { role: 'PURCHASE' as const, module: 'inventory', canView: true },
  ];

  const storesPermissions = [
    { role: 'STORES' as const, module: 'dashboard', canView: true },
    { role: 'STORES' as const, module: 'inventory', canView: true, canCreate: true, canEdit: true },
    { role: 'STORES' as const, module: 'procurement', canView: true },
  ];

  const productionPermissions = [
    { role: 'PRODUCTION' as const, module: 'dashboard', canView: true },
    { role: 'PRODUCTION' as const, module: 'production', canView: true, canCreate: true, canEdit: true },
    { role: 'PRODUCTION' as const, module: 'projects', canView: true },
    { role: 'PRODUCTION' as const, module: 'engineering', canView: true },
  ];

  const qualityPermissions = [
    { role: 'QUALITY' as const, module: 'dashboard', canView: true },
    { role: 'QUALITY' as const, module: 'quality', canView: true, canCreate: true, canEdit: true, canApprove: true },
    { role: 'QUALITY' as const, module: 'projects', canView: true },
    { role: 'QUALITY' as const, module: 'engineering', canView: true },
  ];

  const financePermissions = [
    { role: 'FINANCE' as const, module: 'dashboard', canView: true },
    { role: 'FINANCE' as const, module: 'finance', canView: true, canCreate: true, canEdit: true, canApprove: true },
    { role: 'FINANCE' as const, module: 'reports', canView: true, canExport: true },
    { role: 'FINANCE' as const, module: 'projects', canView: true },
  ];

  const allPermissions = [
    ...adminPermissions,
    ...salesPermissions,
    ...engineeringPermissions,
    ...purchasePermissions,
    ...storesPermissions,
    ...productionPermissions,
    ...qualityPermissions,
    ...financePermissions,
  ];

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_module: {
          role: perm.role,
          module: perm.module,
        }
      },
      update: perm,
      create: perm,
    });
  }

  console.log('✅ Seeded Role Permissions for system modules.');
  console.log('✨ System Database is now clean and ready for fresh setup!');
}

main()
  .catch((e) => {
    console.error('❌ Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
