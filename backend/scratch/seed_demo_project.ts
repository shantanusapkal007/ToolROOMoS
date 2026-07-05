import { PrismaClient, ProjectStatus, InspectionResult } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

import { ProjectsService } from '../src/projects/projects.service';
import { DrawingsService } from '../src/engineering/drawings.service';
import { BomsService } from '../src/engineering/boms.service';
import { RoutingService } from '../src/engineering/routing.service';
import { PurchaseOrdersService } from '../src/procurement/purchase-orders.service';
import { GoodsReceiptsService } from '../src/procurement/goods-receipts.service';
import { MaterialIssuesService } from '../src/production/material-issues.service';
import { ProductionOperationsService } from '../src/production/production-operations.service';
import { InspectionsService } from '../src/logistics-finance/inspections.service';
import { DispatchesService } from '../src/logistics-finance/dispatches.service';
import { InvoicesService } from '../src/logistics-finance/invoices.service';
import { WorkflowOrchestratorService } from '../src/projects/workflow-orchestrator.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const prismaService = prisma as any;
const orchestrator = new WorkflowOrchestratorService(prismaService);
const projectsService = new ProjectsService(prismaService);
const drawingsService = new DrawingsService(prismaService);
const bomsService = new BomsService(prismaService);
const routingService = new RoutingService(prismaService, {} as any);
const poService = new PurchaseOrdersService(prismaService);
const grnService = new GoodsReceiptsService(prismaService);
const issueService = new MaterialIssuesService(prismaService);
const msdrService = new ProductionOperationsService(prismaService);
const inspectionService = new InspectionsService(prismaService);
const dispatchService = new DispatchesService(prismaService);
const invoiceService = new InvoicesService(prismaService);

