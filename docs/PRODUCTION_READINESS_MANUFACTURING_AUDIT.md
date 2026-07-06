# ToolRoomOS Production Readiness Manufacturing Audit

Audit date: 2026-07-06  
Audit basis: repository source under `ToolRoomOS`, attached workflow request, backend/frontend build and test commands.  
Audit rule: any feature not verifiable from runtime code is marked `NOT VERIFIED`.

## Executive Verdict

ToolRoomOS is **not production-ready for complete enterprise toolroom operations**.

The source verifies a useful but partial manufacturing execution flow:

`Project -> Engineering drawing/BOM/routing -> PO -> GRN -> inventory batch -> material issue -> job card/MSDR -> inspection/NCR -> dispatch -> invoice -> payment marker -> close`

The system does **not** verify the full requested real-factory lifecycle:

`Customer Inquiry -> Quotation -> Customer PO -> Project -> Engineering -> Drawing -> BOM -> Routing -> Approval -> Purchase -> Vendor PO -> Material Receipt -> GRN -> Accounts Bill Booking -> Inventory -> Allocation -> Issue -> Machine Shop -> MSDR -> Inspection -> NCR -> Rework -> Assembly -> Trial -> Final Trial -> Surface Treatment -> Packing -> Dispatch -> Invoice -> Payment -> Closure`

Release recommendation: **BLOCK PRODUCTION RELEASE** until Phase 0 items in this report are closed.

## Evidence Summary

- Backend stack: NestJS, Prisma, PostgreSQL, JWT, RBAC, Pino, Helmet, throttling. Evidence: `backend/package.json`, `backend/src/app.module.ts`, `backend/src/main.ts`.
- Frontend stack: Next.js 16, React 19, React Query, Axios, Tailwind-style UI. Evidence: `frontend/package.json`, `frontend/src/lib/api.ts`.
- Runtime Prisma schema defines 61 models and 12 enums. Evidence: `backend/prisma/schema.prisma`.
- Backend exposes 78 controller endpoints across auth, master data, projects, engineering, procurement, production, subcontracting, logistics-finance, HR, forms, reports, search, health.
- Backend build passed: `npm run build --prefix backend`.
- Frontend build passed: `npm run build --prefix frontend`.
- Frontend tests passed: 1 suite, 2 tests.
- Backend tests failed: 5 failing suites caused by missing test providers for `PrismaService`, `SearchService`, and `InspectionStandardsService`.

## Section 1: Feature Verification

Legend: Working = verified end-to-end enough for source-level confidence; Partial = some layers exist but missing mandatory workflow/audit/UI/security pieces; Broken = source proves route/wiring/logic failure; NOT VERIFIED = not proven by code.

