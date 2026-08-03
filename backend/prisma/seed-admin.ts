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

  console.log('Seeded Role Permissions');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
