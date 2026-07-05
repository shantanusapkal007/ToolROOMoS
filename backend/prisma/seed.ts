import { PrismaClient, VendorType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Company
  const company = await prisma.company.upsert({
    where: { companyCode: 'MF-01' },
    update: {},
    create: {
      companyCode: 'MF-01',
      companyName: 'MetalForge Tooling Solutions',
      gstNumber: '27AAAAA1111A1Z1',
      pan: 'AAAAA1111A',
      address: 'Industrial Zone Sector 4, Pune',
      currency: 'USD',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Company: ${company.companyName}`);

  // 2. Seed Plant
  const plant = await prisma.plant.upsert({
    where: { plantCode: 'PL-01' },
    update: {},
    create: {
      plantCode: 'PL-01',
      plantName: 'Main Production Plant',
      address: 'Wing A, Pune Facility',
      workingHours: '8:00 - 20:00',
      companyId: company.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Plant: ${plant.plantName}`);

  // Seed Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { warehouseCode: 'DEFAULT-WH' },
    update: {},
    create: {
      warehouseCode: 'DEFAULT-WH',
      warehouseName: 'Main Raw Material Stores',
      plantId: plant.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Warehouse: ${warehouse.warehouseName}`);

  // 3. Seed Department
  const department = await prisma.department.upsert({
    where: { departmentCode: 'DE-01' },
    update: {},
    create: {
      departmentCode: 'DE-01',
      departmentName: 'Toolroom Production',
      plantId: plant.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Department: ${department.departmentName}`);

  // 4. Seed Customer
  const customer = await prisma.customer.upsert({
    where: { customerCode: 'CU-001' },
    update: {},
    create: {
      customerCode: 'CU-001',
      companyName: 'Aerospace Industries Ltd',
      gstNumber: '27BBBBB2222B2Z2',
      billingAddress: 'Airfield Road, Bangalore',
      shippingAddress: 'Airfield Road, Bangalore',
      contactPerson: 'Sarah Jenkins',
      contactPhone: '+919876543210',
      contactEmail: 'sarah@aerospaceind.com',
      paymentTerms: 'NET30',
      companyId: company.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Customer: ${customer.companyName}`);

  // 5. Seed Vendor
  const vendor = await prisma.vendor.upsert({
    where: { vendorCode: 'VE-001' },
    update: {},
    create: {
      vendorCode: 'VE-001',
      vendorName: 'Global Steel Suppliers Corp',
      vendorType: VendorType.MATERIAL_SUPPLIER,
      gstNumber: '27CCCCC3333C3Z3',
      address: 'Industrial Plot 12, Pune',
      contactPhone: '+919000000000',
      contactEmail: 'sales@globalsteel.com',
      companyId: company.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Vendor: ${vendor.vendorName}`);

  // 6. Seed Material Shape
  const shape = await prisma.materialShape.upsert({
    where: { shapeName: 'Block' },
    update: {},
    create: {
      shapeName: 'Block',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Material Shape: ${shape.shapeName}`);

  // 7. Seed Material
  const material = await prisma.material.upsert({
    where: { materialCode: 'MA-01' },
    update: {},
    create: {
      materialCode: 'MA-01',
      materialGrade: 'Aluminium Grade 7075',
      materialCategory: 'RAW_MATERIAL',
      density: 2.81,
      standardCost: 15,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shape.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Material: ${material.materialGrade}`);

  // 8. Seed Machine
  const machine = await prisma.machine.upsert({
    where: { machineCode: 'MC-04' },
    update: {},
    create: {
      machineCode: 'MC-04',
      machineName: 'VMC Machining Center #4',
      machineType: 'VMC',
      hourlyRate: 50,
      capacity: '800x500mm Travel',
      plantId: plant.id,
      departmentId: department.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Machine: ${machine.machineName}`);

  // 9. Seed Shift
  const shift = await prisma.shift.upsert({
    where: { shiftName: 'General Shift' },
    update: {},
    create: {
      shiftName: 'General Shift',
      startTime: '09:00',
      endTime: '18:00',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Shift: ${shift.shiftName}`);

  // 10. Seed Employee
  const employee = await prisma.employee.upsert({
    where: { employeeCode: 'EM-042' },
    update: {},
    create: {
      employeeCode: 'EM-042',
      name: 'Alex Mercer',
      designation: 'CNC Machinist Lead',
      hourlyRate: 20,
      shiftId: shift.id,
      departmentId: department.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Employee: ${employee.name}`);

  // 11. Seed Operation
  const operation = await prisma.operation.upsert({
    where: { operationCode: 'OP-01' },
    update: {},
    create: {
      operationCode: 'OP-01',
      operationName: 'CNC Milling',
      remarks: 'Standard 3-axis CNC milling operation',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Operation: ${operation.operationName}`);

  console.log('🌱 Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