| Feature | UI | API | DTO | Validation | Controller | Service | Transaction | DB write/read | Activity | Timeline | Dashboard | Notification | Audit trail | Permissions | Reports | Search | Export | Mobile | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Customer inquiry | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | RFQ SQL exists but not runtime-wired | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | NOT VERIFIED |
| Quotation | NOT VERIFIED | SQL migration exists | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | Prisma runtime model absent | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | NOT VERIFIED |
| Customer PO / project creation | UI exists `/projects`; API `POST /api/v1/projects`; DTO exists; validation partial; transaction exists; writes project/cost/timeline/activity | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | Yes | Dashboard via project metrics | Toast UI only | Partial | Sales/Admin | Dashboard only | Project list search | NOT VERIFIED | responsive CSS only | Partial |
| Engineering drawing | UI exists; API exists; DTO exists; activity exists; approval endpoint exists | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | On approval can update timeline | NOT VERIFIED | Toast UI only | Partial | Engineering/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| BOM | UI exists; API exists; DTO exists; transaction exists; approval creates cost event and auto draft PO | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | No stage transition by BOM alone | Cost summary | Toast UI only | Cost events | Engineering/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Routing | UI exists; API exists; DTO exists; approval can transition to procurement | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | Yes | NOT VERIFIED | Toast UI only | Partial | Engineering/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Approval engine | Approval model exists; document approval fields exist; no generic approval workflow UI/service verified | Partial | Partial | NOT VERIFIED | Partial | Partial | Partial | Partial | Activity partial | Timeline partial | NOT VERIFIED | NOT VERIFIED | Partial | Role decorators | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Purchase order | UI exists; API `POST purchase-orders`; DTO exists; transaction validates approved BOM and over-ordering; writes header/items/activity | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | No timeline | Cost later | Toast UI only | Partial | Purchase/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Vendor PO approval | PO auto-approved on create; no approval workflow verified | Partial | Partial | NOT VERIFIED | Partial | Partial | Yes | Yes | Yes | No | NOT VERIFIED | NOT VERIFIED | Partial | Purchase/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Material receipt / GRN | UI exists; API exists; DTO exists; transaction validates issued PO and heat number; writes GRN, stock, batch, transaction, cost event, timeline | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | Yes | Cost summary | Toast UI only | Cost events | Purchase/Admin | Dashboard inventory value | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Accounts bill booking | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | NOT VERIFIED |
| Inventory stock ledger | UI exists `/inventory` and project inventory; API exists; reads batches/ledger; batch/stock updates from GRN/issues | Yes | Partial | Partial | Yes | Yes | Yes via GRN/issue | Yes | Partial | Partial | Inventory value | Toast UI only | Cost/inventory transactions | Auth/RBAC partial | Dashboard only | Page-local search | Master-data export only | responsive CSS only | Partial |
| Material allocation/reservation | `InventoryReservation` model exists but no verified UI/API/service use | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | Model only | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | NOT VERIFIED |
| Material issue | UI exists; API exists; DTO exists; transaction validates stage/BOM/stock; writes issue, issue items, stock/batch decrement, transaction, cost event, timeline if first issue | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | Yes | Cost summary | Toast UI only | Cost events | Production/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Job cards | UI exists; API exists; service generates from routing and updates status | Yes | Yes | NOT VERIFIED for DTO | Partial | Yes | Yes | Partial | Yes | NOT VERIFIED | NOT VERIFIED | Toast UI only | Partial | Production/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Machine shop / MSDR | UI exists; API exists; DTO exists; transaction validates material issue and production stage; writes MSDR, routing progress, job-card status, cost events | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | No transition to inspection | Dashboard utilization | Toast UI only | Cost events | Production/Admin | Reports dashboard | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Inspection | UI exists; API exists; DTO exists; transaction validates production/inspection; supports in-process and final PDI; writes measurements/NCR/rework card | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | Final PDI pass advances dispatch-ready | Yield dashboard | Toast UI only | Partial | Quality/Admin | Reports dashboard | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| NCR | UI list/close partially; API get/close; auto-create on scrap; no CAPA workflow | Partial | Partial | Body fields only | Partial | Yes | Yes | Yes | Yes | No timeline on close | NOT VERIFIED | Toast UI only | Partial | Quality/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Rework | Auto rework job card on inspection REWORK; no full rework order/material loop verified | Partial | Partial | Partial | Yes via inspection | Yes | Yes | Yes | Yes | Stage can return to production | NOT VERIFIED | Toast UI only | Partial | Quality/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Assembly | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | NOT VERIFIED |
| Trial / final trial | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | NOT VERIFIED |
| Surface treatment | Vendor type exists; subcontracting can represent outside processing; no dedicated surface treatment workflow verified | Partial | Partial | Partial | Partial | Partial | Yes | Yes | Yes | Partial | Cost summary | Toast UI only | Cost events | Production/Purchase/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Heat treatment | Vendor type exists; subcontracting generic only | Partial | Partial | Partial | Partial | Partial | Yes | Yes | Yes | Partial | Cost summary | Toast UI only | Cost events | Production/Purchase/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Packing | Packing cost field exists in cost summary; no packing module/UI/API verified | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | Field only | NOT VERIFIED | NOT VERIFIED | Cost field only | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | NOT VERIFIED |
| Dispatch | UI exists; API exists; DTO exists; transaction validates final PDI and no open NCR; writes dispatch/cost/timeline/activity | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | Yes | Cost summary | Toast UI only | Cost events | Stores/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Invoice | UI exists; API exists; DTO exists; transaction validates dispatch; writes invoice/revenue/profit/timeline/activity | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Yes | Yes | Revenue dashboard | Toast UI only | Cost events | Finance/Admin | Dashboard only | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Payment | UI exists; API exists; DTO exists; marks invoice paid; stage moves to `PAYMENT_PENDING`; no payment receipt table, partial payment, reconciliation, ledger | Yes | Yes | Partial | Yes | Yes | Yes | Invoice update only | Yes | Yes | NOT VERIFIED | Toast UI only | Activity only | Finance/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Project closure | UI exists in finance; API exists; transaction validates invoice/payment stage and no open NCR; closes project | Yes | Yes | NOT VERIFIED | Partial | Yes | Yes | Yes | Yes | Yes | Project count changes | Toast UI only | Activity only | Finance/Admin | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Reports | UI exists `/reports`; API dashboard only; no export, no detailed reports, no plant/date filters | Yes | One endpoint | NOT VERIFIED | NOT VERIFIED | Yes | Yes | Read only | No | No | Yes | NOT VERIFIED | NOT VERIFIED | Auth only | Partial | NOT VERIFIED | NOT VERIFIED | responsive CSS only | Partial |
| Notifications | Toasts exist in frontend only; no backend notification model/service/event bus verified | UI toasts only | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | Frontend only | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | responsive CSS only | NOT VERIFIED |

