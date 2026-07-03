# ToolRoom ERP – Architecture & Technical Reference

This document provides a comprehensive overview of the actual, implemented architecture and core systems powering the ToolRoom ERP platform today.

## 1. Core Architecture

ToolRoom ERP is currently built as a highly robust **Modular Monolith**.

### 1.1 Technology Stack
*   **Frontend:** Next.js 14, React, Tailwind CSS
*   **Backend:** Go (Golang) using standard REST APIs and Domain-Driven design concepts.
*   **Primary Database:** PostgreSQL 16+ (managing all relational business data).
*   **Caching:** Redis (currently utilized exclusively for ultra-fast, secure JWT Auth Session management).
*   **Infrastructure:** Dockerized containers orchestrated via Docker Compose for rapid deployment.

### 1.2 Modular Monolith Design
The backend is logically separated into distinct business domains (`internal/analytics`, `audit`, `crm`, `inventory`, `production`, `quality`, etc.). While they run within a single Go process for maximum performance and simplicity, they maintain strict module boundaries.

## 2. Enterprise Core Systems

### 2.1 Multi-Tenant & Multi-Company Isolation
The platform securely serves large organizations through a strict Multi-Tenant hierarchy.
*   **Logical Isolation:** Every relevant table in the PostgreSQL database contains a `tenant_id` (and often a `company_id`). 
*   **Middleware Enforcement:** The Go backend utilizes a `TenantResolution` middleware that automatically extracts the Tenant ID from the authenticated user's JWT claims and injects it into the request context. This ensures that users can never accidentally query data belonging to another tenant.

### 2.2 Global Audit Trail & Production Timeline
One of the most advanced features currently implemented in the system is the **Global Audit Engine**.

*   **Change Tracking:** Every significant mutation in the system generates an `audit_log` entry. The database securely tracks the `resource` (e.g., Work Order, Machine), the exact `user_id`, the timestamp, and a JSON diff of the `old_value` and `new_value`.
*   **Null-Safe Processing:** The backend Go service safely handles complex `NULL` JSON database values using `*json.RawMessage` pointers, ensuring the system never crashes during data extraction.
*   **Live Production Timeline:** The frontend Dashboard (e.g., the Production page) dynamically fetches these audit logs via the `/api/v1/audit/logs` REST endpoint. This allows managers to see a chronological, verifiable timeline of exactly what is happening on the shop floor without relying on hardcoded mock data.

## 3. Security & Authentication

*   **Stateless JWT:** The API relies on secure JSON Web Tokens for authentication.
*   **Redis Session Store:** To ensure JWTs can be immediately revoked (e.g., during a security breach or manual logout), active sessions are cached in Redis. The system checks Redis first before falling back to PostgreSQL, providing sub-millisecond session validation.

## 4. Future Architectural Roadmap

While the foundation is solid, the following enterprise patterns are planned for future implementation to transition from a Monolith to an Event-Driven Distributed System:
*   *Planned:* RabbitMQ / Kafka for Event-Driven Architecture (EDA).
*   *Planned:* Transactional Outbox patterns for guaranteed message delivery.
*   *Planned:* WebSockets for live push-notifications (replacing REST API polling).
*   *Planned:* Live mathematical engines for OEE calculations, Manufacturing Cost Rollups, and FEFO inventory allocation.
