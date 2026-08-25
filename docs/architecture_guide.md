# ToolRoomOS – Architecture & Technical Reference

This document provides a comprehensive overview of the actual, implemented architecture and core systems powering the ToolRoomOS platform today.

## 1. Core Architecture

ToolRoomOS is built as a **Modular Monolith** with clear domain boundaries.

### 1.1 Technology Stack
*   **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
*   **Backend:** NestJS 11, TypeScript, REST APIs with Domain-Driven module boundaries.
*   **Primary Database:** PostgreSQL 15 (managing all relational business data).
*   **ORM:** Prisma (type-safe queries, schema migrations).
*   **Caching:** Redis (session cache, temporary data).
*   **Infrastructure:** Dockerized containers (PostgreSQL, Redis) orchestrated via Docker Compose.

### 1.2 Modular Monolith Design
The backend is logically separated into distinct business domains (`master-data/`, `engineering/`, `procurement/`, `production/`, `subcontracting/`, `logistics-finance/`, `hr/`, `maintenance/`, `assets/`, etc.). While they run within a single NestJS process for maximum performance and simplicity, they maintain strict module boundaries via NestJS modules.

## 2. Enterprise Core Systems

### 2.1 Role-Based Access Control (RBAC)
The platform enforces access through a strict RBAC system.
*   **Roles:** ADMIN, MANAGER, OPERATOR, VIEWER.
*   **Guard Enforcement:** The NestJS backend uses global `JwtAuthGuard` and `RolesGuard` that automatically extract user identity and role from the authenticated JWT and enforce access on every request.
*   **Permissions:** Fine-grained module-level permissions configurable per role via the RBAC settings UI.

### 2.2 Global Audit Trail & Activity Timeline
One of the most critical features is the **Audit Engine**.

*   **Change Tracking:** Every significant mutation generates an `audit_log` entry. The database tracks the entity type, entity ID, action, user, timestamp, and a JSON diff of old vs. new values.
*   **Live Production Timeline:** The frontend Dashboard dynamically fetches audit logs via the `/api/v1/audit-logs` REST endpoint, allowing managers to see a verifiable chronological timeline of shop floor activity.

## 3. Security & Authentication

*   **Stateless JWT:** The API relies on secure JSON Web Tokens (Access + Refresh) for authentication.
*   **Password Hashing:** bcrypt with salt rounds.
*   **Security Headers:** Helmet middleware enforces CSP, HSTS, X-Frame-Options, etc.
*   **Rate Limiting:** ThrottlerGuard limits requests to 100 per 60 seconds per IP.
*   **CORS:** Configurable allowed origins (defaults to localhost:3000 in development).

## 4. File Handling

Files (Excel, CSV) are parsed directly in the browser using PapaParse and xlsx libraries. The parsed structured data is sent to the API as JSON. Reports and exports are generated in-memory and streamed to the browser for download.

No external object storage service is currently in use. File/document storage (e.g., S3) can be added in the future when document/drawing upload features are needed.

## 5. Future Architectural Roadmap

While the foundation is solid, the following patterns are planned for future implementation:
*   *Planned:* WebSockets for live push-notifications (replacing REST API polling).
*   *Planned:* Object Storage (S3 or equivalent) for document and drawing uploads.
*   *Planned:* Background job processing for long-running operations (Excel imports, PDF generation).
*   *Planned:* Live mathematical engines for OEE calculations, Manufacturing Cost Rollups, and FEFO inventory allocation.
