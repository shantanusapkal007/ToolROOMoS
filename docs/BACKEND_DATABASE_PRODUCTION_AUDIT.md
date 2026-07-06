# ToolRoomOS Backend and Database Production Audit

Audit date: 2026-07-06  
Audit basis: `ToolRoomOS/backend`, `ToolRoomOS/backend/prisma`, `ToolRoomOS/database/migrations`, backend build and test commands.  
Audit rule: behavior is marked `NOT VERIFIED` unless it is visible in runtime NestJS/Prisma code or current command output.

## Executive Verdict

The backend and database are **not production-ready for enterprise manufacturing use**.

The backend is a functional NestJS/Prisma prototype for a simplified toolroom workflow. It has real transactional code for project creation, engineering artifacts, purchase orders, GRN, inventory batches, material issues, MSDR, inspections, dispatches, invoices, payment markers, and project closure.

The database story is split into two layers:

1. Runtime Prisma schema: 61 models and 12 enums used by the NestJS application.
2. Raw SQL migration tree: at least 132 `CREATE TABLE` statements covering CRM, quotation, finance, audit, RLS, workflow, maintenance, tooling, APQP/SPC/PPAP, analytics, HRMS, and production scheduling.

The raw SQL database surface is much broader than the actual backend runtime. Many SQL modules are **not represented in Prisma models, services, controllers, DTOs, tests, or UI wiring**. They should be treated as dormant database artifacts, not delivered product behavior.

Production release recommendation: **BLOCK BACKEND/DATABASE PRODUCTION RELEASE** until the Phase 0 remediation list is complete.

## Verification Summary

| Item | Result |
|---|---|
| Backend framework | NestJS 11 |
| Runtime database access | Prisma 7 with `@prisma/adapter-pg` and `pg` pool |
| Runtime schema | 61 Prisma models, 12 enums |
| Controller route decorators found | 78 |
| Auth baseline | JWT guard, role guard, throttler, helmet |
| Runtime transactions | Present in core write flows |
| Backend build | Passed: `cmd /c npm run build` |
| Direct unit specs | Passed: 5 suites, 5 tests via explicit `npx jest ... --runInBand --detectOpenHandles` |
| Aggregate unit command | `cmd /c npm run test` timed out without useful result |
| E2E test | Failed because `JWT_SECRET` is missing in test environment |
| Raw SQL migration table declarations | 132 `CREATE TABLE` matches |
| Raw SQL RLS enable statements | 188 `ENABLE ROW LEVEL SECURITY` matches |
| Raw SQL RLS disable statements | 17 `DISABLE ROW LEVEL SECURITY` matches |
| Runtime tenant/RLS session setting | NOT VERIFIED |

## Backend Architecture Audit

### Working

- Modular NestJS structure exists for auth, users, master data, projects, engineering, procurement, production, subcontracting, logistics-finance, HR, automation, health, search, forms, and reports.
- `AppModule` registers global throttling, scheduling, Prisma, JWT auth guard, role guard, and module imports.
- `main.ts` enables Helmet, CORS for localhost origins, global validation pipe, and Prisma exception filter.
- `PrismaService` centralizes database access through a shared `pg` pool and Prisma adapter.
- Business writes use Prisma transactions in many core services:
  - project creation and stage changes
  - BOM approval and cost baseline
  - routing approval
  - PO creation
  - GRN processing
  - material issue and return
  - MSDR creation
  - inspection/NCR/rework behavior
  - dispatch, invoice, payment marker, closure

### Not Production-Ready

- No global request context service for tenant, company, plant, warehouse, correlation ID, or actor propagation.
- No backend idempotency middleware despite frontend sending idempotency headers.
- No object-level permission checks. Role checks are route-level only.
- No consistent response envelope across all controllers.
- No OpenAPI/Swagger contract verified.
- No health readiness check that verifies required env vars, DB migration state, queue state, storage state, and dependency reachability.
- No backend timeout/cancellation policy for long requests.
- No background job persistence or retry framework. The automation module writes direct project activity rows on cron.
- No application-level audit middleware capturing before/after values for every mutation.

## API and Controller Audit

### Verified Runtime API Areas

