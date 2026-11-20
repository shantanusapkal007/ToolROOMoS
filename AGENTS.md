# ToolRoomOS — AI Agent Context, Architecture & Operating Guide 🏭

> **Notice for all AI Agents (Antigravity, Claude Code, Cursor, Codex, etc.)**:  
> **DO NOT SCAN THE ENTIRE REPOSITORY.** Everything you need to understand the architecture, code logic, manufacturing business logic, state machines, design systems, and execution commands is codified in this single document.

---

##  Table of Contents
1. [Stack & Quick Run Reference](#1-stack--quick-run-reference)
2. [Domain & Business Logic (The Real-World Toolroom)](#2-domain--business-logic-the-real-world-toolroom)
   - [What Makes a Toolroom Different (ETO Model)](#what-makes-a-toolroom-different-eto-model)
   - [The 6-Layer Database Philosophy](#the-6-layer-database-philosophy)
   - [The Complete Manufacturing Lifecycle (State Machine)](#the-complete-manufacturing-lifecycle-state-machine)
   - [The 13 Immutable Business Rules](#the-13-immutable-business-rules)
3. [Backend Code Logic & Architecture](#3-backend-code-logic--architecture)
   - [Framework & Tech Stack](#backend-framework--tech-stack)
   - [API Envelope & Standardization](#api-envelope--standardization)
   - [Core Engines (Sequence, Audit, EventBus)](#core-engines-sequence-audit-eventbus)
   - [Prisma ORM & Transactional Patterns](#prisma-orm--transactional-patterns)
   - [Authentication, RBAC & Context](#authentication-rbac--context)
4. [Frontend Code Logic & UI Architecture](#4-frontend-code-logic--ui-architecture)
   - [Framework & App Router Structure](#frontend-framework--app-router-structure)
   - [API Client & Next.js Proxy Pattern](#api-client--nextjs-proxy-pattern)
   - [Design System & Semantic Token Rules (Crucial)](#design-system--semantic-token-rules-crucial)
   - [Smart Components & UI Standards](#smart-components--ui-standards)
5. [Critical Agent Gotchas & Rules of Engagement](#5-critical-agent-gotchas--rules-of-engagement)

---

## 1. Stack & Quick Run Reference

Refer to [RUN_GUIDE.md](./RUN_GUIDE.md) for full operational steps.

### Starting Services
```bash
# 1. Start Database, Redis, and Backend in Docker
docker compose up -d postgres redis backend

# 2. Start Frontend locally on host (Next.js Turbopack)
npm run dev --prefix frontend
```

### Port Mapping & Credentials
| Service | Host Port | Internal Port | URL / Health Check | Default Credentials |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `3000` | `3000` | [http://localhost:3000](http://localhost:3000) | `admin@toolroom.com` / `admin123` |
| **Backend API** | `4000` | `4000` | [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health) | JWT Bearer Auth |
| **PostgreSQL** | `5433` | `5432` | `postgresql://root:rootpassword@localhost:5433/toolroomos` | Database: `toolroomos` |
| **Redis** | `6380` | `6379` | `redis://localhost:6380` | - |

---

## 2. Domain & Business Logic (The Real-World Toolroom)

### What Makes a Toolroom Different (ETO Model)
ToolRoomOS is **not** a standard repetitive mass-manufacturing ERP. It is an **Engineer-to-Order (ETO)** operating system built for high-mix, low-volume, high-precision industrial toolrooms (manufacturing press tools, plastic injection moulds, jigs, fixtures, gauges, and precision prototype tooling).

* **The Golden Rule**: *“The software records reality; the software never stops reality.”*  
  If engineering changes on the shop floor or material arrives before formal paperwork, the system allows progress while capturing audit trails and requiring approval checkpoints rather than deadlocking the factory floor.
* **Capture Once, Reuse Everywhere**: Data entered during RFQ/Estimation flows into Engineering (BOM & Routing), feeds Procurement (PRN & PO), guides Production (MSDR & Job Cards), verifies Quality (Inspections & NCR), and computes Finance (Cost Rollups & Invoicing). No duplicate data entry is ever permitted.

---

### The 6-Layer Database Philosophy
The PostgreSQL schema (`backend/prisma/schema.prisma`) represents the **Digital Twin** of the plant partitioned into six logical layers:

```
[Layer 1: Master Data]      --> Companies, Plants, Machines, Materials, Operations, Vendors, Customers
         │
[Layer 2: Business Objects]  --> Projects (The Single Source of Truth at the center of the universe)
         │
[Layer 3: Business Docs]     --> Drawings, BOMs, PRNs, POs, GRNs, Issue Slips, MSDRs, Invoices
         │
[Layer 4: Operational Events]--> Project Timeline, Activity Logs, Inventory Ledger, Job Card Logs
         │
[Layer 5: Financial Outcomes]--> Real-time Cost Rollups (Machine + Labour + Material + Outside + Freight)
         │
[Layer 6: Analytics]         --> OEE, WIP Valuations, Schedule Adherence, Margin Reports
```

---

### The Complete Manufacturing Lifecycle (State Machine)

Every manufacturing project moves through an exact, sequential state machine (`enum ProjectStatus`):

```
CREATED ──► ENGINEERING ──► MATERIAL_PLANNING ──► PROCUREMENT ──► MATERIAL_AVAILABLE
                                                                         │
CLOSED ◄── PAYMENT_PENDING ◄── INVOICED ◄── DISPATCHED ◄── DISPATCH_READY ◄── INSPECTION ◄── PRODUCTION
```

#### Detailed Stage Progression:
1. **RFQ & Estimation (`RfqHeader`, `RfqCostEstimate`, `Quotation`)**:
   - Customer submits RFQ with 2D/3D drawings.
   - Engineering prepares rough cost estimates (Material + Machine Hours + Subcontracting + Margin).
   - Formal Quotation generated (`QUOTED`). When customer issues PO, RFQ transitions to `WON` and spawns a Project.
2. **Project Creation (`CREATED` -> `ENGINEERING`)**:
   - Project ID generated with prefix `KTD-` (e.g., `KTD-2026-001`).
   - Project Cost Summary initialized with 0 costs and contract revenue.
   - Assigned to a Plant and Customer.
3. **Engineering (`ENGINEERING` -> `MATERIAL_PLANNING`)**:
   - CAD Drawing registered with revision tracking (`ProjectDocument`, `DocumentRevision`).
   - Multi-level Bill of Materials (`BillOfMaterialHeader`, `BillOfMaterialItem`) created.
   - Manufacturing Routing (`RoutingHeader`, `RoutingOperation`) defines sequence of machines (CNC Milling, EDM, Wire Cut, Lathe, Grinding, Fitting).
   - Approval locks Engineering; changes require a formal Revision.
4. **Procurement & Material Planning (`PROCUREMENT`)**:
   - Purchase Requisition Note (`PurchaseRequestHeader`, `PurchaseRequestItem` / PRN) generated directly from BOM gaps.
   - PRN submitted, reviewed, and approved (`PENDING_APPROVAL` -> `APPROVED`).
   - PRN converted to Vendor Purchase Order (`PurchaseOrderHeader`, `PurchaseOrderItem`).
   - Supports multi-project PO consolidation (different projects on distinct PO line items).
5. **Goods Receipt & Inventory (`MATERIAL_AVAILABLE`)**:
   - Stores receives shipment and records Goods Receipt Note (`GoodsReceiptHeader`, `GoodsReceiptItem` / GRN).
   - Records Heat Number, Mill Test Certificate (MTC), and Batch Number for strict raw-material traceability.
   - Automatically increments `InventoryStock` and appends an immutable `InventoryTransaction` (`GRN_RECEIPT`).
6. **Material Issue (`PRODUCTION`)**:
   - Physical raw stock issued to shop floor via Material Issue Slip (`MaterialIssueHeader`, `MaterialIssueItem`).
   - Decrements `InventoryStock`, moves cost to Work-In-Progress (`WipLedger`), and project advances to `PRODUCTION`.
7. **Production & Shop Floor Execution (`PRODUCTION`)**:
   - Job Cards (`JobCard`, `JobCardTimeLog`) issued to operators.
   - Operators log Machine Shop Daily Reports (`MsdrHeader`, `MsdrOperation` / MSDR) tracking:
     * Setup Time & Cutting Time (Machining Hours)
     * Operator Labour Hours
     * Scrap & Rework count
   - Automatically updates Machine OEE logs (`OeeDailyLog`) and accumulates machine/labour costs into `ProjectCostSummary`.
8. **Outside Processing / Subcontracting (`SubcontractOrder`, `SubcontractReceipt`)**:
   - Special operations (Heat Treatment, Hard Chrome Plating, Blackening, Gun Drilling) sent to approved vendors.
   - Outward delivery challan created; vendor charges flow directly into project actual costs.
9. **Quality Gate & Inspection (`INSPECTION` -> `DISPATCH_READY`)**:
   - Final QC inspector measures critical dimensions against drawing tolerances (`InspectionHeader`, `InspectionMeasurement`).
   - Quantity partitioned: $\text{Passed} + \text{Rework} + \text{Scrap} = \text{Produced Quantity}$.
   - If rejected, Non-Conformance Report (`NcrReport`) raised. Open NCRs strictly block dispatch.
   - Rework logged via `PartReworkOrder`.
10. **Dispatch (`DISPATCH_READY` -> `DISPATCHED`)**:
    - Packing list and Delivery Challan / Dispatch Note (`DispatchNote`, `DispatchItem`) generated.
    - Only Passed Quantity may be dispatched.
11. **Finance, Invoicing & Project Closure (`INVOICED` -> `CLOSED`)**:
    - Tax Invoice (`InvoiceHeader`, `InvoiceItem`) generated.
    - Final Project Profitability locked: $\text{Profit} = \text{Invoice Revenue} - (\text{Actual Material} + \text{Machine Cost} + \text{Labour Cost} + \text{Subcontract} + \text{Logistics})$.
    - Once payment is fully logged (`InvoicePayment`), Project is marked `CLOSED` and becomes permanently **read-only**.

---

### The 13 Immutable Business Rules

* **Rule 1 (Project Single Parent)**: Every Project belongs to exactly one Customer and has exactly one primary contract/PO document.
* **Rule 2 (Document Immutability)**: Documents cannot be overwritten. Updates generate an immutable new `DocumentRevision`.
* **Rule 3 (Engineering Lock)**: Once procurement or production starts, BOM and routing are locked. Changes require a revision workflow.
* **Rule 4 (No Freeform Purchasing)**: PO line items must originate from BOM Material Requirements or approved PRNs—never created without project context.
* **Rule 5 (Non-Negative Inventory)**: Inventory stock can never drop below zero. Every stock change requires an audit transaction (GRN, Issue, Return, Adjustment, Scrap).
* **Rule 6 (Calculated Hours Only)**: Machine hours and labour hours are computed from start/end logs or setup+cutting logs; never manually estimated.
* **Rule 7 (Quality Gate Balance)**: $\text{Passed Qty} + \text{Rework Qty} + \text{Scrap Qty} \equiv \text{Produced Qty}$. Open NCRs block dispatch.
* **Rule 8 (Dispatch Constraint)**: Dispatch quantity cannot exceed Passed QC quantity.
* **Rule 9 (Automated Costing)**: Operational costs are calculated outcomes, never manual inputs.
  * $\text{Machine Cost} = \text{Logged Cutting Hours} \times \text{Machine Hourly Rate}$
  * $\text{Labour Cost} = \text{Operator Hours} \times \text{Labour Rate}$
* **Rule 10 (10-Point Traceability)**: Every manufactured part must trace: Project, Drawing, Revision, Material Grade, Heat Number, Vendor, Machine, Operator, Inspection Gate, and Dispatch Note.
* **Rule 11 (Forward-Only State Machine)**: Lifecycle moves forward. Rollbacks require elevated supervisor approval.
* **Rule 12 (Mandatory Approvals)**: Revisions, budget overruns, scrap write-offs, and project closures require formal approval records (`Approval` model).
* **Rule 13 (Soft Deletion)**: Physical `DELETE` is prohibited on business records. Use `status = 'DELETED'` or `isActive = false` to preserve historical auditability.

---

## 3. Backend Code Logic & Architecture

### Backend Framework & Tech Stack
* **Runtime**: Node.js v20 (Alpine inside Docker)
* **Framework**: NestJS 11 (Modular Architecture)
* **ORM**: Prisma 7 with PostgreSQL adapter (`@prisma/adapter-pg`)
* **Context**: `nestjs-cls` (Continuation Local Storage) for tenancy, user ID, and plant tracking
* **Logging**: `nestjs-pino` with structured JSON output
* **Security**: `helmet`, `bcrypt`, JWT Auth Guard with Passport

### API Envelope & Standardization
All backend responses are intercepted by `TransformInterceptor` (`backend/src/common/interceptors/transform.interceptor.ts`) to return a strict envelope:

```typescript
export interface StandardApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  message: string;
}
```

* **Exception Filters**:
  * `PrismaExceptionFilter`: Translates Prisma errors (e.g. `P2002` Unique Constraint -> 409 Conflict; `P2025` Not Found -> 404).
  * `AllExceptionsFilter`: Global safety net formatting errors into `{ success: false, message: ... }`.

### Core Engines (Sequence, Audit, EventBus)
* **`SequenceEngine` (`backend/src/common/sequence.engine.ts`)**:
  Atomically generates sequential, zero-padded document numbers using database locks:  
  Format: `[PREFIX]-[YEAR]-[NUMBER]` (e.g., `RFQ-2026-0001`, `PO-2026-00042`, `PRN-2026-0012`).
* **`AuditEngine` (`backend/src/common/audit.engine.ts`)**:
  Automatically snapshots model changes (`AuditLog`), computes object diffs on `UPDATE`, and records `performedBy` using CLS context.
* **`EventBus` (`backend/src/common/event.bus.ts`)**:
  Wraps `EventEmitter2` for decoupled, asynchronous domain event handling (e.g., `order.approved`, `grn.received`).

### Prisma ORM & Transactional Patterns
* Multi-record mutations **must** always use `prisma.$transaction(async (tx) => { ... })` to guarantee consistency across projects, timelines, costs, and inventory.
* Prisma Client is configured in `PrismaService` (`backend/src/prisma/prisma.service.ts`) using a pooled `pg.Pool` connection.

### Authentication, RBAC & Context
* **Roles (`enum SystemRole`)**: `ADMIN`, `SALES`, `SALES_ENGINEER`, `ENGINEERING`, `PURCHASE`, `STORES`, `PRODUCTION`, `QUALITY`, `FINANCE`.
* **Guards**:
  * `@UseGuards(JwtAuthGuard)`: Validates Bearer JWT.
  * `@UseGuards(RolesGuard)` + `@Roles(SystemRole.ADMIN, SystemRole.ENGINEERING)`: Role-based route enforcement.
  * `@UseGuards(PermissionsGuard)` + `@Permissions('projects.write')`: Fine-grained permission claims.

---

## 4. Frontend Code Logic & UI Architecture

### Frontend Framework & App Router Structure
* **Framework**: Next.js 16 (App Router) with React 19 and Turbopack.
* **Styling**: Tailwind CSS v4 with custom semantic design tokens.
* **State Management**:
  * Server State: `@tanstack/react-query` (cached, query-key driven hooks in `src/services/`).
  * UI State: `zustand` stores in `src/store/` (`useSidebarStore`, `useToolbarStore`, `useDensityStore`).

### API Client & Next.js Proxy Pattern
* **Base API Client**: `frontend/src/lib/api.ts` (Axios instance with JWT interceptor, retry logic, and UUID request-id generation).
* **Next.js Proxy Route**: `frontend/src/app/api/v1/[...path]/route.ts`  
  Proxies all `/api/v1/*` requests directly to backend at `http://localhost:4000` (or `http://backend:4000` inside containers), eliminating browser CORS complications.

### Design System & Semantic Token Rules (Crucial)
> **AGENTS MUST FOLLOW THESE DESIGN RULES AT ALL TIMES (from `frontend/AGENTS.md`)**:

1. **Semantic Colors Only**:
   * Use **only** semantic tokens defined in `globals.css`:
     * Backgrounds: `bg-primary`, `bg-canvas`, `bg-white` (card background in light/dark)
     * Text: `text-ink` (primary content), `text-cool-gray`, `text-mute` (labels/subtitles)
     * Borders: `border-border-gray`
     * Status Badges: `bg-semantic-success-subtle`, `text-semantic-success-dark`, `bg-semantic-danger-subtle`, `text-semantic-danger-dark`, `bg-semantic-warning-subtle`, `text-semantic-warning-dark`
   * **STRICTLY FORBIDDEN**: Raw inline Tailwind palette classes (`text-zinc-800`, `bg-emerald-50`, `bg-red-50`, `bg-zinc-900`) and arbitrary hex codes (`#123456`).
2. **Text Contrast & Dark Mode**:
   * Never use dark gray text (`text-zinc-700`, `text-zinc-800`) for table values or primary headers—they cause unreadable black-on-black rendering in Dark Mode.
   * Always use `text-ink` for headings, table cell values, and high-emphasis labels.
3. **Card & Layout Standard**:
   * All sections must be enclosed in standard design cards:
     `className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle"`
   * Do not leave un-enclosed floating text, raw buttons, or floating toolbars.
   * Standard Module Header:
     `className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"`
4. **Button & Input Components**:
   * Use the standardized `Button` component (`variant="primary" | "secondary" | "white" | "danger"`).
   * Inputs must use `Input`, `Select`, `Combobox` from `src/components/ui/`.

### Smart Components & UI Standards
* **`SmartTable` (`src/components/ui/SmartTable.tsx`)**: Reusable data grid supporting sorting, multi-column filtering, pagination, CSV exports, and virtualized row rendering.
* **`SmartForm` (`src/components/ui/SmartForm.tsx`)**: Dynamic schema-driven forms with Zod validation.
* **`PremiumDrawer` & `Modal`**: Consistent slide-out detail inspectors and modal dialogs.
* **Authentic Document Exporters**:
  * `poExcelExporter.ts`, `prnExcelExporter.ts`, `grnExcelExporter.ts` (generate professional multi-sheet Excel workbooks with borders, company headers, and calculation formulas using `exceljs`).
  * `AuthenticPoDocument.tsx`, `AuthenticPrnDocument.tsx` (pixel-perfect print/PDF templates matching real Indian factory documents).

---

## 5. Critical Agent Gotchas & Rules of Engagement

1. **Never Run Unbounded TypeScript Scans on Host**:
   * Root `backend/tsconfig.json` does not have an `exclude` block. Running `tsc --noEmit` or raw `nest build` without `-p tsconfig.build.json` in `./backend` causes the TypeScript compiler to scan all 800+ packages in `node_modules` and lock up the process.
   * Always use: `cd backend && ./node_modules/.bin/tsc -p tsconfig.build.json --noEmit`.
2. **Non-Standard Host Ports**:
   * Host Postgres is on **`5433`**, NOT 5432.
   * Host Redis is on **`6380`**, NOT 6379.
   * Backend connects to internal container ports `5432` and `6379` via Docker networking.
3. **Database Relationships are Soft-Mapped in Several Models**:
   * Some foreign IDs (such as `plantId`, `customerId`) in legacy/flexible schemas may support string codes or UUIDs. Services resolve these dynamically using fallbacks.
4. **No Destructive DB Operations**:
   * Never drop or truncate tables. ToolRoomOS maintains immutable historical manufacturing records.
