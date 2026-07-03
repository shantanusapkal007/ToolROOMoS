# 2. Standardize Enterprise Middleware Pipeline

Date: 2026-06-29

## Status
Accepted

## Context
Middleware usage across the ERP's 15 modules was highly fragmented. Some modules applied `Auth` and `TenantResolution`, while missing critical observability layers like `RequestID` or `CorrelationID`. Others invoked inline middlewares, leading to inconsistent audit trails, security gaps, and impossible end-to-end distributed tracing.

## Decision
We mandate the strict use of the `EnterprisePipeline(jwtSecret string)` defined in `shared/middleware/pipeline.go` for all application route groups.

The pipeline strictly guarantees the following execution order:
1. `Recovery`: Prevents panics from crashing the server.
2. `RequestID`: Injects `X-Request-ID` for unique request tracing.
3. `CorrelationID`: Injects `X-Correlation-ID` for distributed saga tracing.
4. `Logger`: Structures logs with `zerolog` context attached to the request.
5. `Auth`: Parses and validates JWT tokens.
6. `TenantResolution`: Identifies and binds the target multi-tenant context.

## Consequences
- **Positive:** Security and Observability are guaranteed globally. A developer cannot accidentally expose an endpoint without a RequestID or Authentication.
- **Positive:** Removes redundant boilerplate from `handler.go` files across 15 modules.
- **Negative:** Route groups cannot selectively bypass the `Logger` or `CorrelationID` easily without explicitly creating an alternate pipeline, which is discouraged.