## Section 2: Workflow Verification

### Expected Transition Analysis

| Transition | Can happen? | Can fail? | Rollback? | Repeat? | Deadlock risk | Skip risk | Data corruption risk |
|---|---|---|---|---|---|---|---|
| Create project -> Engineering | Yes. `ProjectsService.create` sets `currentStage: ENGINEERING`. | Yes, invalid FK/customer/plant; DTO validation partial. | DB transaction rollback yes. | Duplicate project number blocked by unique key. | Low. | It skips `CREATED` immediately. | Activity text says status CREATED while stored stage is ENGINEERING. |
| Engineering -> Procurement | Yes via routing/BOM approval and manual/auto evaluation. | Fails if no approved BOM/routing. | Transaction rollback yes. | Repeat blocked for same stage in manual path. | Medium if project stuck because auto/manual rules disagree. | Auto orchestrator can recursively skip later stages if records already exist. | BOM approval creates auto draft PO before procurement stage, creating business sequencing ambiguity. |
| Procurement -> GRN/material available | Yes via GRN. | Fails unless PO status is ISSUED/PARTIAL_RECEIPT and heat number exists. | Transaction rollback yes. | Partial receipts allowed by PO item quantities. | Low. | GRN service directly moves to MATERIAL_AVAILABLE. | Batch number uses timestamp; collision unlikely but not impossible under high concurrency. |
| Material available -> Production | Yes via material issue. | Fails if no approved BOM or insufficient stock. | Transaction rollback yes. | Repeat issues allowed while stock exists. | Medium because manual transition requires job cards, issue service does not require job cards to advance to PRODUCTION. | Yes: material issue can advance without job cards, contradicting `updateTimeline`. | Stock/batch updates happen in transaction; no row locks/idempotency persistence verified. |
| Production -> Inspection | Manual `updateTimeline` requires MSDR; auto orchestrator advances on any MSDR. | Fails if no MSDR. | Transaction rollback yes. | Repeat MSDRs allowed. | Medium: services do not auto-stage to INSPECTION after MSDR; user/orchestrator required. | Auto path can advance with any MSDR, not all job cards complete. | Job card completion is simplified when MSDR posted. |
| Inspection -> Dispatch ready | Yes on FINAL_PDI PASS. | Fails if inspection not in PRODUCTION/INSPECTION. | Transaction rollback yes. | Multiple inspections allowed. | Low. | FINAL_PDI can advance directly from PRODUCTION to DISPATCH_READY. | No assembly/trial/packing gates before dispatch-ready. |
| Dispatch ready -> Dispatched | Yes via dispatch. | Fails without passed PDI or with open NCR. | Transaction rollback yes. | Multiple dispatches allowed; no full/partial dispatch control verified. | Low. | No packing/transport/e-way gate. | Dispatch items are not created by service, only header. |
| Dispatched -> Invoiced | Yes via invoice. | Fails if dispatch note missing/not same project. | Transaction rollback yes. | Multiple invoices possible; revenue overwritten, not incremented. | Medium. | No tax/GST/e-way validation. | Profit/revenue can be overwritten by later invoice. |
| Invoiced -> Payment | Yes via payment endpoint. | Fails if invoice not found. | Transaction rollback yes. | Payment can be repeated; service always sets PAID. | Medium. | Stage name becomes `PAYMENT_PENDING` after payment recorded, semantically wrong. | No payment ledger or partial-payment protection. |
| Payment -> Close | Yes via close endpoint. | Fails unless current stage PAYMENT_PENDING or INVOICED and no open NCR. | Transaction rollback yes. | Repeat close blocked only by stage check after closed. | Low. | Finance can close from INVOICED even without recorded payment. | Closure does not lock downstream writes. |

### Overall Workflow Fit

Working source-verified path:

`Project -> BOM/routing/drawing -> PO -> GRN with heat number -> inventory batch -> issue -> MSDR -> inspection/PDI -> dispatch -> invoice -> payment marker -> close`

Missing or `NOT VERIFIED` factory steps:

- Customer inquiry
- Formal quotation
- Customer PO acceptance workflow separate from project creation
- Accounts bill booking after GRN
- Material allocation/reservation workflow
- Assembly
- Trial and final trial
- Packing lists and packing approvals
- Surface treatment as a dedicated controlled operation
- Heat treatment as a dedicated controlled operation
- Transport planning
- GST/e-way bill/export documents
- Payment ledger/reconciliation