| Area | Runtime status |
|---|---|
| Auth | Login and refresh exist |
| Users | Admin create/list/update exists |
| Master data | Customers, vendors, materials, machines, employees, warehouses, locations, operations, inspection standards |
| Projects | Create/list/detail/update/stage/timeline/activity/tasks/NCR/close/delete |
| Engineering | Drawings, drawing approval, BOM, BOM approval/rejection, routing, routing validation/approval/rejection |
| Procurement | Purchase orders, goods receipts |
| Production | Material issues, material returns, job cards, MSDR |
| Subcontracting | Generic subcontract order and receipt |
| Logistics/finance | Inspections, dispatches, invoices, payment marker |
| Reports | Dashboard endpoint only |
| Search | Unversioned `/search` endpoint |
| Forms | Dynamic form schema persistence |

### API Findings

| Finding | Severity | Evidence | Production impact |
|---|---|---|---|
| Search is unversioned | High | `SearchController` uses `@Controller('search')`, while most APIs use `api/v1/...` | API clients/proxies can miss search or route inconsistently |
| Many bodies use `any` | High | Users, project update/tasks, HR employee creation, forms schema, current user payloads | Validation pipe cannot enforce contract shape |
| DTO UUID validation is weak | High | Many ID fields use `@IsString` rather than `@IsUUID` | Invalid IDs reach Prisma and become runtime DB errors |
| Read endpoints are broadly authenticated | High | Most `GET` routes have no role restriction | Sensitive project/finance/master data can be exposed to any authenticated role |
| No company/plant scoping in controllers | Critical | Controllers accept IDs and services query by ID without user scope | Cross-plant and cross-company data leakage risk |
| No idempotency enforcement | Critical | No idempotency model/service/middleware found | Duplicate POs, GRNs, invoices, issues on retry |
| No API version enforcement | Medium | Frontend sends versioning but backend only hardcodes URL paths | Version drift can break clients silently |
| Export endpoints absent | Medium | Reports/dashboard only; no CSV/XLSX/PDF API | Enterprise reporting workflows incomplete |
| Error response consistency partial | Medium | Prisma filter exists, business exceptions use Nest defaults | Client error handling is inconsistent |

## Authentication and Authorization Audit

### Working

- JWT login validates bcrypt password hashes.
- Access token and refresh token are signed.
- Global `JwtAuthGuard` protects routes except `@Public`.
- Global `RolesGuard` honors `@Roles`.
- `AuthModule` fails fast if `JWT_SECRET` is missing.
- `SystemRole` enum defines `ADMIN`, `SALES_ENGINEER`, `ENGINEERING`, `PURCHASE`, `STORES`, `PRODUCTION`, `QUALITY`, and `FINANCE`.

### Production Gaps

| Gap | Severity | Detail |
|---|---|---|
| Refresh tokens are stateless | Critical | No refresh token table, hash, revocation, rotation, reuse detection, device/session tracking |
| No user status check in JWT validate | High | Token validation returns payload without verifying current user status on every request |
| No object-level authorization | Critical | A user with a valid role can access records by guessed IDs if the route permits the role |
| No tenant/company/plant claims enforced | Critical | JWT payload has role and employee ID but no enforced scoped query policy |
| No warehouse permission model | Critical | Inventory services accept or default warehouses without user warehouse authorization |
| No password policy or reset flow verified | Medium | Login exists, but lifecycle controls are absent |
| No CSRF posture for browser token storage verified | Medium | Bearer token flow exists, but storage/security policy is outside backend enforcement |
| No security event audit | High | Failed logins, refresh attempts, role changes, and admin actions are not globally logged |

## Validation and DTO Audit

The backend has a global `ValidationPipe({ transform: true })`, and many create DTOs use class-validator. This is a useful baseline.

However, validation coverage is not production-grade:

- Many IDs are `@IsString`, not `@IsUUID`.
- Several update endpoints accept `any`.
- Users and HR endpoints accept untyped request bodies.
- Forms accept arbitrary JSON schema without versioning, size limits, ownership, or allowed-component validation.
- Numeric DTOs use `@IsNumber`, but there is no universal positivity, decimal precision, max value, or manufacturing unit validation.
- DTOs generally do not enforce business enum domains for status strings that are stored as plain `String`.
- Some nested DTOs are correct with `@ValidateNested` and `@Type`; this is not universal.

Required production standard:

- Every route body must have an explicit DTO.
- Every path/query ID must use `ParseUUIDPipe` or DTO-level `@IsUUID`.
- Every quantity, rate, amount, and hour field must enforce non-negative constraints and safe maximums.
- Every enum-like string must be a real enum or constrained with `@IsIn`.
- All list endpoints must validate pagination bounds.

## Transaction and Workflow Audit

### Verified Transaction Strengths

Core services use transactions for multi-table writes. This is one of the stronger parts of the backend.

