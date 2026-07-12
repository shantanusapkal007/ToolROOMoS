import { PrismaClient, VendorType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 0. Seed Admin User
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@toolroom.com' },
    update: { passwordHash },
    create: {
      email: 'admin@toolroom.com',
      passwordHash,
      name: 'System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded User: ${adminUser.email}`);

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

  // 3. Seed Warehouse
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

  // 4. Seed Department
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

  // 5. Seed Customer
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

  // 6. Seed Vendor
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

  // 7. Seed Material Shape
  const shapeBlock = await prisma.materialShape.upsert({
    where: { shapeName: 'Block' },
    update: {},
    create: {
      shapeName: 'Block',
      status: 'ACTIVE',
    },
  });
  const shapeRoundBar = await prisma.materialShape.upsert({
    where: { shapeName: 'Round Bar' },
    update: {},
    create: {
      shapeName: 'Round Bar',
      status: 'ACTIVE',
    },
  });
  const shapePlate = await prisma.materialShape.upsert({
    where: { shapeName: 'Plate' },
    update: {},
    create: {
      shapeName: 'Plate',
      status: 'ACTIVE',
    },
  });
  const shapeHexBar = await prisma.materialShape.upsert({
    where: { shapeName: 'Hex Bar' },
    update: {},
    create: {
      shapeName: 'Hex Bar',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Material Shapes: Block, Round Bar, Plate, Hex Bar`);

  // 8. Seed Materials
  const material = await prisma.material.upsert({
    where: { materialCode: 'MA-01' },
    update: {
      materialGrade: 'Aluminium Grade 7075',
      materialCategory: 'RAW_MATERIAL',
      density: 2.81,
      standardCost: 15,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeBlock.id,
      status: 'ACTIVE',
    },
    create: {
      materialCode: 'MA-01',
      materialGrade: 'Aluminium Grade 7075',
      materialCategory: 'RAW_MATERIAL',
      density: 2.81,
      standardCost: 15,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeBlock.id,
      status: 'ACTIVE',
    },
  });

  const materialD2 = await prisma.material.upsert({
    where: { materialCode: 'MA-02' },
    update: {
      materialGrade: 'D2 Tool Steel',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 85,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeRoundBar.id,
      status: 'ACTIVE',
    },
    create: {
      materialCode: 'MA-02',
      materialGrade: 'D2 Tool Steel',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 85,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeRoundBar.id,
      status: 'ACTIVE',
    },
  });

  const materialH13 = await prisma.material.upsert({
    where: { materialCode: 'MA-03' },
    update: {
      materialGrade: 'H13 Die Steel',
      materialCategory: 'RAW_MATERIAL',
      density: 7.80,
      standardCost: 95,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapePlate.id,
      status: 'ACTIVE',
    },
    create: {
      materialCode: 'MA-03',
      materialGrade: 'H13 Die Steel',
      materialCategory: 'RAW_MATERIAL',
      density: 7.80,
      standardCost: 95,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapePlate.id,
      status: 'ACTIVE',
    },
  });

  const materialEN31 = await prisma.material.upsert({
    where: { materialCode: 'MA-04' },
    update: {
      materialGrade: 'EN31 Alloy Steel',
      materialCategory: 'RAW_MATERIAL',
      density: 7.84,
      standardCost: 45,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeRoundBar.id,
      status: 'ACTIVE',
    },
    create: {
      materialCode: 'MA-04',
      materialGrade: 'EN31 Alloy Steel',
      materialCategory: 'RAW_MATERIAL',
      density: 7.84,
      standardCost: 45,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeRoundBar.id,
      status: 'ACTIVE',
    },
  });

  const materialMS = await prisma.material.upsert({
    where: { materialCode: 'MA-05' },
    update: {
      materialGrade: 'Mild Steel 1018',
      materialCategory: 'RAW_MATERIAL',
      density: 7.87,
      standardCost: 12,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapePlate.id,
      status: 'ACTIVE',
    },
    create: {
      materialCode: 'MA-05',
      materialGrade: 'Mild Steel 1018',
      materialCategory: 'RAW_MATERIAL',
      density: 7.87,
      standardCost: 12,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapePlate.id,
      status: 'ACTIVE',
    },
  });

  const materialBrass = await prisma.material.upsert({
    where: { materialCode: 'MA-06' },
    update: {
      materialGrade: 'Brass Alloy 360',
      materialCategory: 'RAW_MATERIAL',
      density: 8.50,
      standardCost: 65,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeHexBar.id,
      status: 'ACTIVE',
    },
    create: {
      materialCode: 'MA-06',
      materialGrade: 'Brass Alloy 360',
      materialCategory: 'RAW_MATERIAL',
      density: 8.50,
      standardCost: 65,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeHexBar.id,
      status: 'ACTIVE',
    },
  });

  const materialCopper = await prisma.material.upsert({
    where: { materialCode: 'MA-07' },
    update: {
      materialGrade: 'Electrolytic Copper',
      materialCategory: 'RAW_MATERIAL',
      density: 8.96,
      standardCost: 110,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeRoundBar.id,
      status: 'ACTIVE',
    },
    create: {
      materialCode: 'MA-07',
      materialGrade: 'Electrolytic Copper',
      materialCategory: 'RAW_MATERIAL',
      density: 8.96,
      standardCost: 110,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeRoundBar.id,
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Seeded Materials: MA-01 (Aluminium), MA-02 (D2 Tool Steel), MA-03 (H13), MA-04 (EN31), MA-05 (Mild Steel), MA-06 (Brass), MA-07 (Copper)`);

  // 9. Seed Machine
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

  // 10. Seed Shift
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

  // 11. Seed Employee
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

  // 12. Seed Operations
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
  const opInspect = await prisma.operation.upsert({
    where: { operationCode: 'OP-06' },
    update: {},
    create: {
      operationCode: 'OP-06',
      operationName: 'Quality Inspection',
      remarks: 'CMM inspection and dimensional layout',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Operations: ${operation.operationName}, ${opInspect.operationName}`);

  // 13. Seed Storage Locations
  const location = await prisma.storageLocation.upsert({
    where: { locationCode: 'SL-WH-01' },
    update: {},
    create: {
      locationCode: 'SL-WH-01',
      locationName: 'Bin A-1',
      warehouseId: warehouse.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Storage Location: ${location.locationName}`);

  // 14. Seed Uoms
  const uomKg = await prisma.uom.upsert({
    where: { uomCode: 'KG' },
    update: {},
    create: {
      uomCode: 'KG',
      uomName: 'Kilograms',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Uom: ${uomKg.uomName}`);

  // 15. Seed Document Types
  const dtDrawing = await prisma.documentType.upsert({
    where: { typeCode: 'DRAWING' },
    update: {},
    create: {
      typeCode: 'DRAWING',
      typeName: 'Engineering Drawing',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Document Type: ${dtDrawing.typeName}`);

  // 16. Seed Inspection Standards
  const stdDimensional = await prisma.inspectionStandard.upsert({
    where: { standardCode: 'STD-DIM-01' },
    update: {},
    create: {
      standardCode: 'STD-DIM-01',
      standardName: 'CMM Dimensional Tolerances',
      description: 'Critical dimensional verification check using Coordinate Measuring Machine',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Inspection Standard: ${stdDimensional.standardName}`);

  // 17. Seed Cost Rates
  const costRateLabour = await prisma.costRate.upsert({
    where: { id: 'CR-LABOUR-01' },
    update: {},
    create: {
      id: 'CR-LABOUR-01',
      rateType: 'LABOUR',
      rateName: 'Machinist Hourly rate',
      rateValue: 20,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Cost Rate: ${costRateLabour.rateName}`);

  // 18. Seed Additional Customers
  const customer2 = await prisma.customer.upsert({
    where: { customerCode: 'CU-002' },
    update: {},
    create: {
      customerCode: 'CU-002',
      companyName: 'Tata Motors Ltd',
      gstNumber: '27DDDDD4444D4Z4',
      billingAddress: 'Pimpri-Chinchwad, Pune',
      shippingAddress: 'Pimpri-Chinchwad, Pune',
      contactPerson: 'Rajesh Nair',
      contactPhone: '+919812345678',
      contactEmail: 'rajesh.nair@tatamotors.com',
      paymentTerms: 'NET45',
      companyId: company.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Customer: ${customer2.companyName}`);

  const customer3 = await prisma.customer.upsert({
    where: { customerCode: 'CU-003' },
    update: {},
    create: {
      customerCode: 'CU-003',
      companyName: 'Cummins India Pvt Ltd',
      gstNumber: '27EEEEE5555E5Z5',
      billingAddress: 'Kothrud, Pune',
      shippingAddress: 'Kothrud, Pune',
      contactPerson: 'Sanjay Patil',
      contactPhone: '+919988776655',
      contactEmail: 'sanjay.patil@cummins.com',
      paymentTerms: 'NET60',
      companyId: company.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Customer: ${customer3.companyName}`);

  const customer4 = await prisma.customer.upsert({
    where: { customerCode: 'CU-004' },
    update: {},
    create: {
      customerCode: 'CU-004',
      companyName: 'Mahindra & Mahindra',
      gstNumber: '27FFFFF6666F6Z6',
      billingAddress: 'Nashik, Maharashtra',
      shippingAddress: 'Nashik, Maharashtra',
      contactPerson: 'Priya Sharma',
      contactPhone: '+919876000123',
      contactEmail: 'priya.sharma@mahindra.com',
      paymentTerms: 'NET30',
      companyId: company.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Customer: ${customer4.companyName}`);

  // 19. Seed Demo Projects Definitions
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  interface DemoProjectDef {
    projectNumber: string;
    customerPoNumber: string;
    partName: string;
    description: string;
    targetDeliveryDate: Date;
    priority: string;
    projectOwner: string;
    customerId: string;
    currentStage: 'CREATED' | 'ENGINEERING' | 'PROCUREMENT' | 'MATERIAL_AVAILABLE' | 'PRODUCTION' | 'INSPECTION' | 'DISPATCH_READY' | 'DISPATCHED' | 'INVOICED' | 'PAYMENT_PENDING' | 'CLOSED';
    progress: number;
    createdAt: Date;
    cost: {
      estimatedMaterialCost: number;
      actualMaterialCost: number;
      materialConsumptionCost: number;
      machineCost: number;
      labourCost: number;
      outsideProcessCost: number;
      inspectionCost: number;
      packingCost: number;
      dispatchCost: number;
      totalCost: number;
      revenue: number;
      profitability: number;
      estimatedProjectCost: number;
    };
  }

  const demoProjects: DemoProjectDef[] = [
    {
      projectNumber: 'PRJ-2025-001',
      customerPoNumber: 'PO/AERO/2025/0145',
      partName: 'Turbine Blade Fixture',
      description: 'Precision fixture for aerospace turbine blade machining. 5-axis VMC setup with ±0.005mm tolerance.',
      targetDeliveryDate: daysFromNow(21),
      priority: 'HIGH',
      projectOwner: 'Alex Mercer',
      customerId: customer.id,
      currentStage: 'ENGINEERING',
      progress: 15,
      createdAt: daysAgo(5),
      cost: {
        estimatedMaterialCost: 45000,
        actualMaterialCost: 0,
        materialConsumptionCost: 0,
        machineCost: 0,
        labourCost: 0,
        outsideProcessCost: 0,
        inspectionCost: 0,
        packingCost: 0,
        dispatchCost: 0,
        totalCost: 0,
        revenue: 185000,
        profitability: 0,
        estimatedProjectCost: 120000,
      },
    },
    {
      projectNumber: 'PRJ-2025-002',
      customerPoNumber: 'PO/TATA/2025/0889',
      partName: 'Progressive Die – Door Hinge Bracket',
      description: 'Progressive stamping die for automotive door hinge bracket. 12 stations, D2 tool steel.',
      targetDeliveryDate: daysFromNow(35),
      priority: 'HIGH',
      projectOwner: 'Alex Mercer',
      customerId: customer2.id,
      currentStage: 'PROCUREMENT',
      progress: 30,
      createdAt: daysAgo(18),
      cost: {
        estimatedMaterialCost: 78000,
        actualMaterialCost: 52000,
        materialConsumptionCost: 0,
        machineCost: 0,
        labourCost: 0,
        outsideProcessCost: 12000,
        inspectionCost: 0,
        packingCost: 0,
        dispatchCost: 0,
        totalCost: 64000,
        revenue: 350000,
        profitability: 0,
        estimatedProjectCost: 220000,
      },
    },
    {
      projectNumber: 'PRJ-2025-003',
      customerPoNumber: 'PO/CMI/2025/1201',
      partName: 'Genset Enclosure Mould',
      description: 'Sheet metal forming mould for genset enclosure body. 1.6mm CRCA with powder coat finish.',
      targetDeliveryDate: daysFromNow(10),
      priority: 'URGENT',
      projectOwner: 'Alex Mercer',
      customerId: customer3.id,
      currentStage: 'PRODUCTION',
      progress: 60,
      createdAt: daysAgo(40),
      cost: {
        estimatedMaterialCost: 35000,
        actualMaterialCost: 33500,
        materialConsumptionCost: 28000,
        machineCost: 42000,
        labourCost: 18000,
        outsideProcessCost: 8500,
        inspectionCost: 2000,
        packingCost: 0,
        dispatchCost: 0,
        totalCost: 132000,
        revenue: 275000,
        profitability: 0,
        estimatedProjectCost: 165000,
      },
    },
    {
      projectNumber: 'PRJ-2025-004',
      customerPoNumber: 'PO/MAH/2025/0567',
      partName: 'Tractor Axle Housing Jig',
      description: 'Welding jig for tractor rear axle housing. AISI 4140 construction with locating pins.',
      targetDeliveryDate: daysFromNow(5),
      priority: 'NORMAL',
      projectOwner: 'Alex Mercer',
      customerId: customer4.id,
      currentStage: 'INSPECTION',
      progress: 80,
      createdAt: daysAgo(52),
      cost: {
        estimatedMaterialCost: 22000,
        actualMaterialCost: 21500,
        materialConsumptionCost: 20000,
        machineCost: 35000,
        labourCost: 15000,
        outsideProcessCost: 5000,
        inspectionCost: 3500,
        packingCost: 0,
        dispatchCost: 0,
        totalCost: 100000,
        revenue: 195000,
        profitability: 0,
        estimatedProjectCost: 110000,
      },
    },
    {
      projectNumber: 'PRJ-2025-005',
      customerPoNumber: 'PO/AERO/2025/0098',
      partName: 'Landing Gear Bushing Tool',
      description: 'Precision boring tool for landing gear bushing. Inconel 718 with diamond-coated inserts.',
      targetDeliveryDate: daysFromNow(2),
      priority: 'HIGH',
      projectOwner: 'Alex Mercer',
      customerId: customer.id,
      currentStage: 'DISPATCH_READY',
      progress: 92,
      createdAt: daysAgo(60),
      cost: {
        estimatedMaterialCost: 55000,
        actualMaterialCost: 54000,
        materialConsumptionCost: 52000,
        machineCost: 68000,
        labourCost: 22000,
        outsideProcessCost: 15000,
        inspectionCost: 5000,
        packingCost: 3500,
        dispatchCost: 0,
        totalCost: 219500,
        revenue: 425000,
        profitability: 0,
        estimatedProjectCost: 230000,
      },
    },
    {
      projectNumber: 'PRJ-2025-006',
      customerPoNumber: 'PO/TATA/2025/0445',
      partName: 'Fender Panel Draw Die',
      description: 'Deep draw die for front fender panel. 500T press, SKD11 tool steel.',
      targetDeliveryDate: daysAgo(3),
      priority: 'NORMAL',
      projectOwner: 'Alex Mercer',
      customerId: customer2.id,
      currentStage: 'DISPATCHED',
      progress: 96,
      createdAt: daysAgo(75),
      cost: {
        estimatedMaterialCost: 92000,
        actualMaterialCost: 89000,
        materialConsumptionCost: 85000,
        machineCost: 110000,
        labourCost: 38000,
        outsideProcessCost: 25000,
        inspectionCost: 7000,
        packingCost: 5000,
        dispatchCost: 4500,
        totalCost: 363500,
        revenue: 580000,
        profitability: 0,
        estimatedProjectCost: 375000,
      },
    },
    {
      projectNumber: 'PRJ-2025-007',
      customerPoNumber: 'PO/CMI/2025/0823',
      partName: 'Cylinder Head Checking Gauge',
      description: 'Go/No-Go gauge for cylinder head bore dimensions. Hardened EN31, chrome plated.',
      targetDeliveryDate: daysAgo(15),
      priority: 'NORMAL',
      projectOwner: 'Alex Mercer',
      customerId: customer3.id,
      currentStage: 'INVOICED',
      progress: 98,
      createdAt: daysAgo(90),
      cost: {
        estimatedMaterialCost: 18000,
        actualMaterialCost: 17500,
        materialConsumptionCost: 16800,
        machineCost: 28000,
        labourCost: 12000,
        outsideProcessCost: 4000,
        inspectionCost: 2500,
        packingCost: 1500,
        dispatchCost: 2000,
        totalCost: 84300,
        revenue: 165000,
        profitability: 80700,
        estimatedProjectCost: 90000,
      },
    },
    {
      projectNumber: 'PRJ-2024-048',
      customerPoNumber: 'PO/MAH/2024/1899',
      partName: 'Transmission Case Fixture',
      description: 'Multi-spindle drilling fixture for tractor transmission case. Hardened HSS bushings.',
      targetDeliveryDate: daysAgo(45),
      priority: 'NORMAL',
      projectOwner: 'Alex Mercer',
      customerId: customer4.id,
      currentStage: 'CLOSED',
      progress: 100,
      createdAt: daysAgo(120),
      cost: {
        estimatedMaterialCost: 28000,
        actualMaterialCost: 27000,
        materialConsumptionCost: 26500,
        machineCost: 45000,
        labourCost: 16000,
        outsideProcessCost: 6000,
        inspectionCost: 3000,
        packingCost: 2000,
        dispatchCost: 2500,
        totalCost: 128000,
        revenue: 240000,
        profitability: 112000,
        estimatedProjectCost: 135000,
      },
    },
  ];

  // 20. Clean up existing data for these projects (to maintain idempotency with full cascade)
  const projectNumbers = demoProjects.map((d) => d.projectNumber);
  console.log('🧹 Cleaning old demo data...');
  await prisma.projectTask.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.projectTimeline.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.projectActivity.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.projectCostEvent.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.projectCostSummary.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.machineShopDailyReport.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.jobCard.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.materialIssueItem.deleteMany({ where: { issueHeader: { project: { projectNumber: { in: projectNumbers } } } } });
  await prisma.materialIssueHeader.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.inventoryTransaction.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.inventoryBatch.deleteMany({ where: { grnItem: { grnHeader: { project: { projectNumber: { in: projectNumbers } } } } } });
  await prisma.goodsReceiptItem.deleteMany({ where: { grnHeader: { project: { projectNumber: { in: projectNumbers } } } } });
  await prisma.goodsReceiptHeader.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.purchaseOrderItem.deleteMany({ where: { poHeader: { project: { projectNumber: { in: projectNumbers } } } } });
  await prisma.purchaseOrderHeader.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.routingOperation.deleteMany({ where: { routingHeader: { project: { projectNumber: { in: projectNumbers } } } } });
  await prisma.routingHeader.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.billOfMaterialItem.deleteMany({ where: { bomHeader: { project: { projectNumber: { in: projectNumbers } } } } });
  await prisma.billOfMaterialHeader.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.inspectionMeasurement.deleteMany({ where: { inspectionHeader: { project: { projectNumber: { in: projectNumbers } } } } });
  await prisma.inspectionHeader.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.ncrReport.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.invoiceItem.deleteMany({ where: { invoiceHeader: { project: { projectNumber: { in: projectNumbers } } } } });
  await prisma.invoiceHeader.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.dispatchItem.deleteMany({ where: { dispatchNote: { project: { projectNumber: { in: projectNumbers } } } } });
  await prisma.dispatchNote.deleteMany({ where: { project: { projectNumber: { in: projectNumbers } } } });
  await prisma.project.deleteMany({ where: { projectNumber: { in: projectNumbers } } });

  const stageOrder = [
    'CREATED',
    'ENGINEERING',
    'PROCUREMENT',
    'MATERIAL_AVAILABLE',
    'PRODUCTION',
    'INSPECTION',
    'DISPATCH_READY',
    'DISPATCHED',
    'INVOICED',
    'PAYMENT_PENDING',
    'CLOSED',
  ] as const;

  for (const def of demoProjects) {
    // Create the project
    const project = await prisma.project.create({
      data: {
        projectNumber: def.projectNumber,
        customerPoNumber: def.customerPoNumber,
        partName: def.partName,
        description: def.description,
        targetDeliveryDate: def.targetDeliveryDate,
        priority: def.priority,
        projectOwner: def.projectOwner,
        customerId: def.customerId,
        plantId: plant.id,
        currentStage: def.currentStage,
        progress: def.progress,
        closedAt: def.currentStage === 'CLOSED' ? daysAgo(44) : undefined,
        createdBy: 'SEED',
        updatedBy: 'SEED',
      },
    });

    // Create cost summary
    await prisma.projectCostSummary.create({
      data: {
        projectId: project.id,
        estimatedMaterialCost: def.cost.estimatedMaterialCost,
        actualMaterialCost: def.cost.actualMaterialCost,
        materialConsumptionCost: def.cost.materialConsumptionCost,
        machineCost: def.cost.machineCost,
        labourCost: def.cost.labourCost,
        outsideProcessCost: def.cost.outsideProcessCost,
        inspectionCost: def.cost.inspectionCost,
        packingCost: def.cost.packingCost,
        dispatchCost: def.cost.dispatchCost,
        totalCost: def.cost.totalCost,
        revenue: def.cost.revenue,
        profitability: def.cost.profitability,
        estimatedProjectCost: def.cost.estimatedProjectCost,
      },
    });

    // Build timeline entries for all stages up to the current stage
    const currentStageIdx = stageOrder.indexOf(def.currentStage as typeof stageOrder[number]);
    for (let i = 0; i <= currentStageIdx; i++) {
      const fromStage = i === 0 ? 'CREATED' : stageOrder[i - 1];
      const toStage = stageOrder[i];
      const transitionedAt = new Date(
        def.createdAt.getTime() + (i / (currentStageIdx || 1)) * (now.getTime() - def.createdAt.getTime())
      );

      await prisma.projectTimeline.create({
        data: {
          projectId: project.id,
          fromStage: fromStage as any,
          toStage: toStage as any,
          transitionedAt,
          transitionedBy: 'SEED',
          remarks: i === 0 ? 'Project initialized via Customer PO registration' : `Advanced to ${toStage}`,
        },
      });
    }

    // Create activity entries
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        action: 'PROJECT_CREATED',
        description: `Project ${def.projectNumber} registered with status CREATED`,
        performedBy: 'SEED',
        performedAt: def.createdAt,
      },
    });

    if (currentStageIdx >= 1) {
      await prisma.projectActivity.create({
        data: {
          projectId: project.id,
          action: 'STAGE_CHANGED',
          description: `Advanced to ${def.currentStage}`,
          performedBy: 'SEED',
          performedAt: daysAgo(1),
        },
      });
    }

    // --- TRANSACTIONAL SECTIONS ---

    // 2. BOM Section
    const bomHeader = await prisma.billOfMaterialHeader.create({
      data: {
        projectId: project.id,
        documentNumber: `BOM-${project.projectNumber}`,
        revision: 1,
        status: project.currentStage === 'ENGINEERING' ? 'PENDING_APPROVAL' : 'APPROVED',
        approvalStatus: project.currentStage === 'ENGINEERING' ? 'PENDING' : 'APPROVED',
        totalEstimatedCost: def.cost.estimatedMaterialCost,
        remarks: 'Released for procurement',
        createdBy: 'SEED',
        updatedBy: 'SEED',
      },
    });

    await prisma.billOfMaterialItem.create({
      data: {
        bomHeaderId: bomHeader.id,
        materialId: material.id,
        rawSize: '150x150x200mm',
        calculatedWeight: 12.5,
        requiredQty: 2,
        estimatedCost: def.cost.estimatedMaterialCost,
        remarks: 'Base plate raw material block',
        createdBy: 'SEED',
        updatedBy: 'SEED',
      },
    });

    // 3. Routing Section
    const routingHeader = await prisma.routingHeader.create({
      data: {
        projectId: project.id,
        documentNumber: `RT-${project.projectNumber}`,
        revision: 1,
        status: project.currentStage === 'ENGINEERING' ? 'PENDING_APPROVAL' : 'APPROVED',
        approvalStatus: project.currentStage === 'ENGINEERING' ? 'PENDING' : 'APPROVED',
        remarks: 'Standard routing plan',
        createdBy: 'SEED',
        updatedBy: 'SEED',
      },
    });

    const rtOpMilling = await prisma.routingOperation.create({
      data: {
        routingHeaderId: routingHeader.id,
        sequenceOrder: 10,
        operationId: operation.id,
        estimatedHours: 8.5,
        remarks: 'Setup and machine cavity',
        createdBy: 'SEED',
        updatedBy: 'SEED',
        status: ['CREATED', 'ENGINEERING', 'PROCUREMENT', 'MATERIAL_AVAILABLE'].includes(project.currentStage)
          ? 'PENDING'
          : project.currentStage === 'PRODUCTION'
            ? 'IN_PROGRESS'
            : 'COMPLETED',
        plannedMachineId: machine.id,
        remainingQuantity: 1,
      },
    });

    const rtOpInspect = await prisma.routingOperation.create({
      data: {
        routingHeaderId: routingHeader.id,
        sequenceOrder: 20,
        operationId: opInspect.id,
        estimatedHours: 2.0,
        remarks: 'Final dimensional and surface check',
        createdBy: 'SEED',
        updatedBy: 'SEED',
        status: ['CREATED', 'ENGINEERING', 'PROCUREMENT', 'MATERIAL_AVAILABLE', 'PRODUCTION'].includes(
          project.currentStage
        )
          ? 'PENDING'
          : project.currentStage === 'INSPECTION'
            ? 'IN_PROGRESS'
            : 'COMPLETED',
        plannedMachineId: machine.id,
        remainingQuantity: 1,
      },
    });

    // 4. Procurement Section (PO, GRN & Inventory Batch)
    if (currentStageIdx >= 2) {
      // Stage >= PROCUREMENT
      const poHeader = await prisma.purchaseOrderHeader.create({
        data: {
          projectId: project.id,
          vendorId: vendor.id,
          poNumber: `PO-${project.projectNumber}`,
          documentNumber: `PO-${project.projectNumber}`,
          revision: 1,
          totalAmount: def.cost.estimatedMaterialCost,
          expectedDeliveryDate: daysAgo(2),
          status: project.currentStage === 'PROCUREMENT' ? 'ISSUED' : 'CLOSED',
          approvalStatus: 'APPROVED',
          remarks: 'Material purchase for tool block',
          createdBy: 'SEED',
          updatedBy: 'SEED',
        },
      });

      const poItem = await prisma.purchaseOrderItem.create({
        data: {
          poHeaderId: poHeader.id,
          materialId: material.id,
          orderedQty: 2,
          agreedRate: def.cost.estimatedMaterialCost / 2,
          lineTotal: def.cost.estimatedMaterialCost,
          status: project.currentStage === 'PROCUREMENT' ? 'PENDING' : 'RECEIVED',
          receivedQty: project.currentStage === 'PROCUREMENT' ? 0 : 2,
          createdBy: 'SEED',
          updatedBy: 'SEED',
        },
      });

      // 5. Goods Receipt Note (GRN)
      if (currentStageIdx >= 3) {
        // Stage >= MATERIAL_AVAILABLE
        const grnHeader = await prisma.goodsReceiptHeader.create({
          data: {
            projectId: project.id,
            poHeaderId: poHeader.id,
            grnNumber: `GRN-${project.projectNumber}`,
            documentNumber: `GRN-${project.projectNumber}`,
            receiptDate: daysAgo(4),
            status: 'COMPLETED',
            remarks: 'Materials received in good condition',
            createdBy: 'SEED',
            updatedBy: 'SEED',
          },
        });

        const grnItem = await prisma.goodsReceiptItem.create({
          data: {
            grnHeaderId: grnHeader.id,
            poItemId: poItem.id,
            receivedQty: 2,
            acceptedQty: 2,
            rejectedQty: 0,
            heatNumber: `HT-${project.projectNumber}-99`,
            actualRate: def.cost.estimatedMaterialCost / 2,
            actualMaterialCost: def.cost.estimatedMaterialCost,
            remarks: 'Passed inspection',
            createdBy: 'SEED',
            updatedBy: 'SEED',
          },
        });

        // 6. Inventory Batch & Stock
        const invBatch = await prisma.inventoryBatch.create({
          data: {
            materialId: material.id,
            grnItemId: grnItem.id,
            batchNumber: `BATCH-${project.projectNumber}`,
            heatNumber: `HT-${project.projectNumber}-99`,
            locationId: location.id,
            receivedQty: 2,
            currentQty: project.currentStage === 'MATERIAL_AVAILABLE' ? 2 : 0,
            availableQty: project.currentStage === 'MATERIAL_AVAILABLE' ? 2 : 0,
            issuedQty: project.currentStage === 'MATERIAL_AVAILABLE' ? 0 : 2,
            unitCost: def.cost.estimatedMaterialCost / 2,
            status: project.currentStage === 'MATERIAL_AVAILABLE' ? 'AVAILABLE' : 'CONSUMED',
            createdBy: 'SEED',
          },
        });

        await prisma.inventoryStock.upsert({
          where: {
            materialId_warehouseId: {
              materialId: material.id,
              warehouseId: warehouse.id,
            },
          },
          update: {
            currentQuantity: { increment: project.currentStage === 'MATERIAL_AVAILABLE' ? 2 : 0 },
            availableQuantity: { increment: project.currentStage === 'MATERIAL_AVAILABLE' ? 2 : 0 },
          },
          create: {
            materialId: material.id,
            warehouseId: warehouse.id,
            currentQuantity: project.currentStage === 'MATERIAL_AVAILABLE' ? 2 : 0,
            availableQuantity: project.currentStage === 'MATERIAL_AVAILABLE' ? 2 : 0,
          },
        });

        // 7. Material Issue Slip
        if (currentStageIdx >= 4) {
          // Stage >= PRODUCTION
          const issueHeader = await prisma.materialIssueHeader.create({
            data: {
              projectId: project.id,
              issueNumber: `IS-${project.projectNumber}`,
              documentNumber: `IS-${project.projectNumber}`,
              issueDate: daysAgo(3),
              status: 'COMPLETED',
              remarks: 'Issued to VMC section',
              createdBy: 'SEED',
              updatedBy: 'SEED',
            },
          });

          await prisma.materialIssueItem.create({
            data: {
              issueHeaderId: issueHeader.id,
              inventoryBatchId: invBatch.id,
              issuedQty: 2,
              materialValue: def.cost.estimatedMaterialCost,
              remarks: 'For CNC milling stage',
              createdBy: 'SEED',
              updatedBy: 'SEED',
            },
          });

          await prisma.inventoryTransaction.create({
            data: {
              projectId: project.id,
              inventoryBatchId: invBatch.id,
              movementType: 'MATERIAL_ISSUE',
              quantity: 2,
              referenceDocType: 'MATERIAL_ISSUE',
              referenceDocId: issueHeader.id,
              remarks: 'Issued to VMC Shop',
              createdBy: 'SEED',
            },
          });

          // 8. Job Cards & Production Reports
          await prisma.jobCard.create({
            data: {
              projectId: project.id,
              routingOperationId: rtOpMilling.id,
              machineId: machine.id,
              status: ['PRODUCTION', 'INSPECTION'].includes(project.currentStage) ? 'IN_PROGRESS' : 'COMPLETED',
              priority: 'NORMAL',
              operatorId: employee.id,
              createdBy: 'SEED',
              updatedBy: 'SEED',
            },
          });

          if (project.currentStage !== 'PRODUCTION') {
            await prisma.machineShopDailyReport.create({
              data: {
                projectId: project.id,
                machineId: machine.id,
                employeeId: employee.id,
                reportDate: daysAgo(2),
                startTime: daysAgo(2),
                endTime: daysAgo(2),
                setupTime: 1.5,
                cuttingTime: 7.0,
                producedQty: 1,
                scrapQty: 0,
                remarks: 'Milling completed within tolerance',
                actualLabourHours: 8.5,
                actualMachineHours: 8.5,
                inventoryBatchId: invBatch.id,
                materialIssueId: issueHeader.id,
                routingOperationId: rtOpMilling.id,
                createdBy: 'SEED',
                updatedBy: 'SEED',
              },
            });
          }

          // 9. Quality & Inspection Section
          if (currentStageIdx >= 5) {
            // Stage >= INSPECTION
            const inspection = await prisma.inspectionHeader.create({
              data: {
                projectId: project.id,
                routingOperationId: rtOpInspect.id,
                inspectionNumber: `INSP-${project.projectNumber}`,
                documentNumber: `INSP-${project.projectNumber}`,
                inspectedQty: 1,
                passedQty: project.currentStage === 'INSPECTION' ? 0 : 1,
                reworkQty: project.currentStage === 'INSPECTION' ? 1 : 0,
                scrapQty: 0,
                result: project.currentStage === 'INSPECTION' ? 'REWORK' : 'PASS',
                status: 'COMPLETED',
                remarks:
                  project.currentStage === 'INSPECTION'
                    ? 'Minor burr found, sent for polishing'
                    : 'Passed final checks',
                inspectionType: 'FINAL_PDI',
                createdBy: 'SEED',
                updatedBy: 'SEED',
              },
            });

            await prisma.inspectionMeasurement.create({
              data: {
                inspectionHeaderId: inspection.id,
                inspectionStandardId: stdDimensional.id,
                nominalValue: 120.0,
                upperTolerance: 0.05,
                lowerTolerance: -0.05,
                actualValue: project.currentStage === 'INSPECTION' ? 120.07 : 120.01,
                result: project.currentStage === 'INSPECTION' ? 'REWORK' : 'PASS',
                remarks: 'Measurement checked on CMM',
                createdBy: 'SEED',
              },
            });

            if (project.currentStage === 'INSPECTION') {
              await prisma.ncrReport.create({
                data: {
                  projectId: project.id,
                  ncrNumber: `NCR-${project.projectNumber}`,
                  defectDescription: 'Bore dimension 120.07mm exceeded upper limit of 120.05mm',
                  rootCause: 'Tool wear during boring cycle',
                  status: 'OPEN',
                  remarks: 'Hold production. Tool replacement scheduled.',
                  createdBy: 'SEED',
                  updatedBy: 'SEED',
                },
              });
            }

            // 10. Dispatch Section
            if (currentStageIdx >= 7) {
              // Stage >= DISPATCHED
              const dispatch = await prisma.dispatchNote.create({
                data: {
                  projectId: project.id,
                  customerId: project.customerId,
                  dispatchNumber: `DP-${project.projectNumber}`,
                  documentNumber: `DP-${project.projectNumber}`,
                  dispatchDate: daysAgo(1),
                  dispatchQty: 1,
                  transporterName: 'SafeExpress Logistics',
                  vehicleNumber: 'MH-12-PQ-8877',
                  logisticsCost: 3500,
                  status: 'COMPLETED',
                  remarks: 'Packed in wooden crate with anti-rust oil applied',
                  createdBy: 'SEED',
                  updatedBy: 'SEED',
                },
              });

              await prisma.dispatchItem.create({
                data: {
                  dispatchNoteId: dispatch.id,
                  partDescription: def.partName,
                  quantity: 1,
                  remarks: 'CMM inspection reports attached',
                  createdBy: 'SEED',
                },
              });

              // 11. Invoice Section
              if (currentStageIdx >= 8) {
                // Stage >= INVOICED
                const invoice = await prisma.invoiceHeader.create({
                  data: {
                    projectId: project.id,
                    dispatchNoteId: dispatch.id,
                    invoiceNumber: `INV-${project.projectNumber}`,
                    documentNumber: `INV-${project.projectNumber}`,
                    invoiceDate: daysAgo(1),
                    subtotal: def.cost.revenue,
                    taxAmount: def.cost.revenue * 0.18,
                    totalAmount: def.cost.revenue * 1.18,
                    status: project.currentStage === 'CLOSED' ? 'PAID' : 'SENT',
                    paymentStatus: project.currentStage === 'CLOSED' ? 'PAID' : 'PENDING',
                    paidAt: project.currentStage === 'CLOSED' ? daysAgo(1) : undefined,
                    remarks: '18% GST Applied',
                    createdBy: 'SEED',
                    updatedBy: 'SEED',
                  },
                });

                await prisma.invoiceItem.create({
                  data: {
                    invoiceHeaderId: invoice.id,
                    description: def.partName,
                    quantity: 1,
                    rate: def.cost.revenue,
                    lineTotal: def.cost.revenue,
                    remarks: 'Tool room tooling charge',
                    createdBy: 'SEED',
                  },
                });
              }
            }
          }
        }
      }
    }

    console.log(`✅ Seeded Project: ${def.projectNumber} [${def.currentStage}] — ${def.partName}`);
  }

  // 21. Seed project tasks for active projects
  const engineeringProject = await prisma.project.findUnique({
    where: { projectNumber: 'PRJ-2025-001' },
  });
  if (engineeringProject) {
    await prisma.projectTask.createMany({
      data: [
        {
          projectId: engineeringProject.id,
          taskName: 'Create 3D CAD Model',
          description: 'Full 3D model in SolidWorks with tolerance stack analysis',
          startDate: daysAgo(3),
          endDate: daysFromNow(4),
          status: 'IN_PROGRESS',
          assignedTo: 'Alex Mercer',
          createdBy: 'SEED',
        },
        {
          projectId: engineeringProject.id,
          taskName: 'Generate Manufacturing Drawings',
          description: 'Detail drawings with GD&T callouts per ASME Y14.5',
          startDate: daysFromNow(4),
          endDate: daysFromNow(8),
          status: 'PENDING',
          assignedTo: 'Alex Mercer',
          createdBy: 'SEED',
        },
        {
          projectId: engineeringProject.id,
          taskName: 'Create Bill of Materials',
          description: 'Complete BOM with material specs and vendor recommendations',
          startDate: daysFromNow(5),
          endDate: daysFromNow(7),
          status: 'PENDING',
          assignedTo: 'Alex Mercer',
          createdBy: 'SEED',
        },
        {
          projectId: engineeringProject.id,
          taskName: 'Define Routing & Process Plan',
          description: 'Operation sequence, machine allocation, and cycle time estimates',
          startDate: daysFromNow(7),
          endDate: daysFromNow(10),
          status: 'PENDING',
          assignedTo: 'Alex Mercer',
          createdBy: 'SEED',
        },
      ],
    });
    console.log(`✅ Seeded Tasks for PRJ-2025-001`);
  }

  const productionProject = await prisma.project.findUnique({
    where: { projectNumber: 'PRJ-2025-003' },
  });
  if (productionProject) {
    await prisma.projectTask.createMany({
      data: [
        {
          projectId: productionProject.id,
          taskName: 'CNC Rough Machining',
          description: 'Rough machining of base plate and cavity on VMC',
          startDate: daysAgo(8),
          endDate: daysAgo(3),
          status: 'COMPLETED',
          assignedTo: 'Alex Mercer',
          createdBy: 'SEED',
        },
        {
          projectId: productionProject.id,
          taskName: 'CNC Finish Machining',
          description: 'Finish pass with 0.02mm stepover for surface quality',
          startDate: daysAgo(3),
          endDate: daysFromNow(2),
          status: 'IN_PROGRESS',
          assignedTo: 'Alex Mercer',
          createdBy: 'SEED',
        },
        {
          projectId: productionProject.id,
          taskName: 'Wire EDM Cutting',
          description: 'EDM cutting for sharp corners and intricate profiles',
          startDate: daysFromNow(2),
          endDate: daysFromNow(5),
          status: 'PENDING',
          assignedTo: 'Alex Mercer',
          createdBy: 'SEED',
        },
        {
          projectId: productionProject.id,
          taskName: 'Heat Treatment',
          description: 'Hardening to 58-60 HRC and stress relieving',
          startDate: daysFromNow(5),
          endDate: daysFromNow(8),
          status: 'PENDING',
          assignedTo: 'Alex Mercer',
          createdBy: 'SEED',
        },
      ],
    });
    console.log(`✅ Seeded Tasks for PRJ-2025-003`);
  }

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