## Section 3: Wiring Audit

Verified wiring pattern for core project creation:

`/projects` UI -> `useCreateProject` -> `ProjectsService.createProject` -> `api.post('projects')` -> `POST /api/v1/projects` -> `CreateProjectDto` -> `ProjectsService.create` -> Prisma transaction -> project/cost/timeline/activity writes -> response -> React Query invalidation/toast.

Verified wiring pattern for GRN:

`/projects/[id]/purchase` UI -> `useProcessGRN` -> `ProcurementService.processGRN` -> `POST projects/:id/goods-receipts` -> `ProcurementController.createGrn` -> `CreateGrnDto` -> `GoodsReceiptsService.createGrn` -> Prisma transaction -> GRN, GRN items, inventory stock, inventory batch, inventory transaction, cost event, project timeline, project activity -> response -> UI refresh/toast.

Broken or partial wiring:

- **Broken task status update**: frontend calls `PATCH projects/:projectId/tasks/:taskId/status`; backend exposes `PUT /api/v1/projects/:id/tasks/:taskId`. Result: task status button can terminate at API 404.
- **Broken global search path**: backend controller is `GET /search`; frontend fetches `http://localhost:3000/api/search`. No Next API proxy for `/api/search` was found except `/api/health`. Result: command palette global search is not verified and likely broken.
- **NCR close method mismatch**: frontend `QualityService.closeNcr` uses `PUT projects/:id/ncr/:ncrId/close`; backend exposes `PATCH /api/v1/projects/:id/ncr/:ncrId/close`. Result: close NCR call can fail unless unused UI bypasses the service.
- **Import wizard URL risk**: `ImportWizard` posts to `/api/v1${registry.apiEndpoint}` through an Axios instance whose base URL already includes `/api/v1`; this can produce duplicated `/api/v1/api/v1...` paths.
- **Notifications terminate at frontend toasts**: no backend notification table/service/event queue verified.
- **Audit trail terminates at `projectActivity` and `projectCostEvent` for most operations**: no global audit middleware captures before/after changes for every table.
- **Reports terminate at dashboard metrics**: no detailed report endpoints/export endpoints verified.

## Section 4: Database Verification

Runtime Prisma schema verifies 61 models:

`User, Company, Plant, Department, Customer, Vendor, Material, MaterialShape, Machine, Operation, Tool, Employee, Shift, Warehouse, StorageLocation, Uom, InspectionStandard, CostRate, DocumentType, Project, ProjectDocument, DocumentRevision, Drawing, BillOfMaterialHeader, BillOfMaterialItem, RoutingHeader, RoutingOperation, MaterialRequirement, PurchaseOrderHeader, PurchaseOrderItem, GoodsReceiptHeader, GoodsReceiptItem, MaterialIssueHeader, MaterialIssueItem, InspectionHeader, InspectionMeasurement, NcrReport, DispatchNote, DispatchItem, InvoiceHeader, InvoiceItem, InventoryStock, InventoryBatch, InventoryTransaction, InventoryReservation, ProductionBatch, ProductionOperation, MachineShopDailyReport, JobCard, ProjectTimeline, ProjectActivity, Approval, ProjectCostEvent, ProjectCostSummary, SubcontractOrder, SubcontractOrderItem, SubcontractReceipt, SubcontractReceiptItem, CostRateHistory, ProjectTask, dynamic_forms`.

Runtime enums verified:

`ProjectStatus, DocumentStatus, PurchaseOrderStatus, SubcontractOrderStatus, InspectionResult, InventoryMovementType, ApprovalStatus, CostEventType, VendorType, EmployeeType, InspectionType, SystemRole`.

Database compliance findings:

