# 1. Use Google Wire for Dependency Injection

Date: 2026-06-29

## Status
Accepted

## Context
The legacy ERP monolithic architecture initiated all dependencies manually in `main.go`. This file swelled to over 350 lines of fragile, highly order-dependent initializations where a misordered repository instantiation would crash the application at runtime. It was also impossible to trace cyclic dependencies effectively, and testability was severely restricted.

## Decision
We will mandate the use of `google/wire` across all modules in the ERP monolith for compile-time Dependency Injection.
- Every architectural module (e.g., Core, Inventory, Finance) must expose a `ProviderSet`.
- `main.go` must never instantiate a `Repository`, `Service`, or `Handler` directly.
- The DI container is synthesized entirely at compile time via `wire_gen.go`.

## Consequences
- **Positive:** Dependency graphs are strictly validated at compile time. Circular dependencies result in build failures rather than runtime crashes.
- **Positive:** `main.go` is decoupled and significantly simplified (reduced from 359 lines to under 200).
- **Positive:** Testing becomes drastically easier because we can inject mocks systematically into any struct constructor.
- **Negative:** Developers must run `wire` every time they add or change a dependency signature. This introduces an additional build step.
