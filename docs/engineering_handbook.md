# Engineering Handbook

This document defines how engineering is executed. It dictates the mandatory contracts, coding conventions, and delivery pipelines that prevent entropy as the platform scales.

## 1. Mandatory Module Contract
Every new module (e.g., Inventory, Quality) must implement the exact same architectural structure. No exceptions. This guarantees predictable evolution over time.

```text
Entity
  ↓
DTO
  ↓
Validation
  ↓
Repository
  ↓
Service
  ↓
Commands
  ↓
Queries
  ↓
Events
  ↓
Policies
  ↓
Permissions
  ↓
Workflow
  ↓
Audit
  ↓
Notifications
  ↓
Reports
  ↓
Dashboard
  ↓
API
  ↓
Frontend
  ↓
Tests
  ↓
Documentation
```

## 2. Coding Standards & Governance
Every repository across the platform follows strict, automated conventions:
* **Naming Conventions:** Enforced via linters (e.g., `golangci-lint`, `eslint`).
* **Folder Structure:** Domain-driven structure mirroring the Module Contract.
* **API Response Format:** Strictly standardized `JSend` or `JSON:API` wrapping format for all endpoints (data, error, meta, pagination).
* **Logging Format:** Structured JSON logging containing `tenant_id`, `trace_id`, and `user_id`.
* **Database Migrations:** Forward-only, additive migrations ensuring zero-downtime deployments.
* **Git Strategy & Branching:** Trunk-based development or GitHub Flow with short-lived feature branches.
* **Commit Conventions:** Conventional Commits (`feat:`, `fix:`, `chore:`).
* **ADRs:** Mandatory Architecture Decision Records for any cross-domain or infrastructural changes.
* **Deprecation Policy:** Defined sunsetting window for any deprecated API or capability.

## 3. QA Standards & Testing
Testing is not an afterthought; it is embedded in the Definition of Done.
* **Unit Testing:** Minimum 80% coverage on domain logic (Services, Commands, Queries).
* **Integration Testing:** Mandatory tests spanning the Repository layer to PostgreSQL/Redis.
* **API Testing:** Automated contract testing for OpenAPI specifications.

## 4. CI/CD & Release Process
* All PRs must pass CI gates (Lint, Unit, Integration, Security Scan).
* Merges to `main` trigger automated staging deployments.
* Release Candidates (RC) are cut using Semantic Versioning (`v1.2.0-rc.1`).
* Production deployments are fully automated and trigger schema migrations via the infrastructure layer prior to pod rollouts.