- Foreign key relations exist in Prisma for core runtime models. Working.
- Many unique keys exist: project number, PO number, GRN number, issue number, inspection number, NCR number, dispatch number, invoice number, batch number, master codes. Working.
- Soft delete is inconsistent. `Project.remove` sets `status: DELETED`, but there is no universal `deletedAt/deletedBy`. Partial.
- Audit fields are inconsistent. Most business tables have `createdBy/updatedBy`; many event tables lack `updatedBy`, `approvedBy`, `deletedBy`, or tenant fields. Partial.
- Approval fields exist on some document headers but no generic approval state machine is verified. Partial.
- Company isolation is partial. Master data has `companyId` for customer/vendor; project has plant; many transactional tables do not carry company/plant directly and service queries generally do not scope by company/plant from JWT. Partial.
- Warehouse isolation is partial. Stock carries `warehouseId`; many queries default to `DEFAULT-WH` without enforcing user warehouse permission. Partial.
- `InventoryReservation` exists but is unused by service/controller/UI. Dead runtime model.
- `Approval`, `MaterialRequirement`, `ProductionBatch`, `ProductionOperation`, `ProjectDocument`, `DocumentRevision`, `Tool`, `CostRate`, `CostRateHistory` have no complete verified UI/API workflows. Partial/dead runtime surface.
- SQL migration folders contain many additional tables for maintenance, HRMS, workflow, tooling, quality, production scheduling, etc.; these are not represented in Prisma runtime services. Therefore their behavior is `NOT VERIFIED`.
- RLS SQL exists in migration folders, but runtime Prisma services do not set `app.current_tenant`; production tenant isolation through RLS is `NOT VERIFIED`.

## Section 5: API Verification

Verified API categories:

- Auth: login and refresh.
- Projects: create/list/detail/update/status/advance/timeline/activity/cost-events/NCR/tasks/close/delete.
- Engineering: drawings, drawing approval, BOM, BOM approval/rejection, routing, routing validation/approval/rejection.
- Procurement: purchase orders, goods receipts.
- Production: material issues, material returns, machine shop reports, job cards.
- Subcontracting: orders and receipts.
- Logistics/finance: inspections, dispatches, invoices, payments.
- Master data: customers, vendors, materials, machines, employees, warehouses, locations, operations, inspection standards.
- Reports: dashboard.
- Forms: dynamic form schema storage.
- Search: unversioned `/search`.

API findings:

- Authentication is globally enforced through `APP_GUARD` JWT guard except `@Public` routes. Working.
- Authorization is role-decorator based. Partial because many read endpoints allow any authenticated user and there is no row/plant/company permission check.
- Validation exists through global `ValidationPipe`, but many DTO fields use `@IsString` instead of `@IsUUID`, many nested DTOs do not show `@Type`, and several endpoints accept `any`. Partial.
- Pagination exists for projects, users, and some master-data lists. Not universal.
- Filtering/search exists for projects and selected master-data lists. Not universal.
- Sorting is hardcoded in services. User-defined sorting `NOT VERIFIED`.
- Export endpoints `NOT VERIFIED`.
- Idempotency header is added by frontend, but backend does not persist or enforce idempotency keys. NOT VERIFIED.
- Error handling exists for Prisma known errors. Business exceptions use Nest defaults. Partial response consistency.
- Timeout/retry exists in frontend Axios only. Backend timeout handling `NOT VERIFIED`.
- API version header is sent, but backend does not verify version. Partial.

## Section 6: Manufacturing Verification

| Practice | Verification |
|---|---|
| Engineering | Partial: project engineering stage, drawings, BOM, routing exist. |
| Drawing approval | Partial: endpoint exists, but revision vault/control is limited. |
| Revision | Partial: BOM revisions and reopen engineering exist; ECN workflow `NOT VERIFIED`. |
| BOM | Partial working; material validation and cost baseline exist. |
| Routing | Partial working; operation sequence and machine planned; capacity planning incomplete. |
| Material planning/MRP | NOT VERIFIED beyond approved BOM and auto draft PO. |
| Purchase | Partial working. |
| Vendor management | Master data exists; vendor rating/supplier quality runtime workflow `NOT VERIFIED`. |
| GRN | Partial working with heat number gate. |
| Heat number | Working for GRN items/inventory batches. |
| Batch traceability | Partial: batches and inventory transactions exist; full genealogy and MTC docs `NOT VERIFIED`. |
| Inventory | Partial working for stock/batches/issues/returns. |
| FIFO | NOT VERIFIED. No FIFO allocation logic found. |
| Reservations | NOT VERIFIED. Model exists but no service flow verified. |
| Material issue | Partial working. |
| Machine shop | Partial working. |
| MSDR | Partial working. |
| Job cards | Partial working; simplified generation/status. |
| Operator | Partial: MSDR links employee. |
| Machine utilization | Partial: dashboard uses MSDR hours/160 assumption. |
| Setup/run/idle time | Partial: MSDR captures setup/cutting/idle. |
| Tool consumption | NOT VERIFIED. |
| Assembly | NOT VERIFIED. |
| Subcontracting | Partial generic outside process flow. |
| Heat treatment | NOT VERIFIED as dedicated controlled workflow. |
| Surface treatment | NOT VERIFIED as dedicated controlled workflow. |
| Inspection | Partial working. |
| First piece inspection | NOT VERIFIED. |
| In-process inspection | Partial working. |
| PDI | Partial working via FINAL_PDI. |
| NCR | Partial working. |
| CAPA | NOT VERIFIED. |
| Rework | Partial auto rework job card. |
| Scrap | Partial NCR on scrap; inventory scrap transaction not fully verified. |
| Packing | NOT VERIFIED. |
| Dispatch | Partial working. |
| Invoice | Partial working. |
| Payments | Partial marker only. |
| Project closure | Partial working. |