| Flow | Transaction coverage |
|---|---|
| Project creation | project, cost summary, timeline, activity |
| Stage update | project, timeline, activity |
| BOM approval | BOM status, cost summary, cost event, activity, optional auto PO |
| GRN | GRN header/items, PO item received qty, stock, batch, transaction, cost event, timeline/activity |
| Material issue | issue header/items, batch decrement, stock decrement, transaction, cost event, timeline/activity |
| Material return | return stock/batch/cost/event/activity |
| MSDR | report, routing/job card progress, machine/labour cost events |
| Inspection | inspection, measurements, NCR or rework job card, stage progression |
| Dispatch | dispatch, cost, activity, stage |
| Invoice | invoice, cost summary revenue/profit, activity, stage |
| Payment marker | invoice status update, activity, stage |
| Closure | stage validation, open NCR check, stage update, timeline/activity |

### Workflow Risks

| Risk | Severity | Detail |
|---|---|---|
| Stage engine is split | High | Manual `ProjectsService.updateTimeline`, direct service updates, and `WorkflowOrchestratorService` can all move stages |
| Auto-stage rules differ from manual gates | High | Material issue can advance to `PRODUCTION` without job cards, while manual stage change requires job cards |
| Orchestrator can recursively skip stages | High | It advances repeatedly if later artifacts already exist |
| `PAYMENT_PENDING` stage is semantically wrong after payment | High | Payment endpoint marks invoice paid then moves project to `PAYMENT_PENDING` |
| Closure can happen from `INVOICED` | Critical | `closeProject` permits `INVOICED` without requiring verified receipt ledger |
| Dispatch gate lacks assembly/trial/packing | Critical | Final PDI pass is enough to dispatch-ready in runtime |
| Invoice revenue overwrites summary | High | Multiple invoices can overwrite `ProjectCostSummary.revenue`, not accumulate |
| Project deletion uses status string | Medium | Soft delete is not universal and is not `deletedAt/deletedBy` based |

Required production standard:

- Replace scattered stage changes with one workflow state machine.
- Every transition must have one canonical guard.
- Persist workflow events, actor, old state, new state, reason, and correlation ID.
- Add tests proving invalid transitions fail and valid full lifecycle transitions pass.

## Inventory and Costing Audit

### Working Runtime Behavior

- GRN requires heat number for every item.
- GRN writes accepted quantity into stock and creates inventory batches.
- Material issue validates approved BOM membership.
- Material issue validates batch available quantity and warehouse stock.
- Material issue writes inventory transaction and project cost event.
- Batch, stock, and transaction tables provide a basic traceability chain.

### Critical Gaps

| Gap | Severity | Detail |
|---|---|---|
| No row-level locking or optimistic versioning | Critical | Read-then-update stock checks can race under concurrent issues |
| No FIFO/FEFO allocator | Critical | Users select batches manually; no allocation policy is enforced |
| Reservation model is unused | Critical | `InventoryReservation` exists but no service/controller workflow enforces reservations |
| Stock and batch invariants are not database-enforced | Critical | No check constraints verified for non-negative quantities in Prisma runtime |
| Default warehouse fallback is risky | High | Services fall back to `DEFAULT-WH` without user/company/plant scoping |
| Batch number uses timestamp | Medium | Collision risk is low but not impossible under high concurrency and parallel item loops |
| Inventory transaction is append-only but not complete ledger | High | Adjustments, scrap, audit locks, reversal documents, and period close are not production-grade |
| Cost summary semantics are inconsistent | High | Actual material, consumption, and total cost have comments to avoid double counting, but no formal accounting model |

Required production standard:

- Add `version` fields or transactional row locks on stock and batch rows.
- Enforce non-negative quantity constraints at DB level.
- Implement reservation/allocation before issue.
- Implement FIFO/FEFO and heat/batch selection policy.
- Add inventory movement reversal and immutable posting rules.
- Add concurrency tests for simultaneous GRN/issue/return.

## Database Runtime Schema Audit

Runtime Prisma schema contains the following domains:

