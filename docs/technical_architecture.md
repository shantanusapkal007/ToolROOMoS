# Technical Architecture

This document defines the systemic structures, non-functional requirements, performance budgets, and baseline tech stack for the Enterprise Manufacturing Operating System.

## 1. System Architecture (4-Layer Reference Architecture)
We strictly separate platform capabilities from manufacturing-specific applications.

```text
Presentation Layer
│
├── Web Portal
├── Customer Portal
├── Vendor Portal
├── Operator Portal
├── Mobile Apps
│
Application Layer
│
├── CRM
├── Engineering
├── Production
├── Quality
├── Inventory
├── Procurement
├── Finance
├── Maintenance
├── Analytics
│
Platform Layer
│
├── Identity
├── Configuration
├── Workflow
├── Business Rules
├── Metadata
├── Forms
├── Reports
├── Dashboard
├── Files
├── Notifications
├── Scheduler
├── Search
├── Licensing
├── Feature Flags
├── Audit
├── Integration
│
Infrastructure Layer
│
├── PostgreSQL
├── Redis
├── RabbitMQ
├── MinIO
├── Kong
├── Prometheus
├── Grafana
├── Loki
├── Tempo
```

## 2. Platform Standards
Every feature built on the Application Layer must automatically support the following without custom reimplementation:
* RBAC
* Audit Trail
* Activity Timeline
* Version History
* Attachments & Comments & Tags
* Search & Filters & Saved Views
* Export / Import
* Bulk Operations
* Soft Delete / Archive / Restore
* Notifications
* Workflow
* Business Rules
* Localization
* Multi-tenancy
* API & Documentation
* Unit Tests & Integration Tests

## 3. Tech Stack
* **Frontend:** Next.js, React, Tailwind (governed by internal Design System).
* **Backend:** Go (Gin, sqlx).
* **Databases:** PostgreSQL (Relational), Redis (Caching).
* **Message Broker:** RabbitMQ (Event Bus strictly).
* **Storage:** MinIO (Object Storage).
* **Gateway:** Kong.
* **Observability:** OpenTelemetry, Prometheus, Grafana, Loki, Tempo.

## 4. Non-Functional Requirements (NFRs) & Performance Budgets
Enterprise customers evaluate NFRs as rigorously as features.
* **Availability:** 99.9%+ Uptime SLA.
* **Security:** SOC2/ISO27001 readiness; Immutable audit trails.
* **Accessibility:** WCAG 2.1 AA compliant.
* **Performance Budgets:**
  * Dashboard initial load: < 2 seconds
  * Page navigation: < 300 ms
  * Search response: < 500 ms
  * CRUD operation: < 200 ms
  * Background jobs: Configurable SLA based on tenant
* **Scalability:** Must support millions of records and thousands of concurrent users per deployment.

## 5. Compatibility Policy
* **Browsers:** Latest 2 versions of Chrome, Edge, Firefox, Safari.
* **Database:** PostgreSQL N and N-1 major versions.
* **APIs:** Strict semantic versioning. v1 APIs supported for a minimum of 24 months after v2 release.
* **Upgrades:** Schema migrations must be backward compatible (no dropped columns in active use) to support zero-downtime tenant upgrades.