## Section 7: Report Verification

Verified reports:

- `/api/v1/reports/dashboard` returns total revenue, active projects, inventory value, production yield, cost trends, and machine utilization.
- `/api/v1/projects/dashboard-metrics` returns project count, MTD revenue, open invoices, machine load, yield, trends, revenue history.

Report findings:

- Uses real Prisma data. Working.
- Contains assumptions/proxies: machine utilization divides hours by fixed 160; project dashboard yield is based on delayed project ratio; open invoices logic uses dispatch-ready cost summaries. Partial.
- Export `NOT VERIFIED`.
- Correct totals `NOT VERIFIED`; revenue can be overwritten by multiple invoices.
- Performance partial; report service loads full cost summaries, inventory batches, inspections, MSDRs without pagination.
- Filters/date ranges/plant filters `NOT VERIFIED`.
- Detailed manufacturing reports such as WIP, job-card status, machine downtime, rejection Pareto, vendor rating, stock aging, GRN pending, PO pending, trial reports, dispatch register, invoice register are `NOT VERIFIED`.

## Section 8: Security Verification

Working:

- JWT access and refresh tokens exist.
- Global JWT guard is registered.
- Role guard is registered.
- Helmet is enabled.
- Throttler is enabled.
- CORS restricts to localhost development origins.
- Password validation uses bcrypt.

Partial / not verified:

- JWT secret strength and env validation `NOT VERIFIED`.
- Refresh token rotation/persistence/revocation `NOT VERIFIED`.
- RBAC is route-level only; object-level/plant/company/warehouse-level checks are not verified.
- Plant isolation `NOT VERIFIED`.
- Company isolation `NOT VERIFIED`.
- Warehouse isolation `NOT VERIFIED`.
- SQL injection risk is reduced by Prisma, but raw SQL migration/runtime execution controls `NOT VERIFIED`.
- XSS protection mostly React default; rich text/file preview handling `NOT VERIFIED`.
- CSRF `NOT VERIFIED`; localStorage bearer tokens are used.
- File upload security `NOT VERIFIED`; drawing API stores metadata but no safe file upload pipeline verified.
- Global audit logs table/middleware `NOT VERIFIED` for runtime.
- Role matrix exists in docs/migrations, but enforcement matrix across every endpoint is partial.

## Section 9: Performance Verification

Verified performance-positive patterns:

- Some writes use transactions.
- Some list endpoints paginate.
- Some parallel DB reads use `Promise.all`.
- Frontend uses React Query caching.
- Frontend build succeeds.

Performance risks:

- Reports load unbounded tables for summaries.
- Project detail includes many relations and nested inventory transactions; possible large payload.
- Search performs four parallel `contains` queries without tenant filters; indexes for lower/ILIKE behavior are not verified.
- Material issue loops perform per-item batch reads, stock reads, writes, and transaction writes. Fine for small slips, but bulk issue performance under load is `NOT VERIFIED`.
- GRN loops perform per-item PO item reads, stock upserts, batch writes, transaction writes. Bulk performance `NOT VERIFIED`.
- No database row locking/versioning for inventory concurrency verified.
- Frontend has many page-local stateful modals; render performance at large row counts is partially mitigated only in generic `SmartTable`/React Query. Actual large data rendering `NOT VERIFIED`.
- Bundle size budget `NOT VERIFIED`.

## Section 10: Real Factory Gap Analysis