| Domain | Models |
|---|---|
| Auth/organization | `User`, `Company`, `Plant`, `Department` |
| Master data | `Customer`, `Vendor`, `Material`, `MaterialShape`, `Machine`, `Operation`, `Tool`, `Employee`, `Shift`, `Warehouse`, `StorageLocation`, `Uom`, `InspectionStandard`, `CostRate`, `DocumentType` |
| Project core | `Project`, `ProjectTimeline`, `ProjectActivity`, `ProjectTask`, `Approval` |
| Engineering | `ProjectDocument`, `DocumentRevision`, `Drawing`, `BillOfMaterialHeader`, `BillOfMaterialItem`, `RoutingHeader`, `RoutingOperation`, `MaterialRequirement` |
| Procurement | `PurchaseOrderHeader`, `PurchaseOrderItem`, `GoodsReceiptHeader`, `GoodsReceiptItem` |
| Inventory | `InventoryStock`, `InventoryBatch`, `InventoryTransaction`, `InventoryReservation` |
| Production | `ProductionBatch`, `ProductionOperation`, `MachineShopDailyReport`, `JobCard`, `MaterialIssueHeader`, `MaterialIssueItem` |
| Quality/logistics/finance | `InspectionHeader`, `InspectionMeasurement`, `NcrReport`, `DispatchNote`, `DispatchItem`, `InvoiceHeader`, `InvoiceItem` |
| Subcontracting | `SubcontractOrder`, `SubcontractOrderItem`, `SubcontractReceipt`, `SubcontractReceiptItem` |
| Cost/forms | `ProjectCostEvent`, `ProjectCostSummary`, `CostRateHistory`, `dynamic_forms` |

### Runtime Schema Strengths

- Foreign key relations exist for most core runtime models.
- Unique identifiers exist for project, PO, GRN, issue, inspection, NCR, dispatch, invoice, batch, and master codes.
- `createdAt` and `updatedAt` are broadly present.
- Cost event and activity tables give useful local audit visibility.
- Batch traceability has material, heat number, GRN item, and inventory transaction links.

### Runtime Schema Gaps

| Gap | Severity | Detail |
|---|---|---|
| Company isolation is partial | Critical | Some master tables have `companyId`; many transaction tables rely on project/plant joins and services do not enforce scoped queries |
| Plant isolation is partial | Critical | `Project` and `Warehouse` have plant links, but query authorization does not enforce plant membership |
| Warehouse isolation is partial | Critical | Stock has warehouse, but no user warehouse permission model |
| Audit fields inconsistent | High | `createdBy/updatedBy` are not uniform; event tables often lack `updatedBy`; no `deletedBy` standard |
| Soft delete inconsistent | High | `Project` uses `status: DELETED`; many tables have no runtime soft delete |
| No optimistic version columns | Critical | Important mutable rows lack version fields |
| No check constraints in Prisma schema | High | Non-negative money/quantity/hour invariants are application-only |
| Dead/partial models | Medium | `InventoryReservation`, `Approval`, `MaterialRequirement`, `ProductionBatch`, `ProductionOperation`, `ProjectDocument`, `DocumentRevision`, `Tool`, `CostRate`, `CostRateHistory` lack complete verified runtime workflows |
| Dynamic forms table naming | Low | `dynamic_forms` model breaks naming style and has minimal governance fields |

## Raw SQL Migration Audit

The `database/migrations` tree contains broad enterprise ambitions that are not fully reflected in runtime code.

### SQL Modules Found

| SQL area | Examples |
|---|---|
| CRM | customers, contacts, RFQs |
| Quoting | quotations, cost calculations, project cost analysis |
| Finance | invoices, expenses, chart of accounts, journal entries, payment receipts, finance accounts |
| Audit | audit logs, audit infractions, trigger functions |
| Workflow/RBAC | roles, user roles, role permissions, workflow definitions, workflow instances/history |
| Inventory | inventory items, stock transactions, warehouses, cycle counts, ABC analysis, material heat numbers, certificates |
| Production | shifts, production jobs, downtime logs, travelers, capacities, schedules, telemetry, OEE |
| Quality | PFMEA, control plans, gauge RnR, FAI, PPAP, APQP, complaints, SPC |
| Maintenance | machines, maintenance logs, preventive maintenance schedules |
| Tooling | tool assets, tool life logs, refurbishment tickets, drawing vault |
| Analytics | KPIs, revenue, machine utilization, vendor defects |
| HRMS | employees, tasks, leaves, attendance |

### SQL vs Runtime Mismatch

