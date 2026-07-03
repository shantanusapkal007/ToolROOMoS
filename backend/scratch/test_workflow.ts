import { PrismaClient, ProjectStatus, VendorType, InspectionResult } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

// Import services directly to run backend logic
import { ProjectsService } from '../src/projects/projects.service';
import { DrawingsService } from '../src/engineering/drawings.service';
import { BomsService } from '../src/engineering/boms.service';
import { PurchaseOrdersService } from '../src/procurement/purchase-orders.service';
import { GoodsReceiptsService } from '../src/procurement/goods-receipts.service';
import { MaterialIssuesService } from '../src/production/material-issues.service';
import { ProductionOperationsService } from '../src/production/production-operations.service';
import { InspectionsService } from '../src/logistics-finance/inspections.service';
import { DispatchesService } from '../src/logistics-finance/dispatches.service';
import { InvoicesService } from '../src/logistics-finance/invoices.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Instantiate Services
const prismaService = prisma as any; // Mock PrismaService inject compatibility
const projectsService = new ProjectsService(prismaService);
const drawingsService = new DrawingsService(prismaService);
const bomsService = new BomsService(prismaService);
const poService = new PurchaseOrdersService(prismaService);
const grnService = new GoodsReceiptsService(prismaService);
const issueService = new MaterialIssuesService(prismaService);
const msdrService = new ProductionOperationsService(prismaService);
const inspectionService = new InspectionsService(prismaService);
const dispatchService = new DispatchesService(prismaService);
const invoiceService = new InvoicesService(prismaService);

