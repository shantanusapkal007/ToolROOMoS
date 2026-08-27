# Architecture Blueprint
*ToolRoomOS – Manufacturing Operating System*
*Version 2.0*

## Purpose
ToolRoomOS is not built as a traditional ERP. It is built as a Manufacturing Operating System whose architecture mirrors the physical movement of work inside a toolroom.

The architecture is designed around one principle: **The software should behave exactly like the factory.**

The architecture does not revolve around software modules. It revolves around the manufacturing lifecycle. Every request, document, transaction, cost, approval, and report originates from a Project and moves through a predefined workflow until the project is completed.

The architecture guarantees:
- Zero duplicate information
- Complete traceability
- High data integrity
- Automatic workflow progression
- Automatic cost accumulation
- Simple deployment
- High maintainability

---

## 1. Core Architecture Philosophy
The system follows six architectural philosophies:

1. **Business First:** Business defines software. Software never defines business. Manufacturing workflows dictate Database, APIs, UI, Security, and Reports.
2. **Project First:** Project is the center of the entire system. Every operational component belongs to exactly one Project. Nothing exists outside the Project.
3. **Workflow First:** The architecture follows manufacturing (Engineering -> Purchase -> GRN -> Production -> ...). Software never allows skipping workflow stages unless explicitly authorized.
4. **Document First:** Documents are not attachments. Documents create business information and initiate workflows.
5. **Event First:** Every business activity becomes a system event (e.g., Material Received, Production Started). Events update the system automatically.
6. **Single Source of Truth:** Every piece of information exists only once. All other components reference it. No duplicated information.

---

## 2. System Architecture Layers
The system consists of six logical layers, each with a single responsibility.

### Layer 1 — Presentation Layer
**Purpose:** Provides the user interface.
**Technology:** Next.js 16, React 19, TypeScript, Tailwind CSS.
**Responsibilities:** Dashboard, Project Workspace, Document Viewer, Forms, Reports.
**Rules:** No business logic. Only presentation.

### Layer 2 — Application Layer
**Purpose:** Exposes business capabilities through REST APIs.
**Technology:** NestJS 11, TypeScript.
**Responsibilities:** Authentication, Authorization, Validation, API Routing, Request Processing.
**Rules:** Never contains business calculations. Only coordinates requests.

### Layer 3 — Workflow Layer
**Purpose:** Controls project movement.
**Responsibilities:** Workflow Validation, Stage Progression, Approval Rules, Status Management.
**Rules:** Guarantees manufacturing order (e.g., Engineering Completed -> Purchase Enabled).

### Layer 4 — Business Layer
**Purpose:** Contains manufacturing logic.
**Responsibilities:** Engineering, Purchase, Inventory, Production, Quality, Dispatch, Finance.
**Rules:** Business calculations, validations, decisions, and automation. No database code.

### Layer 5 — Persistence Layer
**Purpose:** Stores manufacturing information.
**Technology:** PostgreSQL 15, Prisma ORM.
**Responsibilities:** Master Data, Projects, Documents, Transactions, Financial Outcomes.
**Rules:** Strict foreign keys, Transactions, Audit History. No business logic.

### Layer 6 — Infrastructure Layer
**Purpose:** Provides platform services.
**Components:** Redis, Docker, Pino Logging, Health Checks, Rate Limiting (Throttler).

---

## 3. Technology Stack

### Frontend
- **Framework:** Next.js 16
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query + Zustand
- **Form Handling:** React Hook Form
- **Validation:** Zod
- **Tables:** TanStack Table
- **Charts:** Visx

### Backend
- **Framework:** NestJS 11
- **Language:** TypeScript
- **Validation:** class-validator / class-transformer
- **Authentication:** JWT (via @nestjs/jwt + Passport)
- **Authorization:** RBAC (Custom Guards)
- **API:** REST (versioned under `/api/v1/`)
- **Logging:** Pino (via nestjs-pino)
- **Scheduling:** @nestjs/schedule
- **Rate Limiting:** @nestjs/throttler

### Database
- **Engine:** PostgreSQL 15 (ACID, Foreign Keys, Transactions, Indexes, JSON Support)
- **ORM:** Prisma (Type Safety, Migration Support, Developer Productivity)

### Caching
- **Cache:** Redis (Session Cache, Temporary Data)

### File Handling
- **Approach:** Files (Excel, CSV) are parsed in-browser using PapaParse/xlsx and sent as structured JSON to the API. Reports and exports are generated in-memory and streamed to the browser for download.
- **Note:** No external object storage is currently in use. File storage (e.g., S3) can be added in the future if document/drawing upload is needed.

---

## 4. Runtime Architecture

**Standard API Flow:**
`User` -> `Next.js Application` -> `REST API` -> `Authentication` -> `Workflow Validation` -> `Business Logic` -> `PostgreSQL` -> `Response`

---

## 5. Security Architecture
- **Authentication:** JWT (Access + Refresh Tokens)
- **Authorization:** Role-Based Access Control (ADMIN, MANAGER, OPERATOR, VIEWER)
- **Password Storage:** bcrypt
- **Security Headers:** Helmet
- **Rate Limiting:** ThrottlerGuard (100 requests per 60 seconds)
- **CORS:** Configurable allowed origins
- **Audit:** Every modification tracked via audit logs.

---

## 6. Deployment Architecture

### Development
`Developer Machine` -> `Next.js (port 3000)` -> `NestJS (port 4000)` -> `Redis (port 6380)` -> `PostgreSQL (port 5432)`
*(PostgreSQL and Redis run as Docker containers via Docker Compose. Frontend and Backend run natively with hot-reload.)*

### Production (On-Premise / Factory Network)
`Factory Network` -> `Nginx` -> `Frontend` -> `Backend` -> `Redis` -> `PostgreSQL`
*(Everything deployed using Docker Compose.)*

---

## 7. Reliability & Scalability
- Frontend, Backend, and Database scale independently.
- Backend remains stateless. No component depends on local memory.
- Database transactions guarantee consistency.
- Idempotency prevents duplicate processing.
- Operational history is immutable. System failures never lose business data.
- **Monitoring:** Application Logs (Pino), Health Checks (`/health`, `/live`, `/ready`) ensure observability.

---

## Architecture Rules
1. Business defines architecture.
2. Projects are the root of the system.
3. Documents initiate workflows.
4. Workflows control business progression.
5. Business logic remains independent of infrastructure.
6. Every transaction is atomic and auditable.
7. APIs remain stateless.
8. The architecture mirrors the physical manufacturing process, ensuring that every software component directly represents a real-world factory activity.

## Final Architecture Principle
ToolRoomOS is not architected as a collection of software modules. It is architected as a digital factory. Every layer—from the user interface to the database—exists to faithfully represent how a manufacturing project moves through the factory, ensuring that information is captured once, reused everywhere, and transformed automatically into the next stage of work.
