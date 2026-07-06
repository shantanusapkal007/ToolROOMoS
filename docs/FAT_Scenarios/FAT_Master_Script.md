# Factory Acceptance Test (FAT) Master Script
**System:** ToolRoomOS Manufacturing Engine
**Version:** RC-2 / Production Ready

This document outlines the strict, executable acceptance test scenarios that quality assurance engineers must physically execute on the shop floor before the system is certified for full production deployment.

Each scenario tests the ACID compliance, transactional integrity, and physical-to-digital mapping of the ERP.

---

## FAT-001: End-to-End Financial Rollover (The "Golden Path")
**Objective:** Verify that a project flows perfectly from Sales to Dispatch without a single cent of cost leakage.

### Execution Steps
1. **Sales & Engineering:**
   - Create Project `PRJ-FAT-001`. Set Estimated Budget to `₹50,000`.
   - Create a single-item BOM requiring `100kg` of `STEEL-001`.
   - Estimate routing: `OP10 (Cutting)` for `4 hours`, `OP20 (Milling)` for `6 hours`.
   - **Check Gate:** Verify Project Status transitions to `PRODUCTION_READY`.

2. **Procurement & Inventory:**
   - Raise PO for `100kg` of `STEEL-001` at `₹100/kg` (Total: `₹10,000`).
   - Receive Goods (GRN).
   - **Check Gate:** Verify `InventoryBatch` is created with exact cost.

3. **Production Execution:**
   - Issue exactly `50kg` of `STEEL-001` to `PRJ-FAT-001`.
   - **Check Gate:** Check `WipLedger`. It must show `₹5,000` capital locked in WIP.
   - Schedule Job Card for OP10 and execute MSDR (4 hours on Machine A, rate `₹500/hr`).
   - **Check Gate:** Verify WIP accrued `₹2,000` machine cost.
   - Execute OP20 (6 hours on Machine B).

4. **Quality & Dispatch:**
   - Log Final PDI.
   - Dispatch to Customer.
   - **Check Gate:** Verify `ProjectCostSummary` matches EXACTLY the sum of actual material issuances and machine hours logged. Total Cost must equal: `₹5,000 (Mat)` + `₹2,000 (OP10)` + `₹X (OP20)`.

---

## FAT-002: ACID Safety on Legacy Data
**Objective:** Verify the new `upsert` architecture prevents crashes when processing data for projects created before cost summaries existed.

### Execution Steps
1. **Setup:**
   - Manually insert a Project into the database without creating a `ProjectCostSummary` record.
2. **Execution:**
   - Issue material to the legacy project.
3. **Validation:**
   - **Success Criteria:** The system must gracefully create a new Cost Summary ledger and update it without throwing a `P2025 (Record to update not found)` exception.

---

## FAT-003: Workflow Orchestration Resilience (Infinite Loop Protection)
**Objective:** Verify the Stage-Gate recursion guard works correctly.

### Execution Steps
1. **Execution:**
   - Simulate a project state where conditions for moving forward (e.g., to `DISPATCH`) and backward (e.g., to `INSPECTION`) are simultaneously met by manipulating database flags.
   - Trigger the `WorkflowOrchestrator`.
2. **Validation:**
   - **Success Criteria:** The orchestrator must execute a maximum of 10 stage transitions and immediately halt, throwing a `Recursion depth limit exceeded` error in the server logs, preventing thread lockup.

---

## FAT-004: WIP & Capacity Valuation Accuracy
**Objective:** Verify that the automated nightly cron jobs correctly calculate shop floor capital and equipment effectiveness.

### Execution Steps
1. **Execution:**
   - Ensure at least 3 separate projects have active WIP (material issued, operations in progress).
   - Manually invoke the `generateDailyWipValuation()` cron method in the automation service.
2. **Validation:**
   - **Success Criteria:** The resulting `WipValuationSnapshot` must perfectly match the sum of all `accruedMaterialCost` + `accruedMachineCost` + `accruedLabourCost` for all active batches on the floor.

---

## FAT-005: Security & Form Hardening
**Objective:** Ensure the API boundary rejects malicious payloads.

### Execution Steps
1. **Execution:**
   - Send a `PUT /projects/:id` request with a valid `UpdateProjectDto` body, but illegally append `"currentStage": "DISPATCHED"`.
2. **Validation:**
   - **Success Criteria:** The `ValidationPipe` must strip the `currentStage` field (or throw a 400 Bad Request due to `forbidNonWhitelisted: true`). The project stage MUST NOT change.

---

*Sign-off is required by the Enterprise Architect, Floor Manager, and QA Lead before the system moves from UAT to Production.*