async function runWorkflowTest() {
  console.log('🔄 Initializing End-to-End Factory Workflow simulation...');

  // Clean old test projects
  await prisma.projectTimeline.deleteMany({});
  await prisma.projectActivity.deleteMany({});
  await prisma.projectCostEvent.deleteMany({});
  await prisma.projectCostSummary.deleteMany({});
  await prisma.billOfMaterialItem.deleteMany({});
  await prisma.billOfMaterialHeader.deleteMany({});
  await prisma.drawing.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrderHeader.deleteMany({});
  await prisma.goodsReceiptItem.deleteMany({});
  await prisma.goodsReceiptHeader.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.inventoryBatch.deleteMany({});
  await prisma.materialIssueItem.deleteMany({});
  await prisma.materialIssueHeader.deleteMany({});
  await prisma.machineShopDailyReport.deleteMany({});
  await prisma.inspectionHeader.deleteMany({});
  await prisma.dispatchNote.deleteMany({});
  await prisma.invoiceHeader.deleteMany({});
  await prisma.project.deleteMany({});

  // Fetch Master entities seeded
  const customer = await prisma.customer.findFirstOrThrow();
  const plant = await prisma.plant.findFirstOrThrow();
  const vendor = await prisma.vendor.findFirstOrThrow();
  const material = await prisma.material.findFirstOrThrow();
  const machine = await prisma.machine.findFirstOrThrow();
  const employee = await prisma.employee.findFirstOrThrow();

  console.log('\n--- 1. PROJECT CREATION ---');
  const project = await projectsService.create({
    projectNumber: 'PRJ-2026-TEST-99',
    customerPoNumber: 'PO-AERO-9080',
    partName: 'Main Cylinder Intake Core',
    description: 'Precision core insert for intake compression',
    customerId: customer.id,
    plantId: plant.id,
    priority: 'HIGH',
  });
  console.log(`Project initialized: ${project.projectNumber} with stage: ${project.currentStage}`);

  console.log('\n--- 2. DRAWING UPLOAD ---');
  await drawingsService.uploadDrawing(project.id, {
    drawingNumber: 'DRW-INTAKE-001',
    fileUrl: 's3://toolroomos/drawings/drw-intake-001-rev1.dxf',
    remarks: 'Approved CAD specs',
  });
  let updatedProject = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
  console.log(`Drawing uploaded. Project current stage advanced to: ${updatedProject.currentStage}`);

  console.log('\n--- 3. BOM CREATION & APPROVAL ---');
  const bom = await bomsService.createBom(project.id, {
    documentNumber: 'BOM-TEST-99',
    items: [
      {
        materialId: material.id,
        requiredQty: 2,
        estimatedCost: 6000,
        remarks: 'Base core plates',
      },
    ],
  });
  console.log(`BOM submitted. Est Cost: $${bom.totalEstimatedCost}`);
  
  await bomsService.approveBom(project.id, bom.id);
  updatedProject = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
  console.log(`BOM approved. Project current stage advanced to: ${updatedProject.currentStage}`);

  console.log('\n--- 4. PURCHASE ORDER ---');
  const po = await poService.createPo(project.id, {
    vendorId: vendor.id,
    poNumber: 'PO-VENDOR-99',
    items: [
      {
        materialId: material.id,
        orderedQty: 2,
        agreedRate: 5750,
      },
    ],
  });
  console.log(`Purchase Order ${po.poNumber} issued to vendor. Amount: $${po.totalAmount}`);

  console.log('\n--- 5. GOODS RECEIPT (GRN) ---');
  const poItems = await prisma.purchaseOrderItem.findMany({ where: { poHeaderId: po.id } });
  const grn = await grnService.createGrn(project.id, {
    poHeaderId: po.id,
    grnNumber: 'GRN-WH-99',
    items: [
      {
        poItemId: poItems[0].id,
        receivedQty: 2,
        acceptedQty: 2,
        actualRate: 5750,
        heatNumber: 'HEAT-9080-Z',
      },
    ],
  });
  updatedProject = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
  console.log(`Goods Receipt registered. Project current stage advanced to: ${updatedProject.currentStage}`);

  console.log('\n--- 6. MATERIAL ISSUE ---');
  const batches = await prisma.inventoryBatch.findMany({ where: { status: 'AVAILABLE' } });
  await issueService.issueMaterial(project.id, {
    issueNumber: 'ISSUE-SLIP-99',
    items: [
      {
        inventoryBatchId: batches[0].id,
        issuedQty: 2,
      },
    ],
  });
  updatedProject = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
  console.log(`Material issued to shopfloor. Project current stage advanced to: ${updatedProject.currentStage}`);

  console.log('\n--- 7. MACHINE SHOP DAILY REPORT (MSDR) ---');
  // Log 12 hours total engagement (setup 2 hrs + cutting 10 hrs)
  const msdr = await msdrService.logMachineShopReport(project.id, {
    machineId: machine.id,
    employeeId: employee.id,
    reportDate: new Date().toISOString(),
    startTime: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    setupTime: 2,
    cuttingTime: 10,
    producedQty: 1,
  });
  console.log(`MSDR logged. VMC Milling time registered by Alex Mercer.`);

  console.log('\n--- 8. QUALITY INSPECTION ---');
  await inspectionService.createInspection(project.id, {
    inspectedQty: 1,
    passedQty: 1,
    result: InspectionResult.PASS,
    remarks: 'Dimensions match drawing tolerances.',
  });
  updatedProject = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
  console.log(`Quality inspection completed. Project current stage advanced to: ${updatedProject.currentStage}`);

  console.log('\n--- 9. DISPATCH ---');
  await dispatchService.createDispatch(project.id, {
    dispatchNumber: 'DISP-CH-99',
    dispatchQty: 1,
    logisticsCost: 250,
    remarks: 'Dispatched via AirFreight Pune',
  });
  updatedProject = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
  console.log(`Parts dispatched. Project current stage advanced to: ${updatedProject.currentStage}`);

  console.log('\n--- 10. CUSTOMER INVOICING ---');
  const dispatches = await prisma.dispatchNote.findMany({ where: { projectId: project.id } });
  await invoiceService.createInvoice(project.id, {
    invoiceNumber: 'INV-CUST-99',
    dispatchNoteId: dispatches[0].id,
    subtotal: 45000,
    taxAmount: 8100,
    totalAmount: 53100,
  });
  updatedProject = await prisma.project.findUniqueOrThrow({ where: { id: project.id } });
  console.log(`Tax Invoice generated. Final stage reached: ${updatedProject.currentStage}`);

  console.log('\n======================================================');
  console.log('📊 E2E WORKFLOW COST AND PROFITABILITY SUMMARY REPORT');
  console.log('======================================================');
  const summary = await prisma.projectCostSummary.findUniqueOrThrow({
    where: { projectId: project.id },
  });

  console.log(`Target Quotation Value:  $45,000.00`);
  console.log(`---------------------------------`);
  console.log(`Estimated Material Cost: $${summary.estimatedMaterialCost.toFixed(2)}`);
  console.log(`Actual Material Cost:    $${summary.actualMaterialCost.toFixed(2)}`);
  console.log(`Material Consumed Cost:  $${summary.materialConsumptionCost.toFixed(2)}`);
  console.log(`Machine Milling Cost:    $${summary.machineCost.toFixed(2)} (VMC-04)`);
  console.log(`Labour Operator Cost:    $${summary.labourCost.toFixed(2)} (Alex Mercer)`);
  console.log(`Outside Subcontracting:  $${summary.outsideProcessCost.toFixed(2)}`);
  console.log(`Dispatch Freight Cost:   $${summary.dispatchCost.toFixed(2)}`);
  console.log(`---------------------------------`);
  console.log(`Total Accrued Cost:      $${summary.totalCost.toFixed(2)}`);
  console.log(`Final pre-tax Revenue:   $${summary.revenue.toFixed(2)}`);
  console.log(`---------------------------------`);
  console.log(`NET PROFITABILITY:       $${summary.profitability.toFixed(2)} (Margin: ${((summary.profitability.toNumber() / summary.revenue.toNumber()) * 100).toFixed(1)}%)`);
  console.log('======================================================');
}

runWorkflowTest()
  .catch((e) => {
    console.error('❌ E2E Simulation Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
