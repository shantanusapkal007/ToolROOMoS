# 2. Standardize API Response Envelopes

Date: 2026-08-15
Status: Accepted

## Context
Inconsistent API return shapes between controllers forced frontend consumers to implement defensive multi-layer unwrapping.

## Decision
We enforce a unified API response envelope across all NestJS endpoints via a global `TransformInterceptor`:
```json
{
  "success": true,
  "data": T,
  "meta": { "page": 1, "limit": 20, "total": 100 },
  "message": "Operation completed successfully"
}
```
Errors are formatted uniformly by `AllExceptionsFilter` and `PrismaExceptionFilter`.
