# 3. Mandate UnitOfWork and DBExecutor

Date: 2026-06-29

## Status
Accepted

## Context
Legacy codebase implementations resulted in inconsistent transaction boundaries. Some Repositories managed their own `*sqlx.Tx`, some Services completely ignored transactions, and multiple instances of orphaned database connections caused stability and performance degradations. Furthermore, sharing raw `*sqlx.DB` across layers violated the Repository Pattern.

## Decision
We mandate a strict `database.UnitOfWork` (UOW) and `database.DBExecutor` boundary.
- **Repositories** must strictly implement methods requiring a `database.DBExecutor` interface. A repository must never initialize or commit a transaction, nor hold a direct persistent reference to `*sqlx.DB`.
- **Services** are solely responsible for transaction boundaries. Every mutating business process must be wrapped in `uow.Run(ctx, func(ctx context.Context, exec database.DBExecutor) error)`.

## Consequences
- **Positive:** Guaranteed ACID compliance. Database connections are reliably committed or rolled back based on the closure's `error` return.
- **Positive:** Repositories become drastically easier to unit test via a mock `DBExecutor`.
- **Positive:** Completely eliminates orphaned connection leaks caused by unhandled `tx.Rollback()` failures.
- **Negative:** Slightly increased verbosity in the Service layer due to the closure pattern.
