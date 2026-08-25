# Technical Architecture

This document defines the systemic structures, non-functional requirements, performance budgets, and baseline tech stack for ToolRoomOS – the Manufacturing Operating System.

## 1. System Architecture (4-Layer Reference Architecture)
We strictly separate platform capabilities from manufacturing-specific applications.

```text
Presentation Layer
│
├── Web Portal
├── Operator Portal
│
Application Layer
│
├── Engineering
├── Production
├── Quality
├── Inventory
├── Procurement
├── Subcontracting
├── Finance
├── HR & Payroll
├── Maintenance
├── Assets
├── Reports & BI
│
Platform Layer
│
├── Identity & Auth (JWT + RBAC)
├── Workflow Engine
├── Forms Engine
├── Search
├── Audit Trail
├── Scheduler
├── Settings & Preferences
│
Infrastructure Layer
│
├── PostgreSQL
├── Redis
├── Docker / Docker Compose
├── Pino (Structured Logging)
```

## 2. Platform Standards
Every feature built on the Application Layer must automatically support the following without custom reimplementation:
* RBAC (Role-Based Access Control)
* Audit Trail
* Activity Timeline
* Search & Filters
* Export / Import (Excel, CSV)
* Workflow Stage Progression
* Business Rules & Validations
* API & Documentation
* Unit Tests & Integration Tests

## 3. Tech Stack
* **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS.
* **Backend:** NestJS 11, TypeScript.
* **Database:** PostgreSQL 15 (Relational, ACID, Foreign Keys, Transactions).
* **ORM:** Prisma (Type Safety, Migrations, Developer Productivity).
* **Caching:** Redis (Session Cache, Temporary Data).
* **Logging:** Pino (Structured JSON Logging via nestjs-pino).
* **Containerization:** Docker Compose (PostgreSQL, Redis).

## 4. Non-Functional Requirements (NFRs) & Performance Budgets
Enterprise customers evaluate NFRs as rigorously as features.
* **Availability:** 99.9%+ Uptime SLA.
* **Security:** Immutable audit trails; bcrypt password hashing; Helmet security headers.
* **Performance Budgets:**
  * Dashboard initial load: < 2 seconds
  * Page navigation: < 300 ms
  * Search response: < 500 ms
  * CRUD operation: < 200 ms
* **Scalability:** Must support large record sets and concurrent users per deployment.

## 5. Compatibility Policy
* **Browsers:** Latest 2 versions of Chrome, Edge, Firefox, Safari.
* **Database:** PostgreSQL N and N-1 major versions.
* **APIs:** REST APIs with versioned prefix (`/api/v1/`).
* **Upgrades:** Schema migrations must be backward compatible (no dropped columns in active use) to support zero-downtime upgrades.
