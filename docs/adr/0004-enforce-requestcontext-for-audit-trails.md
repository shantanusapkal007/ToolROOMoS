# 4. Enforce RequestContext for Audit Trails

Date: 2026-06-29

## Status
Accepted

## Context
The legacy application extracted metadata (such as `user_id` or `tenant_id`) manually from HTTP headers or gin context variables (`c.GetString("user_id")`) directly in the Handler layer. These primitive strings were then explicitly passed down as arguments to Service and Repository functions. This tightly coupled the domain to the HTTP transport layer and led to inconsistent population of `CreatedBy` and `UpdatedBy` audit fields.

## Decision
We mandate the global adoption of the `appcontext.RequestContext` struct and `context.Context` propagation.
- **Handlers** must never extract strings for tenant or user manually. They must leverage the `middleware.InjectRequestContext()` middleware and exclusively pass `c.Request.Context()` downstream.
- **Services & Repositories** must extract `appcontext.FromContext(ctx)` to retrieve `TenantID`, `UserID`, and other metadata.
- Audit fields (`TenantID`, `CreatedBy`, `UpdatedBy`) must be mapped dynamically from the `appcontext` in the Repository (or Service) layer just before persistence.

## Consequences
- **Positive:** Strict HTTP transport isolation. The Service layer has no awareness of Gin or HTTP headers.
- **Positive:** Uniform, un-bypassable Audit Trails. Every created or mutated entity automatically logs the responsible User and Tenant.
- **Negative:** Repositories technically couple slightly to the `appcontext` module, but this is an acceptable standard for an Enterprise application.
