import { PrismaClient, VendorType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding with client data...');

  // 0. Seed Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
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
      currency: 'INR',
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

  // 5. Seed Customers (Real: SPX Flow Technology, Lely)
  const customerSPX = await prisma.customer.upsert({
    where: { customerCode: 'CU-SPX' },
    update: {},
    create: {
      customerCode: 'CU-SPX',
      companyName: 'SPX Flow Technology',
      gstNumber: '27SPXFT0001S1Z1',
      billingAddress: 'SPX Flow Technology, Pune, Maharashtra',
      shippingAddress: 'SPX Flow Technology, Pune, Maharashtra',
      contactPerson: 'SPX Procurement',
      contactPhone: '+912066001100',
      contactEmail: 'procurement@spxflow.com',
      paymentTerms: 'NET45',
      companyId: company.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Customer: ${customerSPX.companyName}`);

  const customerLely = await prisma.customer.upsert({
    where: { customerCode: 'CU-LELY' },
    update: {},
    create: {
      customerCode: 'CU-LELY',
      companyName: 'Lely Industries N.V.',
      gstNumber: '27LELYIND001L1Z1',
      billingAddress: 'Lely Industries, Maassluis, Netherlands',
      shippingAddress: 'Lely Industries, Maassluis, Netherlands',
      contactPerson: 'Lely Procurement',
      contactPhone: '+31105998888',
      contactEmail: 'procurement@lely.com',
      paymentTerms: 'NET60',
      companyId: company.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Seeded Customer: ${customerLely.companyName}`);

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

  // 7. Seed Material Shapes (actual shapes from client data)
  const shapeSheet = await prisma.materialShape.upsert({
    where: { shapeName: 'Sheet' },
    update: {},
    create: { shapeName: 'Sheet', status: 'ACTIVE' },
  });
  const shapeFlat = await prisma.materialShape.upsert({
    where: { shapeName: 'Flat' },
    update: {},
    create: { shapeName: 'Flat', status: 'ACTIVE' },
  });
  const shapeRoundBar = await prisma.materialShape.upsert({
    where: { shapeName: 'Round Bar' },
    update: {},
    create: { shapeName: 'Round Bar', status: 'ACTIVE' },
  });
  const shapeTube = await prisma.materialShape.upsert({
    where: { shapeName: 'Tube' },
    update: {},
    create: { shapeName: 'Tube', status: 'ACTIVE' },
  });
  const shapePipe = await prisma.materialShape.upsert({
    where: { shapeName: 'Pipe' },
    update: {},
    create: { shapeName: 'Pipe', status: 'ACTIVE' },
  });
  const shapePlate = await prisma.materialShape.upsert({
    where: { shapeName: 'Plate' },
    update: {},
    create: { shapeName: 'Plate', status: 'ACTIVE' },
  });
  const shapeBlock = await prisma.materialShape.upsert({
    where: { shapeName: 'Block' },
    update: {},
    create: { shapeName: 'Block', status: 'ACTIVE' },
  });
  console.log('✅ Seeded Material Shapes: Sheet, Flat, Round Bar, Tube, Pipe, Plate, Block');

  // 8. Seed Materials (actual grades from client Excel data)
  const matCRCA = await prisma.material.upsert({
    where: { materialCode: 'MAT-CRCA' },
    update: {},
    create: {
      materialCode: 'MAT-CRCA',
      materialGrade: 'CRCA',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 65,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeSheet.id,
      hsnCode: '7209',
      status: 'ACTIVE',
    },
  });

  const matMSFlat = await prisma.material.upsert({
    where: { materialCode: 'MAT-MS-FLAT' },
    update: {},
    create: {
      materialCode: 'MAT-MS-FLAT',
      materialGrade: 'MS FLAT',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 55,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeFlat.id,
      hsnCode: '7208',
      status: 'ACTIVE',
    },
  });

  const matMSSheet = await prisma.material.upsert({
    where: { materialCode: 'MAT-MS-SHEET' },
    update: {},
    create: {
      materialCode: 'MAT-MS-SHEET',
      materialGrade: 'MS SHEET',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 58,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeSheet.id,
      hsnCode: '7208',
      status: 'ACTIVE',
    },
  });

  const matHRPO = await prisma.material.upsert({
    where: { materialCode: 'MAT-HRPO' },
    update: {},
    create: {
      materialCode: 'MAT-HRPO',
      materialGrade: 'HRPO',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 60,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeSheet.id,
      hsnCode: '7208',
      status: 'ACTIVE',
    },
  });

  const matMSRound = await prisma.material.upsert({
    where: { materialCode: 'MAT-MS-ROUND' },
    update: {},
    create: {
      materialCode: 'MAT-MS-ROUND',
      materialGrade: 'MS ROUND',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 52,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeRoundBar.id,
      hsnCode: '7214',
      status: 'ACTIVE',
    },
  });

  const matALU = await prisma.material.upsert({
    where: { materialCode: 'MAT-ALU' },
    update: {},
    create: {
      materialCode: 'MAT-ALU',
      materialGrade: 'ALU',
      materialCategory: 'RAW_MATERIAL',
      density: 2.70,
      standardCost: 220,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeSheet.id,
      hsnCode: '7606',
      status: 'ACTIVE',
    },
  });

  const matRectTube = await prisma.material.upsert({
    where: { materialCode: 'MAT-RECT-TUBE' },
    update: {},
    create: {
      materialCode: 'MAT-RECT-TUBE',
      materialGrade: 'RECT TUBE',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 70,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeTube.id,
      hsnCode: '7306',
      status: 'ACTIVE',
    },
  });

  const matMSPipe = await prisma.material.upsert({
    where: { materialCode: 'MAT-MS-PIPE' },
    update: {},
    create: {
      materialCode: 'MAT-MS-PIPE',
      materialGrade: 'MS PIPE',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 62,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapePipe.id,
      hsnCode: '7306',
      status: 'ACTIVE',
    },
  });

  const matBOP = await prisma.material.upsert({
    where: { materialCode: 'MAT-BOP' },
    update: {},
    create: {
      materialCode: 'MAT-BOP',
      materialGrade: 'BOP',
      materialCategory: 'BOUGHT_OUT',
      density: 7.85,
      standardCost: 0,
      defaultUom: 'NOS',
      defaultVendor: 'Standard Parts Supplier',
      status: 'ACTIVE',
    },
  });

  const matSTD = await prisma.material.upsert({
    where: { materialCode: 'MAT-STD' },
    update: {},
    create: {
      materialCode: 'MAT-STD',
      materialGrade: 'STD',
      materialCategory: 'STANDARD_PART',
      density: 7.85,
      standardCost: 0,
      defaultUom: 'NOS',
      defaultVendor: 'Standard Parts Supplier',
      status: 'ACTIVE',
    },
  });

  // Special machined material codes from File 1
  const matID43OD80 = await prisma.material.upsert({
    where: { materialCode: 'MAT-ID43-OD80' },
    update: {},
    create: {
      materialCode: 'MAT-ID43-OD80',
      materialGrade: 'ID43 OD80+',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 205,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapePipe.id,
      status: 'ACTIVE',
    },
  });

  const matID78OD95 = await prisma.material.upsert({
    where: { materialCode: 'MAT-ID78-OD95' },
    update: {},
    create: {
      materialCode: 'MAT-ID78-OD95',
      materialGrade: 'ID 78 OD 95+',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 172,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapePipe.id,
      status: 'ACTIVE',
    },
  });

  const matID60OD80 = await prisma.material.upsert({
    where: { materialCode: 'MAT-ID60-OD80' },
    update: {},
    create: {
      materialCode: 'MAT-ID60-OD80',
      materialGrade: 'ID 60 OD 80+',
      materialCategory: 'RAW_MATERIAL',
      density: 7.85,
      standardCost: 132,
      defaultUom: 'KG',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapePipe.id,
      status: 'ACTIVE',
    },
  });

  const matMSBOP = await prisma.material.upsert({
    where: { materialCode: 'MAT-MS-BOP' },
    update: {},
    create: {
      materialCode: 'MAT-MS-BOP',
      materialGrade: 'MS (BOP)',
      materialCategory: 'BOUGHT_OUT',
      density: 7.85,
      standardCost: 0,
      defaultUom: 'NOS',
      defaultVendor: 'Standard Parts Supplier',
      status: 'ACTIVE',
    },
  });

  // SPX Assembly materials (generic for pump housing parts)
  const matSS304 = await prisma.material.upsert({
    where: { materialCode: 'MAT-SS304' },
    update: {},
    create: {
      materialCode: 'MAT-SS304',
      materialGrade: 'SS 304',
      materialCategory: 'RAW_MATERIAL',
      density: 8.0,
      standardCost: 250,
      defaultUom: 'NOS',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeBlock.id,
      hsnCode: '7304',
      status: 'ACTIVE',
    },
  });

  const matSS316 = await prisma.material.upsert({
    where: { materialCode: 'MAT-SS316' },
    update: {},
    create: {
      materialCode: 'MAT-SS316',
      materialGrade: 'SS 316',
      materialCategory: 'RAW_MATERIAL',
      density: 8.0,
      standardCost: 320,
      defaultUom: 'NOS',
      defaultVendor: 'Global Steel Suppliers Corp',
      shapeId: shapeBlock.id,
      hsnCode: '7304',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seeded Materials: CRCA, MS FLAT, MS SHEET, HRPO, MS ROUND, ALU, RECT TUBE, MS PIPE, BOP, STD, ID43OD80, ID78OD95, ID60OD80, MS(BOP), SS304, SS316');

  // Material lookup map for BOM seeding
  const materialMap: Record<string, string> = {
    'CRCA': matCRCA.id,
    'MS FLAT': matMSFlat.id,
    'MS SHEET': matMSSheet.id,
    'MS SHEET 1': matMSSheet.id,
    'MS SHEET 2': matMSSheet.id,
    'HRPO': matHRPO.id,
    'MS ROUND': matMSRound.id,
    'ALU': matALU.id,
    'RECT TUBE': matRectTube.id,
    'MS PIPE': matMSPipe.id,
    'BOP': matBOP.id,
    'STD': matSTD.id,
    'ID43 OD80+': matID43OD80.id,
    'ID 78 OD 95+': matID78OD95.id,
    'ID 60 OD 80+': matID60OD80.id,
    'MS (BOP)': matMSBOP.id,
  };

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

  // 14. Seed UOMs
  const uomKg = await prisma.uom.upsert({
    where: { uomCode: 'KG' },
    update: {},
    create: { uomCode: 'KG', uomName: 'Kilograms', status: 'ACTIVE' },
  });
  const uomEa = await prisma.uom.upsert({
    where: { uomCode: 'EA' },
    update: {},
    create: { uomCode: 'EA', uomName: 'Each', status: 'ACTIVE' },
  });
  console.log(`✅ Seeded UOMs: KG, EA`);

  // 15. Seed Document Types
  const dtDrawing = await prisma.documentType.upsert({
    where: { typeCode: 'DRAWING' },
    update: {},
    create: { typeCode: 'DRAWING', typeName: 'Engineering Drawing', status: 'ACTIVE' },
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

  // =====================================================================
  // FILE 1: MATERIAL WEIGHT / CUTTING SHEET — Hierarchical BOM
  // =====================================================================
  console.log('\n🏭 Seeding File 1: Material Weight/Cutting Sheet BOM...');

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  // BOM data from "New Microsoft Excel Worksheet(2).xlsx"
  // Each entry: [srNo, partCode, description, thickness, gradeSize, sheetWt, grossWt, netWt, scrapWt]
  // srNo = null means it's a child/sub-component of the previous parent part
  interface BomPartDef {
    srNo: number | null;
    partCode: string;
    description: string;
    thickness: string;
    gradeSize: string;
    sheetWtOrLength: number | null;
    stripSize: string | null;
    blanksPerSheet: number | null;
    grossWt: number | null;
    netWt: number | null;
    scrapWt: number | null;
  }

  const bomParts: BomPartDef[] = [
    { srNo: 1, partCode: 'I58700406', description: 'DUST COVER LAT. SIDE', thickness: '1.5', gradeSize: 'CRCA', sheetWtOrLength: 36.80, stripSize: '250', blanksPerSheet: 50, grossWt: 0.74, netWt: 0.45, scrapWt: 0.29 },
    { srNo: 2, partCode: 'M12700610', description: 'TRANSMISSION SKID', thickness: '12', gradeSize: 'MS FLAT', sheetWtOrLength: 36.74, stripSize: '660', blanksPerSheet: 9, grossWt: 4.08, netWt: 3.88, scrapWt: 0.20 },
    { srNo: null, partCode: 'M12700610-SUB1', description: 'TRANSMISSION SKID (MS SHEET 1)', thickness: '10', gradeSize: 'MS SHEET', sheetWtOrLength: 353.25, stripSize: 'LC', blanksPerSheet: 165, grossWt: 2.14, netWt: 1.39, scrapWt: 0.75 },
    { srNo: 3, partCode: 'M12700620', description: 'SKID EX', thickness: '12', gradeSize: 'MS FLAT', sheetWtOrLength: 36.74, stripSize: '660', blanksPerSheet: 9, grossWt: 4.08, netWt: 3.88, scrapWt: 0.20 },
    { srNo: null, partCode: 'M12700620-SUB1', description: 'SKID EX (MS SHEET 2)', thickness: '10', gradeSize: 'MS SHEET', sheetWtOrLength: 353.25, stripSize: 'LC', blanksPerSheet: 165, grossWt: 2.14, netWt: 1.39, scrapWt: 0.75 },
    { srNo: 4, partCode: 'I58700407', description: 'DUST COVER TRANS. SIDE', thickness: '4mm tube', gradeSize: 'MS SHEET', sheetWtOrLength: 1.30, stripSize: '260', blanksPerSheet: 36, grossWt: 1.30, netWt: 7.77, scrapWt: 1.02 },
    { srNo: 5, partCode: 'M12700650', description: 'UPPER REINF PLATE ZN', thickness: '2', gradeSize: 'CRCA', sheetWtOrLength: 49.06, stripSize: '260', blanksPerSheet: 36, grossWt: 1.36, netWt: 1.00, scrapWt: 0.36 },
    { srNo: 6, partCode: 'M48000628', description: 'PROTEC. SUPPORT', thickness: '2', gradeSize: 'HRPO', sheetWtOrLength: 49.06, stripSize: '260', blanksPerSheet: null, grossWt: null, netWt: null, scrapWt: 0.00 },
    { srNo: 7, partCode: 'I48700412', description: 'FRONT BRACKET ZN', thickness: '3', gradeSize: 'HRPO', sheetWtOrLength: 73.59, stripSize: '400', blanksPerSheet: 32, grossWt: 2.30, netWt: 1.72, scrapWt: 0.58 },
    { srNo: 8, partCode: 'I48700416', description: 'REAR BRACKET ZN', thickness: '3', gradeSize: 'HRPO', sheetWtOrLength: 73.59, stripSize: '400', blanksPerSheet: 32, grossWt: 2.30, netWt: 1.72, scrapWt: 0.58 },
    { srNo: 9, partCode: 'M66100778A', description: 'STANDING PLATE "L" ZN (VARIANT)', thickness: '2', gradeSize: 'HRPO', sheetWtOrLength: 49.06, stripSize: '35', blanksPerSheet: 852, grossWt: 0.06, netWt: 0.047, scrapWt: 0.01 },
    { srNo: 10, partCode: 'M48000628B', description: 'PROTECTION SUPPORT (MAIN)', thickness: '2', gradeSize: 'HRPO', sheetWtOrLength: 49.06, stripSize: null, blanksPerSheet: 52, grossWt: 0.94, netWt: null, scrapWt: 0.94 },
    { srNo: 11, partCode: 'M73108915A', description: 'COMP. PROT. SHAFT ZN', thickness: '0.8', gradeSize: 'CRCA', sheetWtOrLength: 19.63, stripSize: null, blanksPerSheet: null, grossWt: 1.20, netWt: 1.00, scrapWt: 0.20 },
    { srNo: 12, partCode: 'M41100215A', description: 'COMP. SHAFT PROTECTION L50', thickness: '0.8', gradeSize: 'CRCA', sheetWtOrLength: 19.60, stripSize: null, blanksPerSheet: null, grossWt: 1.50, netWt: null, scrapWt: null },
    { srNo: 13, partCode: 'T14002306', description: 'COMP. WHEEL SUPPORT (TYPE A)', thickness: '8', gradeSize: 'MS SHEET', sheetWtOrLength: 282.60, stripSize: null, blanksPerSheet: 165, grossWt: 1.71, netWt: 1.00, scrapWt: 0.71 },
    { srNo: null, partCode: 'T14002306-BUSH', description: 'BUSH (dia 25 rod)', thickness: 'dia 25', gradeSize: 'MS ROUND', sheetWtOrLength: 6000, stripSize: '220', blanksPerSheet: 27, grossWt: null, netWt: null, scrapWt: 0.00 },
    { srNo: 14, partCode: 'I48700415', description: 'SKID EX (VARIANT B)', thickness: '3', gradeSize: 'HRPO', sheetWtOrLength: 73.59, stripSize: '590', blanksPerSheet: 24, grossWt: 3.07, netWt: 2.80, scrapWt: 0.27 },
    { srNo: 15, partCode: 'T14002308', description: 'COMP. WHEEL SUPPORT', thickness: '8', gradeSize: 'MS SHEET', sheetWtOrLength: 282.60, stripSize: null, blanksPerSheet: 165, grossWt: 1.71, netWt: 1.00, scrapWt: 0.71 },
    { srNo: null, partCode: 'T14002308-ROD', description: 'COMP. WHEEL SUPPORT (dia 25 rod)', thickness: 'dia 25', gradeSize: 'MS ROUND', sheetWtOrLength: 6000, stripSize: '220', blanksPerSheet: 27, grossWt: null, netWt: null, scrapWt: 0.00 },
    { srNo: 16, partCode: 'I48700423', description: 'DUST COVER ZN', thickness: '2', gradeSize: 'HRPO', sheetWtOrLength: 49.06, stripSize: '95', blanksPerSheet: 819, grossWt: 0.06, netWt: 0.05, scrapWt: 0.01 },
    { srNo: 17, partCode: 'I48700423B', description: 'DUST COVER LAT. SIDE T=2', thickness: '2', gradeSize: 'CRCA', sheetWtOrLength: 49.06, stripSize: '260', blanksPerSheet: 36, grossWt: 1.36, netWt: 1.00, scrapWt: 0.36 },
    { srNo: 18, partCode: 'C14152338', description: 'WHEEL SUPPORT ASSEMBLY 150', thickness: 'tube 40*60', gradeSize: 'RECT TUBE', sheetWtOrLength: 35.00, stripSize: '1200', blanksPerSheet: 5, grossWt: 7.00, netWt: 6.80, scrapWt: 0.20 },
    { srNo: null, partCode: 'C14152338-BUSH', description: 'WHEEL SUPPORT 150 BUSH', thickness: 'bush', gradeSize: 'MS PIPE', sheetWtOrLength: 23.00, stripSize: '120', blanksPerSheet: 49, grossWt: 0.47, netWt: 0.40, scrapWt: 0.07 },
    { srNo: 19, partCode: 'M73108915', description: 'COMP.PROT. SHAFT L.T. ZN', thickness: '0.8', gradeSize: 'CRCA', sheetWtOrLength: 19.63, stripSize: null, blanksPerSheet: null, grossWt: 1.20, netWt: 1.00, scrapWt: 0.20 },
    { srNo: 20, partCode: 'M48000532', description: 'SKID ADJUSTER', thickness: '4', gradeSize: 'HRPO', sheetWtOrLength: 98.13, stripSize: '220', blanksPerSheet: 154, grossWt: 0.64, netWt: 0.48, scrapWt: 0.16 },
    { srNo: 21, partCode: 'C14182338', description: 'WHEEL SUPPORT ASSEMBLY 180', thickness: 'tube 40*60', gradeSize: 'RECT TUBE', sheetWtOrLength: 35.00, stripSize: '1300', blanksPerSheet: 4, grossWt: 8.75, netWt: 7.20, scrapWt: 1.55 },
    { srNo: null, partCode: 'C14182338-BUSH', description: 'WHEEL SUPPORT 180 BUSH', thickness: 'bush', gradeSize: 'MS ROUND', sheetWtOrLength: 23.00, stripSize: '120', blanksPerSheet: 49, grossWt: 0.47, netWt: 0.40, scrapWt: 0.07 },
    { srNo: 22, partCode: 'M66100778', description: 'STANDING PLATE "L" ZN', thickness: '2', gradeSize: 'HRPO', sheetWtOrLength: 49.06, stripSize: '35', blanksPerSheet: 852, grossWt: 0.06, netWt: 0.047, scrapWt: 0.01 },
    { srNo: 23, partCode: 'I48700711', description: 'FRONT STAND', thickness: '3', gradeSize: 'HRPO', sheetWtOrLength: 73.59, stripSize: '495', blanksPerSheet: 80, grossWt: 0.92, netWt: 0.69, scrapWt: 0.23 },
    { srNo: null, partCode: 'I48700711-BLANK', description: 'FRONT STAND 8mm blank', thickness: '8mm', gradeSize: 'BOP', sheetWtOrLength: null, stripSize: null, blanksPerSheet: null, grossWt: 0.24, netWt: 0.24, scrapWt: 0.00 },
    { srNo: 24, partCode: 'I45700315', description: 'WELD CARTER WITH BUSH', thickness: '3', gradeSize: 'HRPO', sheetWtOrLength: 73.59, stripSize: '800', blanksPerSheet: 6, grossWt: 12.27, netWt: 8.00, scrapWt: 4.27 },
    { srNo: null, partCode: 'I45700315-NUT', description: 'WELD CARTER NUT', thickness: 'nut', gradeSize: 'BOP', sheetWtOrLength: null, stripSize: null, blanksPerSheet: null, grossWt: 0.03, netWt: null, scrapWt: 0.03 },
    { srNo: null, partCode: 'I45700315-BOLT', description: 'WELD CARTER BOLT', thickness: 'bolt', gradeSize: 'BOP', sheetWtOrLength: null, stripSize: null, blanksPerSheet: null, grossWt: 0.05, netWt: null, scrapWt: 0.05 },
    { srNo: null, partCode: 'I45700315-WASH', description: 'WELD CARTER WASHER', thickness: 'washer', gradeSize: 'ALU', sheetWtOrLength: 13.13, stripSize: null, blanksPerSheet: null, grossWt: 0.005, netWt: null, scrapWt: 0.005 },
    { srNo: null, partCode: 'I45700315-FORG', description: 'WELD CARTER BUSH FORGING', thickness: 'bush forging', gradeSize: 'BOP', sheetWtOrLength: 1.10, stripSize: null, blanksPerSheet: null, grossWt: 1.10, netWt: 0.50, scrapWt: 0.60 },
    { srNo: null, partCode: 'I45700315-MC', description: 'WELD CARTER BUSH M/C', thickness: 'bush m/c', gradeSize: 'ID43 OD80+', sheetWtOrLength: 205.00, stripSize: '42', blanksPerSheet: 133, grossWt: 1.51, netWt: 0.62, scrapWt: 0.89 },
    { srNo: null, partCode: 'I45700315-M8', description: 'WELD CARTER M8 NUT', thickness: 'M8 nut', gradeSize: 'STD', sheetWtOrLength: null, stripSize: null, blanksPerSheet: null, grossWt: 0.005, netWt: null, scrapWt: 0.005 },
    { srNo: null, partCode: 'I45700315-8CBK', description: 'WELD CARTER 8 C BRACKET', thickness: '8 C Bkt', gradeSize: 'BOP', sheetWtOrLength: 196.00, stripSize: null, blanksPerSheet: null, grossWt: 0.30, netWt: 0.25, scrapWt: 0.05 },
    { srNo: 25, partCode: 'I45700224', description: 'SP CASING MODIFIED', thickness: '1 top', gradeSize: 'MS SHEET', sheetWtOrLength: 125.99, stripSize: null, blanksPerSheet: 1.67, grossWt: 125.99, netWt: 109.92, scrapWt: 16.07 },
    { srNo: null, partCode: 'I45700224-RING', description: 'SP CASING RING PLATE', thickness: '2 ring plate', gradeSize: 'MS SHEET', sheetWtOrLength: null, stripSize: null, blanksPerSheet: 0.95, grossWt: 0.00, netWt: 0.96, scrapWt: null },
    { srNo: null, partCode: 'I45700224-BIG', description: 'SP CASING BIG PLATE', thickness: '3 big plate', gradeSize: 'MS SHEET', sheetWtOrLength: null, stripSize: null, blanksPerSheet: 2.66, grossWt: 0.00, netWt: null, scrapWt: 0.00 },
    { srNo: null, partCode: 'I45700224-PATTI', description: 'SP CASING PATTI', thickness: '4 patti', gradeSize: 'MS SHEET', sheetWtOrLength: null, stripSize: null, blanksPerSheet: 1.59, grossWt: 0.00, netWt: null, scrapWt: 0.00 },
    { srNo: null, partCode: 'I45700224-BBUSH', description: 'SP CASING BIG BUSH', thickness: 'big bush', gradeSize: 'ID 78 OD 95+', sheetWtOrLength: 172.00, stripSize: '27', blanksPerSheet: 222, grossWt: 0.77, netWt: 0.35, scrapWt: 0.42 },
    { srNo: null, partCode: 'I45700224-SB62', description: 'SP CASING SMALL BUSH 62', thickness: 'small bush62', gradeSize: 'ID 60 OD 80+', sheetWtOrLength: 132.00, stripSize: '27', blanksPerSheet: 222, grossWt: 0.61, netWt: 0.24, scrapWt: 0.37 },
    { srNo: null, partCode: 'I45700224-SB68', description: 'SP CASING SMALL BUSH 68', thickness: 'small bush68', gradeSize: 'ID 60 OD 80+', sheetWtOrLength: 132.00, stripSize: '27', blanksPerSheet: 222, grossWt: 0.61, netWt: 0.24, scrapWt: 0.37 },
    { srNo: null, partCode: 'I45700224-LBKT', description: 'SP CASING 6mm L BRACKET', thickness: '6 mm L bkt', gradeSize: 'MS SHEET', sheetWtOrLength: 150.00, stripSize: null, blanksPerSheet: null, grossWt: 0.20, netWt: 0.16, scrapWt: 0.04 },
    { srNo: 26, partCode: 'M74100126', description: 'COMP. PROTECTION SUPPORT', thickness: '2', gradeSize: 'HRPO', sheetWtOrLength: 49.06, stripSize: null, blanksPerSheet: 52, grossWt: 0.94, netWt: null, scrapWt: 0.94 },
    { srNo: 27, partCode: 'M41100709', description: 'COMP. FRONT HITCH RH', thickness: '16', gradeSize: 'MS (BOP)', sheetWtOrLength: 2.70, stripSize: null, blanksPerSheet: null, grossWt: null, netWt: null, scrapWt: 0.00 },
    { srNo: null, partCode: 'M41100709-FLAT', description: 'COMP. FRONT HITCH RH (FLAT)', thickness: '10', gradeSize: 'MS FLAT', sheetWtOrLength: 1.00, stripSize: null, blanksPerSheet: null, grossWt: null, netWt: null, scrapWt: 0.00 },
    { srNo: 28, partCode: 'M41100710', description: 'COMP. FRONT HITCH LH', thickness: '16', gradeSize: 'MS (BOP)', sheetWtOrLength: 2.70, stripSize: null, blanksPerSheet: null, grossWt: null, netWt: null, scrapWt: 0.00 },
    { srNo: null, partCode: 'M41100710-FLAT', description: 'COMP. FRONT HITCH LH (FLAT)', thickness: '10', gradeSize: 'MS FLAT', sheetWtOrLength: 1.00, stripSize: null, blanksPerSheet: null, grossWt: null, netWt: null, scrapWt: 0.00 },
    { srNo: 29, partCode: 'M41100215', description: 'COMP. SHAFT PROTECTION L125', thickness: '0.8', gradeSize: 'CRCA', sheetWtOrLength: 19.60, stripSize: null, blanksPerSheet: null, grossWt: 1.50, netWt: null, scrapWt: null },
  ];

  // Create Project for File 1 data
  const projectCutting = await prisma.project.create({
    data: {
      projectNumber: 'KTD-1',
      customerPoNumber: 'PO/SPX/2025/CUT-001',
      partName: 'Material Weight & Cutting Sheet Components',
      description: 'Client material nesting/cutting sheet for 29 component types with weight calculations, blank layout, and scrap tracking.',
      targetDeliveryDate: daysFromNow(30),
      priority: 'HIGH',
      projectOwner: 'Alex Mercer',
      customerId: customerSPX.id,
      plantId: plant.id,
      currentStage: 'ENGINEERING',
      progress: 20,
      createdBy: 'SEED',
      updatedBy: 'SEED',
    },
  });

  // Cost summary for cutting sheet project
  await prisma.projectCostSummary.create({
    data: {
      projectId: projectCutting.id,
      estimatedMaterialCost: 85000,
      actualMaterialCost: 0,
      materialConsumptionCost: 0,
      machineCost: 0,
      labourCost: 0,
      outsideProcessCost: 0,
      inspectionCost: 0,
      packingCost: 0,
      dispatchCost: 0,
      totalCost: 0,
      revenue: 350000,
      profitability: 0,
      estimatedProjectCost: 200000,
    },
  });

  // Timeline entry
  await prisma.projectTimeline.create({
    data: {
      projectId: projectCutting.id,
      fromStage: 'CREATED',
      toStage: 'CREATED',
      transitionedAt: daysAgo(5),
      transitionedBy: 'SEED',
      remarks: 'Project initialized via Customer PO registration',
    },
  });
  await prisma.projectTimeline.create({
    data: {
      projectId: projectCutting.id,
      fromStage: 'CREATED',
      toStage: 'ENGINEERING',
      transitionedAt: daysAgo(3),
      transitionedBy: 'SEED',
      remarks: 'Advanced to ENGINEERING',
    },
  });

  await prisma.projectActivity.create({
    data: {
      projectId: projectCutting.id,
      action: 'PROJECT_CREATED',
      description: 'Project KTD-1 registered — Material Weight/Cutting Sheet',
      performedBy: 'SEED',
      performedAt: daysAgo(5),
    },
  });

  // Create BOM Header for File 1
  const bomHeaderCutting = await prisma.billOfMaterialHeader.create({
    data: {
      projectId: projectCutting.id,
      documentNumber: 'BOM-KTD-1',
      revision: 1,
      status: 'PENDING_APPROVAL',
      approvalStatus: 'PENDING',
      totalEstimatedCost: 85000,
      remarks: 'Material weight/cutting sheet — 29 parent parts with sub-components',
      createdBy: 'SEED',
      updatedBy: 'SEED',
    },
  });

  // Seed BOM items with parent-child hierarchy
  let lastParentItemId: string | null = null;

  for (const part of bomParts) {
    const materialId = materialMap[part.gradeSize] || matBOP.id;

    const parentItemIdValue: string | undefined = part.srNo === null && lastParentItemId ? lastParentItemId : undefined;
    const createdItem: { id: string } = await prisma.billOfMaterialItem.create({
      data: {
        bomHeaderId: bomHeaderCutting.id,
        materialId: materialId,
        rawSize: part.thickness,
        dimensions: part.stripSize ? `Strip: ${part.stripSize}mm` : undefined,
        calculatedWeight: part.grossWt ?? undefined,
        requiredQty: part.blanksPerSheet ?? 1,
        estimatedCost: (part.grossWt ?? 0) * 60,
        remarks: `${part.partCode} — ${part.description}`,
        createdBy: 'SEED',
        updatedBy: 'SEED',
        parentItemId: parentItemIdValue,
        customFields: {
          partCode: part.partCode,
          description: part.description,
          sheetWtOrLength: part.sheetWtOrLength,
          netWt: part.netWt,
          scrapWt: part.scrapWt,
          blanksPerSheet: part.blanksPerSheet,
        },
      },
    });

    if (part.srNo !== null) {
      lastParentItemId = createdItem.id;
    }
  }
  console.log(`✅ Seeded BOM for KTD-1: ${bomParts.length} items (29 parent + sub-components)`);

  // Routing for cutting sheet project
  const routingCutting = await prisma.routingHeader.create({
    data: {
      projectId: projectCutting.id,
      documentNumber: 'RT-KTD-1',
      revision: 1,
      status: 'PENDING_APPROVAL',
      approvalStatus: 'PENDING',
      remarks: 'Standard routing plan',
      createdBy: 'SEED',
      updatedBy: 'SEED',
    },
  });

  await prisma.routingOperation.create({
    data: {
      routingHeaderId: routingCutting.id,
      sequenceOrder: 10,
      operationId: operation.id,
      estimatedHours: 24,
      remarks: 'Sheet metal cutting and blanking operations',
      createdBy: 'SEED',
      updatedBy: 'SEED',
      status: 'PENDING',
      plannedMachineId: machine.id,
      remainingQuantity: 29,
    },
  });

  await prisma.routingOperation.create({
    data: {
      routingHeaderId: routingCutting.id,
      sequenceOrder: 20,
      operationId: opInspect.id,
      estimatedHours: 4,
      remarks: 'Quality inspection for cut blanks',
      createdBy: 'SEED',
      updatedBy: 'SEED',
      status: 'PENDING',
      plannedMachineId: machine.id,
      remainingQuantity: 29,
    },
  });

  console.log(`✅ Seeded Project KTD-1 [ENGINEERING] — Material Weight/Cutting Sheet`);

  // =====================================================================
  // FILE 2: SPX BOM — Assembly Projects
  // =====================================================================
  console.log('\n🏭 Seeding File 2: SPX Assembly BOM...');

  interface AssemblyDef {
    srNo: number;
    assemblyDescription: string;
    childParts: { partNo: string; partName: string; quantity: number; uom: string }[];
  }

  const spxAssemblies: AssemblyDef[] = [
    {
      srNo: 1,
      assemblyDescription: 'L851170 — W+10/8 Pumphouse Special For Lely',
      childParts: [
        { partNo: '851147', partName: 'Pump Body Lely Pressing', quantity: 1, uom: 'EA' },
        { partNo: '274305', partName: 'Outlet Pressing & Machined', quantity: 1, uom: 'EA' },
        { partNo: '851160', partName: 'DIN11864-3-A1" Short For Lely', quantity: 1, uom: 'EA' },
        { partNo: '851161', partName: 'DIN11864-3-A1.5" Short For Lely', quantity: 1, uom: 'EA' },
        { partNo: 'TUBE-38.1', partName: 'Tube-Ø38.1x1.65x190.5 mm', quantity: 1, uom: 'EA' },
      ],
    },
    {
      srNo: 2,
      assemblyDescription: 'L188735 — Backplat/Extension Frame Complete',
      childParts: [
        { partNo: '274535', partName: 'Plate f.welded, ext. frame Raw Component', quantity: 1, uom: 'EA' },
        { partNo: '274041', partName: 'Plate f.welded, ext. frame Raw Component', quantity: 1, uom: 'EA' },
        { partNo: '274536', partName: 'Plate f.welded, ext. frame Raw Component', quantity: 1, uom: 'EA' },
        { partNo: '267362', partName: 'Backplate', quantity: 1, uom: 'EA' },
      ],
    },
    {
      srNo: 3,
      assemblyDescription: 'WA2B2C1XC1 — W+22/20 PUMP HSG CONN 2"x2" (SMS 1145)',
      childParts: [
        { partNo: '253661', partName: 'Pump Body Pressing W+22/20', quantity: 1, uom: 'EA' },
        { partNo: '256157', partName: 'Outlet for Pump Housing W+22/20', quantity: 1, uom: 'EA' },
        { partNo: 'WPSMSUNION2IN', partName: 'Inlet/Outlet Connection', quantity: 2, uom: 'EA' },
      ],
    },
    {
      srNo: 4,
      assemblyDescription: 'WA5B2C2XD1 — W+35/35 PUMP HSG CONN 2.5"x2" (SMS 1145)',
      childParts: [
        { partNo: '253645', partName: 'Pump Body Pressing W+35/35', quantity: 1, uom: 'EA' },
        { partNo: '267590', partName: 'Outlet for Pump Housing W+35/35', quantity: 1, uom: 'EA' },
        { partNo: 'WPSMSUNION2_5IN', partName: 'Inlet Connection', quantity: 1, uom: 'EA' },
        { partNo: 'WPSMSUNION2IN', partName: 'Outlet Connection', quantity: 1, uom: 'EA' },
      ],
    },
    {
      srNo: 5,
      assemblyDescription: 'L901004 — PUMP HOUSING EFC 22/20 (Fab. + Mach.)',
      childParts: [
        { partNo: 'L901000', partName: 'Pump Housing EFC 22/20 Pressing', quantity: 1, uom: 'EA' },
        { partNo: '256157', partName: 'Outlet for Pump Housing W+22/20', quantity: 1, uom: 'EA' },
      ],
    },
    {
      srNo: 6,
      assemblyDescription: 'L901005 — PUMP HOUSING EFC 35/35 (Fab. + Mach.)',
      childParts: [
        { partNo: 'L901001', partName: 'Pump Housing EFC 35/35 Pressing', quantity: 1, uom: 'EA' },
        { partNo: '267590', partName: 'Outlet for Pump Housing W+35/35', quantity: 1, uom: 'EA' },
      ],
    },
    {
      srNo: 7,
      assemblyDescription: 'L901006 — PUMP HOUSING EFC 35/55 (Fab. + Mach.)',
      childParts: [
        { partNo: 'L901002', partName: 'Pump Housing EFC 35/55 Pressing', quantity: 1, uom: 'EA' },
        { partNo: '260400', partName: 'Outlet for Pump Housing W+35/55', quantity: 1, uom: 'EA' },
      ],
    },
    {
      srNo: 8,
      assemblyDescription: 'L901007 — PUMP HOUSING EFC 55/35 (Fab. + Mach.)',
      childParts: [
        { partNo: 'L901003', partName: 'Pump Housing EFC 55/35 Pressing', quantity: 1, uom: 'EA' },
        { partNo: '267591', partName: 'Outlet for Pump Housing W+55/35', quantity: 1, uom: 'EA' },
        { partNo: '260001', partName: 'Connector', quantity: 1, uom: 'EA' },
      ],
    },
    {
      srNo: 9,
      assemblyDescription: 'L901062 — ASTRA 22/20 CASING WITH SMS 1145 CONNECT',
      childParts: [
        { partNo: 'L901000', partName: 'Pump Housing EFC 22/20 Pressing', quantity: 1, uom: 'EA' },
        { partNo: '256157', partName: 'Outlet for Pump Housing W+22/20', quantity: 1, uom: 'EA' },
        { partNo: 'WPSMSUNION2IN', partName: 'Inlet/Outlet Connection', quantity: 2, uom: 'EA' },
      ],
    },
    {
      srNo: 10,
      assemblyDescription: 'L901063 — ASTRA 35/35 CASING WITH SMS 1145 CONNECT',
      childParts: [
        { partNo: 'L901001', partName: 'Pump Housing EFC 35/35 Pressing', quantity: 1, uom: 'EA' },
        { partNo: '267590', partName: 'Outlet for Pump Housing W+35/35', quantity: 1, uom: 'EA' },
        { partNo: 'WPSMSUNION2_5IN', partName: 'Inlet Connection', quantity: 1, uom: 'EA' },
        { partNo: 'WPSMSUNION2IN', partName: 'Outlet Connection', quantity: 1, uom: 'EA' },
      ],
    },
    {
      srNo: 11,
      assemblyDescription: 'L901062 — ASTRA 35/55 CASING WITH SMS 1145 CONNECT',
      childParts: [
        { partNo: 'L901002', partName: 'Pump Housing EFC 35/55 Pressing', quantity: 1, uom: 'EA' },
        { partNo: '260400', partName: 'Outlet for Pump Housing W+35/55', quantity: 1, uom: 'EA' },
        { partNo: 'WPSMSUNION3IN', partName: 'Inlet Connection', quantity: 1, uom: 'EA' },
        { partNo: 'WPSMSUNION2_5IN', partName: 'Outlet Connection', quantity: 1, uom: 'EA' },
      ],
    },
    {
      srNo: 12,
      assemblyDescription: 'L901062 — ASTRA 55/35 CASING WITH SMS 1145 CONNECT',
      childParts: [
        { partNo: 'L901003', partName: 'Pump Housing EFC 55/35 Pressing', quantity: 1, uom: 'EA' },
        { partNo: '267591', partName: 'Outlet for Pump Housing W+55/35', quantity: 1, uom: 'EA' },
        { partNo: '260001', partName: 'Connector', quantity: 1, uom: 'EA' },
        { partNo: 'WPSMSUNION2_5IN', partName: 'Inlet Connection', quantity: 1, uom: 'EA' },
        { partNo: 'WPSMSUNION1_5IN', partName: 'Outlet Connection', quantity: 1, uom: 'EA' },
      ],
    },
  ];

  // Create master project for SPX BOM
  const projectSPX = await prisma.project.create({
    data: {
      projectNumber: 'KTD-2',
      customerPoNumber: 'PO/SPX/2025/BOM-001',
      partName: 'SPX Pump Housing Assembly Line',
      description: 'SPX Flow Technology pump housing assemblies — 12 assembly types with 41 total child components. Includes EFC and ASTRA series casings.',
      targetDeliveryDate: daysFromNow(45),
      priority: 'HIGH',
      projectOwner: 'Alex Mercer',
      customerId: customerSPX.id,
      plantId: plant.id,
      currentStage: 'PROCUREMENT',
      progress: 30,
      createdBy: 'SEED',
      updatedBy: 'SEED',
    },
  });

  await prisma.projectCostSummary.create({
    data: {
      projectId: projectSPX.id,
      estimatedMaterialCost: 120000,
      actualMaterialCost: 78000,
      materialConsumptionCost: 0,
      machineCost: 0,
      labourCost: 0,
      outsideProcessCost: 15000,
      inspectionCost: 0,
      packingCost: 0,
      dispatchCost: 0,
      totalCost: 93000,
      revenue: 480000,
      profitability: 0,
      estimatedProjectCost: 280000,
    },
  });

  // Timeline entries for SPX project
  await prisma.projectTimeline.create({
    data: {
      projectId: projectSPX.id,
      fromStage: 'CREATED',
      toStage: 'CREATED',
      transitionedAt: daysAgo(18),
      transitionedBy: 'SEED',
      remarks: 'Project initialized via SPX PO registration',
    },
  });
  await prisma.projectTimeline.create({
    data: {
      projectId: projectSPX.id,
      fromStage: 'CREATED',
      toStage: 'ENGINEERING',
      transitionedAt: daysAgo(14),
      transitionedBy: 'SEED',
      remarks: 'Advanced to ENGINEERING',
    },
  });
  await prisma.projectTimeline.create({
    data: {
      projectId: projectSPX.id,
      fromStage: 'ENGINEERING',
      toStage: 'PROCUREMENT',
      transitionedAt: daysAgo(7),
      transitionedBy: 'SEED',
      remarks: 'Advanced to PROCUREMENT',
    },
  });

  await prisma.projectActivity.create({
    data: {
      projectId: projectSPX.id,
      action: 'PROJECT_CREATED',
      description: 'Project KTD-2 registered — SPX Pump Housing Assembly Line',
      performedBy: 'SEED',
      performedAt: daysAgo(18),
    },
  });
  await prisma.projectActivity.create({
    data: {
      projectId: projectSPX.id,
      action: 'STAGE_CHANGED',
      description: 'Advanced to PROCUREMENT',
      performedBy: 'SEED',
      performedAt: daysAgo(7),
    },
  });

  // BOM Header for SPX project
  const bomHeaderSPX = await prisma.billOfMaterialHeader.create({
    data: {
      projectId: projectSPX.id,
      documentNumber: 'BOM-KTD-2',
      revision: 1,
      status: 'APPROVED',
      approvalStatus: 'APPROVED',
      totalEstimatedCost: 120000,
      remarks: 'SPX BOM — 12 assemblies with 41 child components',
      createdBy: 'SEED',
      updatedBy: 'SEED',
    },
  });

  // Create BOM Items + Assembly structures for each SPX assembly
  for (const assembly of spxAssemblies) {
    // Create Assembly Header
    const assemblyHeader = await prisma.assemblyHeader.create({
      data: {
        projectId: projectSPX.id,
        assemblyNumber: `ASSY-SPX-${String(assembly.srNo).padStart(3, '0')}`,
        assemblyName: assembly.assemblyDescription,
        status: 'DRAFT',
      },
    });

    // Create child parts as BOM items and Assembly components
    for (const child of assembly.childParts) {
      // Create or find a material for each unique child part
      const childMaterialCode = `SPX-${child.partNo}`;
      let childMaterial;
      try {
        childMaterial = await prisma.material.upsert({
          where: { materialCode: childMaterialCode },
          update: {},
          create: {
            materialCode: childMaterialCode,
            materialGrade: `SPX Component — ${child.partName}`,
            materialCategory: 'SEMI_FINISHED',
            density: 8.0,
            standardCost: 0,
            defaultUom: child.uom,
            status: 'ACTIVE',
          },
        });
      } catch {
        childMaterial = await prisma.material.findUnique({ where: { materialCode: childMaterialCode } });
        if (!childMaterial) throw new Error(`Failed to create material ${childMaterialCode}`);
      }

      // BOM Item
      await prisma.billOfMaterialItem.create({
        data: {
          bomHeaderId: bomHeaderSPX.id,
          materialId: childMaterial.id,
          requiredQty: child.quantity,
          remarks: `Assembly ${assembly.srNo}: ${child.partName}`,
          createdBy: 'SEED',
          updatedBy: 'SEED',
          customFields: {
            assemblyNumber: `ASSY-SPX-${String(assembly.srNo).padStart(3, '0')}`,
            assemblyDescription: assembly.assemblyDescription,
            childPartNo: child.partNo,
            childPartName: child.partName,
          },
        },
      });

      // Assembly Component
      await prisma.assemblyComponent.create({
        data: {
          assemblyHeaderId: assemblyHeader.id,
          materialId: childMaterial.id,
          quantity: child.quantity,
        },
      });
    }
  }

  console.log(`✅ Seeded SPX Assembly BOM: 12 assemblies with 41 child components`);

  // Routing for SPX project
  const routingSPX = await prisma.routingHeader.create({
    data: {
      projectId: projectSPX.id,
      documentNumber: 'RT-KTD-2',
      revision: 1,
      status: 'APPROVED',
      approvalStatus: 'APPROVED',
      remarks: 'Pump housing fabrication and machining routing',
      createdBy: 'SEED',
      updatedBy: 'SEED',
    },
  });

  await prisma.routingOperation.create({
    data: {
      routingHeaderId: routingSPX.id,
      sequenceOrder: 10,
      operationId: operation.id,
      estimatedHours: 48,
      remarks: 'Pump housing fabrication and CNC machining',
      createdBy: 'SEED',
      updatedBy: 'SEED',
      status: 'PENDING',
      plannedMachineId: machine.id,
      remainingQuantity: 12,
    },
  });

  await prisma.routingOperation.create({
    data: {
      routingHeaderId: routingSPX.id,
      sequenceOrder: 20,
      operationId: opInspect.id,
      estimatedHours: 8,
      remarks: 'Dimensional and surface quality inspection',
      createdBy: 'SEED',
      updatedBy: 'SEED',
      status: 'PENDING',
      plannedMachineId: machine.id,
      remainingQuantity: 12,
    },
  });

  // PO for SPX project (stage >= PROCUREMENT)
  const poHeaderSPX = await prisma.purchaseOrderHeader.create({
    data: {
      projectId: projectSPX.id,
      vendorId: vendor.id,
      poNumber: 'PO-KTD-2',
      documentNumber: 'PO-KTD-2',
      revision: 1,
      totalAmount: 120000,
      expectedDeliveryDate: daysFromNow(14),
      status: 'ISSUED',
      approvalStatus: 'APPROVED',
      remarks: 'Material purchase for SPX pump housing assemblies',
      createdBy: 'SEED',
      updatedBy: 'SEED',
    },
  });

  await prisma.purchaseOrderItem.create({
    data: {
      poHeaderId: poHeaderSPX.id,
      materialId: matSS304.id,
      orderedQty: 12,
      agreedRate: 10000,
      lineTotal: 120000,
      status: 'PENDING',
      receivedQty: 0,
      createdBy: 'SEED',
      updatedBy: 'SEED',
    },
  });

  console.log(`✅ Seeded Project KTD-2 [PROCUREMENT] — SPX Pump Housing Assembly Line`);

  // =====================================================================
  // LELY PUMPHOUSE PROJECT (Assembly 1 from SPX BOM — dedicated project)
  // =====================================================================
  const projectLely = await prisma.project.create({
    data: {
      projectNumber: 'KTD-3',
      customerPoNumber: 'PO/LELY/2025/PH-001',
      partName: 'W+10/8 Pumphouse Special For Lely',
      description: 'Dedicated Lely pumphouse assembly — L851170 series. Fabrication + Machining + Assembly.',
      targetDeliveryDate: daysFromNow(60),
      priority: 'NORMAL',
      projectOwner: 'Alex Mercer',
      customerId: customerLely.id,
      plantId: plant.id,
      currentStage: 'CREATED',
      progress: 5,
      createdBy: 'SEED',
      updatedBy: 'SEED',
    },
  });

  await prisma.projectCostSummary.create({
    data: {
      projectId: projectLely.id,
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
      estimatedProjectCost: 110000,
    },
  });

  await prisma.projectTimeline.create({
    data: {
      projectId: projectLely.id,
      fromStage: 'CREATED',
      toStage: 'CREATED',
      transitionedAt: daysAgo(2),
      transitionedBy: 'SEED',
      remarks: 'Project initialized via Lely PO registration',
    },
  });

  await prisma.projectActivity.create({
    data: {
      projectId: projectLely.id,
      action: 'PROJECT_CREATED',
      description: 'Project KTD-3 registered — Lely Pumphouse',
      performedBy: 'SEED',
      performedAt: daysAgo(2),
    },
  });

  console.log(`✅ Seeded Project KTD-3 [CREATED] — Lely Pumphouse`);

  // =====================================================================
  // GLOBAL ASSETS & TOOL MANAGEMENT (kept from original)
  // =====================================================================
  console.log('\n🌱 Seeding Global Asset Management...');

  const catCutting = await prisma.globalAssetCategory.upsert({
    where: { categoryCode: 'CAT-CUT' },
    update: {},
    create: { categoryCode: 'CAT-CUT', name: 'Cutting Tools', description: 'End mills, drills, inserts, taps, reamers' },
  });

  const catMeasuring = await prisma.globalAssetCategory.upsert({
    where: { categoryCode: 'CAT-MEAS' },
    update: {},
    create: { categoryCode: 'CAT-MEAS', name: 'Measuring Instruments', description: 'Calipers, micrometers, bore gauges, height gauges' },
  });

  const catPower = await prisma.globalAssetCategory.upsert({
    where: { categoryCode: 'CAT-PWR' },
    update: {},
    create: { categoryCode: 'CAT-PWR', name: 'Power Tools', description: 'Pneumatic wrenches, grinders, cordless drills' },
  });

  const catIT = await prisma.globalAssetCategory.upsert({
    where: { categoryCode: 'CAT-IT' },
    update: {},
    create: { categoryCode: 'CAT-IT', name: 'Laptops & IT Hardware', description: 'Engineering laptops, workstations, monitors' },
  });

  const catFix = await prisma.globalAssetCategory.upsert({
    where: { categoryCode: 'CAT-FIX' },
    update: {},
    create: { categoryCode: 'CAT-FIX', name: 'Fixtures & Jigs', description: 'Universal clamping fixtures, modular tooling plates' },
  });

  const locToolCrib = await prisma.globalAssetLocation.upsert({
    where: { locationCode: 'LOC-TCA1' },
    update: {},
    create: { locationCode: 'LOC-TCA1', locationName: 'Tool Crib Alpha', building: 'Building 1', room: 'Room 102', rackBin: 'Rack A-1' },
  });

  const locQALab = await prisma.globalAssetLocation.upsert({
    where: { locationCode: 'LOC-QALAB' },
    update: {},
    create: { locationCode: 'LOC-QALAB', locationName: 'QA Calibration Lab', building: 'Building 1', room: 'Room 201', rackBin: 'Cabinet B-3' },
  });

  const locITStore = await prisma.globalAssetLocation.upsert({
    where: { locationCode: 'LOC-ITSTORE' },
    update: {},
    create: { locationCode: 'LOC-ITSTORE', locationName: 'IT Asset Locker', building: 'Main Office', room: 'Room 304', rackBin: 'Shelf C-1' },
  });

  const asset1 = await prisma.globalAsset.upsert({
    where: { assetId: 'AST-10001' },
    update: {},
    create: {
      assetId: 'AST-10001',
      assetCode: 'VC-300-DIG',
      name: 'Digital Vernier Caliper 300mm',
      categoryId: catMeasuring.id,
      locationId: locQALab.id,
      brand: 'Mitutoyo',
      model: '500-196-30',
      serialNumber: 'MT-884920',
      partNumber: 'MIT-500-196',
      description: 'High precision IP67 waterproof digital caliper with SPC data output',
      quantity: 10,
      availableQty: 8,
      issuedQty: 2,
      unit: 'NOS',
      purchaseDate: new Date('2025-01-15'),
      purchaseCost: 280,
      supplier: 'Mitutoyo India Pvt Ltd',
      storageRack: 'Cabinet B-3 / Bin 12',
      condition: 'EXCELLENT',
      status: 'AVAILABLE',
      qrCode: 'QR-AST-10001',
      barcode: 'BC-VC-300-DIG',
      createdBy: 'SEED',
    },
  });

  const asset2 = await prisma.globalAsset.upsert({
    where: { assetId: 'AST-10002' },
    update: {},
    create: {
      assetId: 'AST-10002',
      assetCode: 'PWR-TRQ-61',
      name: 'Pneumatic Torque Wrench 50Nm',
      categoryId: catPower.id,
      locationId: locToolCrib.id,
      brand: 'Atlas Copco',
      model: 'ETP ST61-50',
      serialNumber: 'AC-993812',
      description: 'Precision electric nutrunner shutoff torque control',
      quantity: 5,
      availableQty: 4,
      issuedQty: 1,
      unit: 'NOS',
      purchaseDate: new Date('2024-11-10'),
      purchaseCost: 1450,
      supplier: 'Atlas Copco India',
      storageRack: 'Rack A-1 / Shelf 2',
      condition: 'GOOD',
      status: 'AVAILABLE',
      qrCode: 'QR-AST-10002',
      barcode: 'BC-PWR-TRQ-61',
      createdBy: 'SEED',
    },
  });

  const asset3 = await prisma.globalAsset.upsert({
    where: { assetId: 'AST-10003' },
    update: {},
    create: {
      assetId: 'AST-10003',
      assetCode: 'IT-LAP-5570',
      name: 'Dell Precision 5570 CAD Workstation',
      categoryId: catIT.id,
      locationId: locITStore.id,
      brand: 'Dell',
      model: 'Precision 5570',
      serialNumber: 'DL-5570-9831',
      description: 'Intel i9 32GB RAM RTX A2000 for Siemens NX CAD Modeling',
      quantity: 4,
      availableQty: 2,
      issuedQty: 2,
      unit: 'NOS',
      purchaseDate: new Date('2025-02-01'),
      purchaseCost: 2400,
      supplier: 'Dell India',
      storageRack: 'Shelf C-1 / Unit 4',
      condition: 'NEW',
      status: 'AVAILABLE',
      qrCode: 'QR-AST-10003',
      barcode: 'BC-IT-LAP-5570',
      createdBy: 'SEED',
    },
  });

  const emp = await prisma.employee.findFirst();
  if (emp) {
    const issue1 = await prisma.globalAssetIssueTransaction.upsert({
      where: { issueNumber: 'ISS-10001' },
      update: {},
      create: {
        issueNumber: 'ISS-10001',
        assetId: asset1.id,
        employeeId: emp.id,
        quantity: 2,
        issueDate: new Date('2025-07-20'),
        expectedReturnDate: new Date('2025-08-05'),
        conditionBeforeIssue: 'EXCELLENT',
        status: 'ISSUED',
        remarks: 'Issued for CMM inspection run on KTD-2',
        createdBy: 'SEED',
      },
    });

    await prisma.globalAssetAuditLog.create({
      data: {
        assetId: asset1.id,
        action: 'ISSUED',
        performedBy: 'SEED',
        newValues: { issueNumber: 'ISS-10001', employeeName: emp.name, quantity: 2 },
      },
    });
  }

  console.log('✅ Seeded Global Assets: Categories, Locations, Assets & Issues');

  console.log('\n🌱 Database seeding completed successfully with client data!');
  console.log('  📋 Projects seeded:');
  console.log('    • KTD-1 [ENGINEERING] — Material Weight/Cutting Sheet (29 parts)');
  console.log('    • KTD-2 [PROCUREMENT] — SPX Pump Housing Assembly Line (12 assemblies)');
  console.log('    • KTD-3 [CREATED] — Lely Pumphouse');
  console.log('  🏭 Materials seeded: 16 actual grades (CRCA, HRPO, MS SHEET, etc.)');
  console.log('  🏢 Customers seeded: SPX Flow Technology, Lely Industries');
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