| Missing/gap module | Priority | Business impact | Recommended design | Dependencies |
|---|---|---|---|---|
| Customer inquiry/RFQ | P0 | Cannot start from real sales funnel | Add RFQ entity, inquiry attachments, costing request, quote conversion | Customer master, document vault |
| Quotation | P0 | No commercial offer, revisions, validity, margin approval | Quotation header/items/revisions, approval, PDF/export, convert to PO/project | RFQ, finance rates |
| Accounts bill booking | P0 | GRN not linked to vendor invoice liability | Three-way match PO/GRN/vendor bill, tax, due date, payable ledger | Procurement, finance ledger |
| Inventory reservation/allocation | P0 | Stock can be consumed without formal allocation | Reservation service, FIFO/FEFO allocator, issue against reservation | Inventory batches, BOM |
| Assembly | P0 | Toolroom final assembly not controlled | Assembly BOM/operations, fitment checklist, issue-to-assembly, defects | Production, quality |
| Trial/final trial | P0 | Customer acceptance not controlled | Trial report, parameter checklist, customer witness, signoff gate | Assembly, quality |
| Packing list | P0 | Dispatch can occur without packing control | Packing list, crate/box details, photos, weight, checklist | Dispatch, inventory |
| Payment ledger | P0 | Payment is just invoice status | Receipts table, partial payments, TDS/deductions, reconciliation, aging | Invoice, finance |
| Plant/company/warehouse isolation | P0 | Enterprise multi-unit data leakage risk | Tenant context middleware, scoped Prisma filters/RLS setting, object permissions | Auth, schema |
| Idempotency backend | P0 | Duplicate PO/GRN/invoice risk on retries | Idempotency key table and middleware | API layer |
| Machine maintenance | P1 | Downtime and capacity not controlled | Preventive/breakdown work orders, spares, schedules | Machines, stores |
| Preventive maintenance | P1 | Unplanned breakdown risk | PM calendar, checklist, alerts, lockout | Maintenance |
| Calibration | P1 | QA instruments/process capability risk | Gauge master, calibration due, certificate upload | Quality, assets |
| Tool life/tool crib | P1 | Cutter/tool consumption cost missing | Tool issue/return/life counters, crib stock | Production, inventory |
| Jigs/fixtures/dies asset control | P1 | Asset traceability missing | Asset master, location, maintenance, drawing links | Tooling, inventory |
| Capacity planning | P1 | Delivery dates cannot be promised accurately | Routing load, finite capacity schedule, machine calendars | Routing, shifts, machines |
| Labour planning/attendance/shift | P1 | Labour cost and availability incomplete | Shift rosters, attendance import, operator assignment | HR, production |
| Machine downtime | P1 | OEE not reliable | Downtime logs by reason, production calendar | Machines, MSDR |
| Vendor rating/supplier quality | P1 | Supplier performance not controlled | Delivery/quality scorecards, supplier NCR | Procurement, GRN, quality |
| Customer complaints/warranty/service/AMC | P2 | After-sales quality loop missing | Complaint, RMA/service call, warranty cost | Dispatch, customer |
| Cost centers/asset management | P2 | Finance allocation incomplete | Cost center hierarchy, asset depreciation | Finance, HR |
| Currency exchange/export documents | P2 | Export sales not compliant | FX rates, packing declaration, LUT/Bill of Export docs | Finance, dispatch |
| Payroll/HR | P2 | HRMS SQL exists but runtime partial | Attendance, salary, leave, payroll runs | HR |
| Mobile approvals | P2 | Shop-floor/manager response delayed | Mobile-first approval inbox and push notifications | Notification service, RBAC |
| E-way bills/GST | P0 for India dispatch | Dispatch tax compliance missing | GST fields, HSN/SAC, e-way bill refs, invoice tax engine | Invoice, dispatch |

## Section 11: Enterprise Scorecard

| Area | Score / 10 | Reason |
|---|---:|---|
| Engineering | 6 | Drawing/BOM/routing exist; revision/ECN/document vault incomplete. |
| Purchase | 5 | PO and GRN exist; supplier approval, bill booking, PO approval workflow incomplete. |
| Inventory | 5 | Batches/stock/issues/returns exist; FIFO/reservations/stock audits incomplete. |
| Production | 5 | Job cards/MSDR exist; capacity, downtime, tool consumption incomplete. |
| Quality | 5 | Inspection/NCR partial; CAPA, FPI, calibration, complaints missing. |
| Assembly | 0 | NOT VERIFIED. |
| Subcontracting | 4 | Generic order/receipt exists; process-specific control incomplete. |
| Maintenance | 1 | SQL artifacts only; runtime workflow NOT VERIFIED. |
| Finance | 3 | Invoice/payment marker/cost summary exist; ledger/bill booking/taxes/reconciliation missing. |
| HR | 3 | Employee/rate endpoints exist; attendance/payroll/shift planning incomplete. |
| Reports | 3 | Dashboard only, no detailed filters/export. |
| Dashboard | 4 | Real data plus proxies; accuracy not production-grade. |
| Security | 4 | JWT/RBAC baseline; isolation/audit/revocation gaps. |
| Performance | 4 | Builds pass; unbounded reports/concurrency risks. |
| DevOps | 4 | Docker files exist; CI/CD/runtime ops NOT VERIFIED. |
| API | 5 | Many endpoints; inconsistent validation, filtering, idempotency, response patterns. |
| Database | 5 | Rich Prisma model; inconsistent audit/isolation and unused models. |
| Frontend | 5 | Broad UI exists; several broken wirings and limited mobile proof. |
| Backend | 6 | Core transactions present; incomplete enterprise controls. |
| Workflow | 4 | Core simplified flow works partially; real factory flow incomplete. |
| Automation | 3 | Auto stage and auto PO exist; contradictory gates and no notification engine. |
| Overall | 4 | Useful prototype/MVP, not enterprise manufacturing production-ready. |

