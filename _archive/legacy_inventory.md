# Legacy Repository Inventory

This document serves as the master checklist of assets discovered in the legacy `toolroom` repository before extraction.

## 1. Documents
- `docs/ToolRoom_ERP_Architecture.pdf` (System Architecture)
- `docs/operator_manuals.md` (Operator Manuals)
- `docs/manufacturing_process.md` (Manufacturing Process)
- `docs/product_vision.md` (Product Vision)
- `docs/technical_architecture.md` (Technical Architecture)
- `docs/troubleshooting_best_practices.md` (Troubleshooting)

## 2. Excel & Sample Files
*(Note: Only minimal sample files were found in the legacy repo. Additional client samples will need to be uploaded manually into `imports/` later.)*
- `backend/Context_Matrix.csv`
- `backend/Repository_Matrix.csv`

## 3. Database Objects (SQL)
- Extensive migrations found in `backend/migrations/` categorized by module:
  - `engineering`, `finance`, `hrms`, `inventory`, `maintenance`, `procurement`, `production`, `quality`, `quoting`, `shared`, `subcontracting`, `tooling`, `workflow`
- Seed data scripts:
  - `backend/global_seeder.sql`
  - `backend/scripts/db/extended_demo_seeder.sql`
  - `backend/scripts/db/ktas_demo_seeder.sql`

## 4. Frontend Assets
- Various Next.js components and layouts (to be discarded).
- Styles: `frontend/src/styles/globals.css`.
- Types and constants in `frontend/src/types/` and `frontend/src/constants/` (to be selectively reviewed).

## 5. Extracted Knowledge Targets (To be derived from code)
- **Business Calculations:** Formulas from `backend/services` (e.g. material cost, machine cost, quoting formulas).
- **Status Matrix:** Lifecycles for Production, Quality, quoting, procurement.
- **Validations & Workflows:** Sourced from `backend/modules/*/services/` and `frontend/src/validations/`.

---
**Conclusion:** 
The repository contains a substantial amount of database schema definitions and basic architectural documentation, but is sparse on raw sample files (Excel, drawings). Extraction will proceed heavily relying on the SQL schemas, Go services (for rules), and Markdown docs.
