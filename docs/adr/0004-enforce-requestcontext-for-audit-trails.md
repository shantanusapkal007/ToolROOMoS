# 4. Multi-Plant Tenant Data Scoping

Date: 2026-08-15
Status: Accepted

## Context
ToolRoomOS serves enterprise manufacturing facilities across multiple operational plants. Cross-plant data leakage violates security and operational isolation.

## Decision
All authenticated user sessions carry `plantId`.
- Domain services and queries automatically enforce `plantId` scoping on database operations unless the executing user holds global `ADMIN` privileges.
- Controllers apply `@ModuleScope(...)` and `@Roles(...)` metadata to strictly govern permissions.