async function seedDemoProject() {
  console.log('🌱 Starting Demo Project seeding into live database...');

  const projectCode = 'PRJ-2026-DEMO-MOLD';

  // 1. Clean previous run if exists
  const existing = await prisma.project.findUnique({
    where: { projectNumber: projectCode },
  });

  if (existing) {
    console.log('🗑 Cleaning old demo project data...');
    const pid = existing.id;
    await prisma.projectTimeline.deleteMany({ where: { projectId: pid } });
    await prisma.projectActivity.deleteMany({ where: { projectId: pid } });
    await prisma.projectCostEvent.deleteMany({ where: { projectId: pid } });
    await prisma.projectCostSummary.deleteMany({ where: { projectId: pid } });
    await prisma.billOfMaterialItem.deleteMany({ where: { bomHeader: { projectId: pid } } });
    await prisma.billOfMaterialHeader.deleteMany({ where: { projectId: pid } });
    await prisma.drawing.deleteMany({ where: { projectId: pid } });
    await prisma.goodsReceiptItem.deleteMany({ where: { grnHeader: { projectId: pid } } });
    await prisma.goodsReceiptHeader.deleteMany({ where: { projectId: pid } });
    await prisma.purchaseOrderItem.deleteMany({ where: { poHeader: { projectId: pid } } });
    await prisma.purchaseOrderHeader.deleteMany({ where: { projectId: pid } });
    await prisma.inventoryTransaction.deleteMany({ where: { projectId: pid } });
    await prisma.materialIssueItem.deleteMany({ where: { issueHeader: { projectId: pid } } });
    await prisma.materialIssueHeader.deleteMany({ where: { projectId: pid } });
    await prisma.machineShopDailyReport.deleteMany({ where: { projectId: pid } });
    await prisma.inspectionHeader.deleteMany({ where: { projectId: pid } });
    await prisma.dispatchNote.deleteMany({ where: { projectId: pid } });
    await prisma.invoiceHeader.deleteMany({ where: { projectId: pid } });
    await prisma.project.delete({ where: { id: pid } });
  }

  // 2. Fetch Master data
  const customer = await prisma.customer.findFirstOrThrow({ where: { customerCode: 'CU-001' } });
  const plant = await prisma.plant.findFirstOrThrow({ where: { plantCode: 'PL-01' } });
  const vendor = await prisma.vendor.findFirstOrThrow({ where: { vendorCode: 'VE-001' } });
  const material = await prisma.material.findFirstOrThrow({ where: { materialCode: 'MA-01' } });
  const machine = await prisma.machine.findFirstOrThrow({ where: { machineCode: 'MC-04' } });
  const employee = await prisma.employee.findFirstOrThrow({ where: { employeeCode: 'EM-042' } });
  const operation = await prisma.operation.findFirstOrThrow();

  console.log('🚀 Phase 1: Initializing Project...');
  const project = await projectsService.create({
    projectNumber: projectCode,
    customerPoNumber: 'PO-DEMO-50400',
    partName: 'High Precision Turbine Blading Die',
    description: 'Precision mold cavity for aerospace compression blades',
    customerId: customer.id,
    plantId: plant.id,
    priority: 'HIGH',
  });

  console.log('🎨 Phase 2: Uploading Technical Drawings...');
  await drawingsService.uploadDrawing(project.id, {
    drawingNumber: 'DRW-TURBINE-001',
    fileUrl: 's3://toolroomos/drawings/drw-turbine-001-rev1.dxf',
    remarks: 'Visual and dimensional checks passed.',
  });
  await orchestrator.evaluateProjectStage(project.id);

  console.log('📐 Phase 3: Creating and Approving BOM budget...');
  const bom = await bomsService.createBom(project.id, {
    documentNumber: 'BOM-TURBINE-01',
    items: [
      {
        materialId: material.id,
        requiredQty: 5,
        estimatedCost: 15000,
        remarks: 'Aerospace Grade Block',
      },
    ],
  });
  await bomsService.approveBom(project.id, bom.id);
  await orchestrator.evaluateProjectStage(project.id);

  console.log('📝 Phase 3b: Creating Routing...');
  const routing = await routingService.submitEngineeringPlan(project.id, {
    documentNumber: 'RTG-TURBINE-01',
    operations: [
      {
        sequenceOrder: 10,
        operationId: operation.id,
        machineId: machine.id,
        estimatedHours: 4,
        estimatedSetupTime: 1,
        remarks: 'Milling block'
      }
    ]
  });
  await prisma.routingHeader.update({ where: { id: routing.id }, data: { approvalStatus: 'APPROVED' } });
  await orchestrator.evaluateProjectStage(project.id);

  console.log('🛒 Phase 4: Issuing Vendor Purchase Order...');
  const po = await poService.createPo(project.id, {
    vendorId: vendor.id,
    poNumber: 'PO-STEEL-4001',
    items: [
      {
        materialId: material.id,
        orderedQty: 5,
        agreedRate: 2800,
      },
    ],
  });

  console.log('📦 Phase 5: Processing Goods Receipt Note (GRN)...');
  const poItems = await prisma.purchaseOrderItem.findMany({ where: { poHeaderId: po.id } });
  await grnService.createGrn(project.id, {
    poHeaderId: po.id,
    grnNumber: 'GRN-MOLD-4001',
    items: [
      {
        poItemId: poItems[0].id,
        receivedQty: 5,
        acceptedQty: 5,
        actualRate: 2800,
        heatNumber: 'HEAT-TURBINE-X42',
      },
    ],
  });
  await orchestrator.evaluateProjectStage(project.id);

  console.log('⚙️ Phase 6: Issuing Material to floor...');
  const batches = await prisma.inventoryBatch.findMany({ where: { materialId: material.id, status: 'AVAILABLE' } });
  await issueService.issueMaterial(project.id, {
    issueNumber: 'ISS-TURBINE-01',
    items: [
      {
        inventoryBatchId: batches[0].id,
        issuedQty: 5,
      },
    ],
  });

  console.log('🔨 Phase 7: Logging Operator Runs (MSDR Logs)...');
  await msdrService.logMachineShopReport(project.id, {
    machineId: machine.id,
    employeeId: employee.id,
    reportDate: new Date().toISOString(),
    startTime: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    setupTime: 4,
    cuttingTime: 18,
    producedQty: 5,
  });
  await orchestrator.evaluateProjectStage(project.id);

  console.log('🔍 Phase 8: Quality Inspection...');
  await inspectionService.createInspection(project.id, {
    inspectedQty: 1,
    passedQty: 1,
    result: 'PASS',
    inspectionType: 'FINAL_PDI',
    remarks: 'Dimensional check PASSED. Tolerances within 0.005mm.',
  });

  console.log('🚚 Phase 9: Processing Shipping Dispatch...');
  await dispatchService.createDispatch(project.id, {
    dispatchNumber: 'DISP-TURBINE-01',
    dispatchQty: 1,
    logisticsCost: 400,
    remarks: 'Shipped via standard logistics.',
  });
  await orchestrator.evaluateProjectStage(project.id);

  console.log('💰 Phase 10: Invoicing & Closing...');
  const dispatches = await prisma.dispatchNote.findMany({ where: { projectId: project.id } });
  await invoiceService.createInvoice(project.id, {
    invoiceNumber: 'INV-DEMO-1002',
    dispatchNoteId: dispatches[0].id,
    subtotal: 50000,
    taxAmount: 9000,
    totalAmount: 18880,
  });
  await orchestrator.evaluateProjectStage(project.id);

  console.log('🎉 Seeding Demo Project successfully finished!');
}

seedDemoProject()
  .catch((e) => {
    console.error('❌ Demo Project Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