| SQL capability | Runtime backend status |
|---|---|
| RFQs | NOT VERIFIED in Prisma/Nest controllers |
| Quotations | NOT VERIFIED in Prisma/Nest controllers |
| Journal entries | NOT VERIFIED |
| Payment receipts ledger | NOT VERIFIED |
| Global audit trigger table | NOT VERIFIED in Prisma runtime |
| Workflow definitions/instances | NOT VERIFIED in runtime workflow engine |
| Role/permission tables | NOT VERIFIED in runtime authorization; app uses enum roles |
| Cycle counts/ABC analysis | NOT VERIFIED |
| Maintenance and PM | NOT VERIFIED |
| Tool life/refurbishment | NOT VERIFIED |
| APQP/SPC/PPAP/customer complaints | NOT VERIFIED |
| Analytics tables/materialized views | NOT VERIFIED |
| RLS policies | NOT VERIFIED because app does not set `app.current_tenant` |

### RLS Finding

The SQL tree contains both:

- 188 `ENABLE ROW LEVEL SECURITY` matches.
- 17 `DISABLE ROW LEVEL SECURITY` matches.

This is a production risk because the runtime Nest/Prisma layer does not show a request-scoped `SET LOCAL app.current_tenant = ...` or equivalent. SQL comments also acknowledge disabling RLS to bypass connection pool tenant state issues.

Production conclusion: **RLS exists as migration intent, not as verified runtime isolation.**

## Reporting and Search Audit

### Reports

The runtime backend exposes `GET /api/v1/reports/dashboard`.

Findings:

- Uses real Prisma reads.
- Loads full cost summaries, inventory batches, inspections, cost events, and MSDRs without pagination.
- Uses assumptions such as 160 hours per machine type for utilization.
- Has no date range, company, plant, warehouse, customer, vendor, or project filters.
- Has no detailed reports or exports.
- Has no reconciliation tests for totals.

### Search

The runtime backend exposes unversioned `GET /search?q=...`.

Findings:

- Searches projects, materials, customers, vendors.
- Does not filter by tenant/company/plant/role.
- Uses `contains` queries that can become expensive at scale.
- No result authorization trimming is verified.
- No endpoint contract alignment with `/api/v1` is verified.

## Test and Quality Audit

### Commands Run

| Command | Result |
|---|---|
| `cmd /c npm run build` | Passed |
| `cmd /c npm run test` | Timed out without useful result |
| Explicit 5-spec Jest run | Passed: 5 suites, 5 tests |
| `cmd /c npm run test:e2e` | Failed |

### E2E Failure

`npm run test:e2e` fails before app init because `AuthModule` requires `JWT_SECRET`. The e2e test imports the full `AppModule` but does not supply required test environment variables. Cleanup then also fails because `app` is undefined.

This is a test harness defect, and it blocks automated confidence for production readiness.

### Test Coverage Gaps

- No full lifecycle e2e test from project creation through closure.
- No negative workflow transition tests.
- No concurrent inventory issue tests.
- No role and object-permission tests.
- No tenant/company/plant/warehouse isolation tests.
- No idempotency tests.
- No report total reconciliation tests.
- No migration drift test comparing Prisma schema and SQL migrations.
- No API contract test comparing frontend calls to backend routes.

## Performance and Scalability Audit

### Strengths

- Some endpoints paginate list reads.
- Core write flows use transactions.
- Some dashboard/list operations use `Promise.all`.
- Prisma query construction reduces SQL injection risk.

### Risks

| Risk | Severity | Detail |
|---|---|---|
| Reports are unbounded | High | Dashboard reads entire tables for summaries |
| Project detail is heavy | High | Fetches many relations including inventory transactions |
| Search is unscoped and contains-based | High | Can degrade without proper indexes and tenant filters |
| Inventory write loops are per-item | Medium | GRN and issue loops perform multiple reads/writes per item |
| No lock strategy | Critical | Concurrent inventory changes can corrupt quantities |
| No query budget or timeout | Medium | Backend does not enforce max execution time per request |
| No load tests | High | Production throughput is NOT VERIFIED |
| No migration performance validation | High | Index migration intent exists, but runtime query plans are NOT VERIFIED |

## Backend and Database Scorecard

| Area | Score / 10 | Reason |
|---|---:|---|
| Backend architecture | 6 | Modular NestJS baseline, but no request context, idempotency, or object permissions |
| API contract | 5 | Many endpoints exist, but validation and versioning are inconsistent |
| Auth | 5 | JWT/RBAC baseline, but refresh/session/object scope gaps |
| Authorization | 3 | Route roles only; no data-scope enforcement |
| Validation | 4 | Global pipe plus DTOs, but many `any` and weak ID validators |
| Transactions | 6 | Core writes are transactional, but no concurrency control |
| Workflow | 4 | Simplified flow works, but state changes are scattered and contradictory |
| Inventory integrity | 4 | Batch/stock ledger exists, but no locking/FIFO/reservation enforcement |
| Finance integrity | 3 | Invoice/payment marker only; no ledger/reconciliation |
| Runtime Prisma schema | 5 | Rich model, but inconsistent audit/isolation and unused models |
| SQL migration layer | 4 | Broad enterprise schema intent, but large runtime mismatch |
| RLS/tenant isolation | 2 | SQL exists, runtime enforcement NOT VERIFIED |
| Audit trail | 3 | Activities/cost events exist; global before/after audit not runtime-verified |
| Reporting | 3 | Dashboard only, unbounded and assumption-heavy |
| Testing | 3 | Build passes; direct specs pass; aggregate tests hang; e2e fails |
| Production readiness | 4 | Useful prototype backend, not safe for enterprise production |

