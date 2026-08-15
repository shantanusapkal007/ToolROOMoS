# 1. Adopt NestJS Modular Architecture

Date: 2026-08-15
Status: Accepted

## Context
ToolRoomOS requires a maintainable, enterprise-grade architecture for managing complex toolroom manufacturing workflows across 20+ functional subdomains.

## Decision
We mandate a modular NestJS 11 architecture organized by business domain modules (Projects, Engineering, Procurement, Production, Quality, Logistics-Finance, Maintenance, Assets, RBAC, Reports).
- Controllers handle HTTP routing, DTO validation, and role authorization.
- Domain services encapsulate business logic and database transaction orchestration.
- PrismaService handles unified PostgreSQL database access.
