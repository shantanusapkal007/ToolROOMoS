# 3. Enforce Prisma Transaction Boundaries

Date: 2026-08-15
Status: Accepted

## Context
Multi-step manufacturing operations (e.g. GRN receipt creating inventory batches, Material issue decrementing stock, BOM approval triggering cost events) require strict ACID atomicity.

## Decision
All multi-table mutating business workflows must execute within `prisma.$transaction(async (tx) => { ... })`.
- Operations must never leave partial inventory, financial, or stage transitions.
- Idempotency records are checked and persisted within the transaction boundary.