## Phase 0 Backend and Database Blockers

| Issue | Severity | Recommended fix |
|---|---|---|
| No company/plant/warehouse isolation enforcement | Critical | Add request context, scoped Prisma helpers, object permission checks, and isolation tests |
| No backend idempotency | Critical | Add idempotency key table/middleware with request hash, response persistence, replay behavior |
| Inventory concurrency unsafe | Critical | Add row locks or optimistic versions, DB non-negative constraints, and concurrent issue tests |
| RLS not runtime verified | Critical | Either set tenant session variables per transaction/request or remove RLS claims from production posture |
| Payment is not a ledger | Critical | Add receipt table, partial payments, deductions, reconciliation, aging, and closure gate |
| Closure can occur from invoiced stage | Critical | Require settled receivable or explicit authorized write-off workflow |
| Workflow state changes are scattered | Critical | Centralize transitions in a state machine service |
| Missing RFQ/quotation/accounts payable runtime | Critical | Promote SQL artifacts into Prisma models/controllers/services/tests or remove from claimed scope |
| E2E test harness fails | High | Provide test env config and mock/seed DB strategy |
| Aggregate backend test command hangs | High | Fix Jest lifecycle/open handles and make CI fail fast |
| Weak DTO coverage | High | Replace `any`, add UUID/enum/range validators |
| Reports unbounded | High | Add filters, pagination/aggregation queries, indexes, and reconciliation tests |

## Recommended Backend Remediation Plan

### Phase 0: Safety Foundation

1. Add `RequestContextService` with user, role, company, plant, warehouse scope, request ID, and idempotency key.
2. Add scoped repository/helper methods so every Prisma query carries authorization filters.
3. Add object-permission checks for project, warehouse, invoice, dispatch, and master data access.
4. Add idempotency middleware and persistence.
5. Add inventory versioning or row locks and database check constraints.
6. Fix Jest aggregate command and e2e environment setup.
7. Add lifecycle e2e tests for the current simplified production path.

### Phase 1: Contract Hardening

1. Replace all `any` bodies with DTOs.
2. Use `@IsUUID`, `@IsEnum`, `@Min`, `@Max`, and pagination bounds.
3. Add OpenAPI generation and contract tests.
4. Align all endpoints under `/api/v1` or intentionally document exceptions.
5. Standardize response and error envelopes.

### Phase 2: Database Alignment

1. Decide whether Prisma schema or raw SQL migrations are the source of truth.
2. Remove dormant SQL claims or wire them into runtime Prisma/Nest modules.
3. Add migration drift checks in CI.
4. Normalize audit, soft delete, tenant, company, plant, and version columns.
5. Add database constraints for money, quantity, status, and uniqueness by company/plant where required.

### Phase 3: Manufacturing Integrity

1. Implement reservations/allocation/FIFO.
2. Add accounts payable and vendor bill booking after GRN.
3. Add RFQ, quotation, customer PO conversion.
4. Add assembly, trial, final trial, packing gates.
5. Add dedicated treatment/process workflows or formalize subcontracting templates.

### Phase 4: Observability and Operations

1. Add structured request logging with correlation IDs.
2. Add audit log middleware for create/update/delete.
3. Add metrics for request latency, DB latency, queue/cron runs, and workflow failures.
4. Add readiness checks for DB, migrations, env vars, and background jobs.
5. Add backup/restore and migration rollback runbooks.

## Final Determination

The backend and database provide a promising skeleton for ToolRoomOS, but they do not yet meet production standards for enterprise manufacturing operations.

Release status: **BLOCKED**.

Minimum release condition: close all Phase 0 blockers, prove tenant/object isolation, prove inventory concurrency safety, fix backend/e2e test reliability, and reconcile the runtime Prisma schema with the raw SQL database migration surface.
