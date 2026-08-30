"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = require("bcrypt");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const dbUrl = process.env.DATABASE_URL || 'postgresql://root:rootpassword@localhost:5432/toolroomos?schema=public';
const pool = new pg_1.Pool({ connectionString: dbUrl });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🧹 Clearing all seeded database tables...');
    const tablenames = await prisma.$queryRaw `
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
        role: 'ADMIN',
        module,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
        canExport: true,
    }));
    const salesPermissions = [
        { role: 'SALES', module: 'dashboard', canView: true },
        { role: 'SALES', module: 'projects', canView: true, canCreate: true, canEdit: true },
        { role: 'SALES', module: 'reports', canView: true },
        { role: 'SALES_ENGINEER', module: 'dashboard', canView: true },
        { role: 'SALES_ENGINEER', module: 'projects', canView: true, canCreate: true, canEdit: true },
        { role: 'SALES_ENGINEER', module: 'reports', canView: true },
    ];
    const engineeringPermissions = [
        { role: 'ENGINEERING', module: 'dashboard', canView: true },
        { role: 'ENGINEERING', module: 'projects', canView: true, canCreate: true, canEdit: true },
        { role: 'ENGINEERING', module: 'master_data', canView: true, canCreate: true, canEdit: true },
        { role: 'ENGINEERING', module: 'engineering', canView: true, canCreate: true, canEdit: true, canDelete: true },
    ];
    const purchasePermissions = [
        { role: 'PURCHASE', module: 'dashboard', canView: true },
        { role: 'PURCHASE', module: 'procurement', canView: true, canCreate: true, canEdit: true, canApprove: true },
        { role: 'PURCHASE', module: 'master_data', canView: true },
        { role: 'PURCHASE', module: 'inventory', canView: true },
    ];
    const storesPermissions = [
        { role: 'STORES', module: 'dashboard', canView: true },
        { role: 'STORES', module: 'inventory', canView: true, canCreate: true, canEdit: true },
        { role: 'STORES', module: 'procurement', canView: true },
    ];
    const productionPermissions = [
        { role: 'PRODUCTION', module: 'dashboard', canView: true },
        { role: 'PRODUCTION', module: 'production', canView: true, canCreate: true, canEdit: true },
        { role: 'PRODUCTION', module: 'projects', canView: true },
        { role: 'PRODUCTION', module: 'engineering', canView: true },
    ];
    const qualityPermissions = [
        { role: 'QUALITY', module: 'dashboard', canView: true },
        { role: 'QUALITY', module: 'quality', canView: true, canCreate: true, canEdit: true, canApprove: true },
        { role: 'QUALITY', module: 'projects', canView: true },
        { role: 'QUALITY', module: 'engineering', canView: true },
    ];
    const financePermissions = [
        { role: 'FINANCE', module: 'dashboard', canView: true },
        { role: 'FINANCE', module: 'finance', canView: true, canCreate: true, canEdit: true, canApprove: true },
        { role: 'FINANCE', module: 'reports', canView: true, canExport: true },
        { role: 'FINANCE', module: 'projects', canView: true },
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