## Section 12: Implementation Roadmap

### Phase 0: Release Blockers

| Issue | Severity | Business risk | Affected modules | Effort | Dependencies | Suggested fix |
|---|---|---|---|---|---|---|
| Broken frontend/backend route mismatches | Critical | Users cannot complete tasks/NCR/search reliably | Tasks, quality, search, imports | S | None | Align HTTP methods/paths and add contract tests. |
| Missing customer inquiry and quotation | Critical | Real sales-to-project lifecycle cannot start | CRM, projects, finance | M | Customer master | Build RFQ/quotation/revision/approval/convert flow. |
| No accounts bill booking | Critical | GRN has no payable liability | Procurement, finance | M | PO/GRN | Add vendor bill booking and 3-way match. |
| No backend idempotency enforcement | Critical | Duplicate PO/GRN/invoice on retries | All write APIs | M | API middleware | Persist `Idempotency-Key` with request hash/response. |
| No company/plant/warehouse isolation enforcement | Critical | Data leakage and wrong stock movement | Security, database, all modules | L | Auth/tenant model | Add tenant context, scoped queries, RLS session variable, permission tests. |
| Inventory concurrency not protected | Critical | Negative/incorrect stock under simultaneous issue/GRN | Inventory, production | M | DB transactions | Add row-level locking or optimistic versioning and stock movement invariants. |
| Missing assembly/trial/packing gates before dispatch | Critical | Dispatch before real factory completion | Production, quality, dispatch | L | Routing/quality | Add mandatory assembly, trial, final trial, packing workflows. |
| Payment can close from INVOICED without verified receipt | Critical | Financial closure before collection | Finance, closure | M | Invoice/payment ledger | Add payment receipts, partial payments, reconciliation, closure gate. |
| Backend tests failing | High | No automated confidence in workflows | QA/devops | S | Test harness | Fix provider mocks/modules and add workflow e2e tests. |

### Phase 1: Business Engine

- Add RFQ, quotation, customer PO acceptance, quote-to-project conversion.
- Add document numbering series per plant/company.
- Add approval inbox, approval delegation, approval audit fields.
- Add notification service: database notifications plus email/push hooks.
- Add global audit log middleware for create/update/delete with before/after.

### Phase 2: Manufacturing Engine

- Add reservations/allocation with FIFO and heat/batch selection rules.
- Add assembly work orders, assembly issue/return, assembly inspection.
- Add trial and final trial reports with signoff gates.
- Add surface treatment/heat treatment as process-specific subcontracting workflows.
- Add tool crib, tool life, fixture/die/jig asset tracking.
- Add capacity planning, shift calendars, machine downtime, OEE.

### Phase 3: Finance

- Add vendor bill booking and accounts payable.
- Add GST/tax engine, HSN/SAC, e-way bill fields, transport documents.
- Add receivables ledger, payment receipts, partial payments, deductions, aging.
- Add cost centers and project profitability lock at closure.

### Phase 4: Reports

- Add PO pending, GRN pending, stock aging, WIP, job-card status, rejection, NCR, vendor rating, dispatch, invoice, receivable aging reports.
- Add filters: date range, company, plant, warehouse, customer, vendor, project.
- Add CSV/XLSX/PDF export endpoints.
- Add report total reconciliation tests.

### Phase 5: Automation

- Replace contradictory auto-stage/manual-stage logic with one workflow state machine.
- Add event bus/outbox for timeline, dashboard projections, notifications, audit.
- Add background jobs for overdue projects, PM due, calibration due, payment due.
- Add mobile approval inbox.

### Phase 6: Optimization

- Add query indexes for search/filter/report paths.
- Add pagination to report/detail-heavy endpoints.
- Add inventory locking and load tests.
- Add bundle budgets and UI performance tests for large projects.
- Add CI pipeline: backend build/test/e2e, frontend build/test, migration validation.

## Final Determination

ToolRoomOS behaves like a **partial digital manufacturing workflow prototype**, not yet like a complete real manufacturing company.

Production release status: **BLOCKED**.

Minimum release condition: complete Phase 0, add automated e2e verification for the lifecycle, and re-audit every `NOT VERIFIED` item.
