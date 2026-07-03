# Status Dictionary
*ToolRoomOS – Manufacturing Operating System*

## Purpose
ToolRoomOS is heavily driven by state machines. A Project's status dictates what actions users are allowed to perform. This dictionary defines the valid statuses for core entities, what they mean, and what actions trigger them.

---

## 1. Project Status (The Global Lifecycle)
The Project Status dictates the overarching phase of the manufacturing order.

| Status | Meaning | Automatic Trigger |
|--------|---------|-------------------|
| **CREATED** | Customer PO is uploaded. Project is waiting for Engineering. | Project initialization API. |
| **ENGINEERING** | Engineering is actively creating the BOM and Routing. | Drawing is uploaded to the Project. |
| **PROCUREMENT** | BOM is approved. Purchasing is sourcing material. | BOM is marked as Approved. |
| **MATERIAL_AVAILABLE** | All required material is physically in the warehouse. | All GRNs linked to Project POs are completed. |
| **PRODUCTION** | Material is issued and machine operations have begun. | First Material Issue slip is generated. |
| **INSPECTION** | Manufacturing is complete; parts are waiting for QC. | Final operation on the Routing is marked complete. |
| **DISPATCH_READY** | Parts passed inspection and are ready to ship. | Inspection Report marked as 'PASS'. |
| **DISPATCHED** | Parts have left the factory. | Dispatch Note is generated. |
| **INVOICED** | Finance has billed the customer. | Tax Invoice is generated. |
| **PAYMENT_PENDING** | Waiting for the customer to remit payment. | Invoice sent to customer. |
| **CLOSED** | Project is complete and fully paid. | Payment receipt logged. |
| **CANCELLED** | The order was cancelled by the customer before dispatch. | Manual intervention by Admin. |

---

## 2. Document Status
Applies to Drawings, BOMs, and Technical Specifications.

| Status | Meaning |
|--------|---------|
| **DRAFT** | The document is currently being worked on and is not ready for downstream use. |
| **PENDING_APPROVAL** | Sent to a Manager/Owner for verification. |
| **APPROVED** | Verified. Data can now be used by downstream departments (e.g., Procurement can use an Approved BOM). |
| **REJECTED** | Manager identified errors. Must revert to DRAFT. |
| **OBSOLETE** | A newer revision exists. This version must never be used again. |

---

## 3. Purchase Order (Vendor) Status

| Status | Meaning |
|--------|---------|
| **ISSUED** | The PO has been sent to the vendor. |
| **PARTIAL_RECEIPT** | Some, but not all, material has arrived (1+ GRNs exist). |
| **CLOSED** | All requested material has been received. No further GRNs allowed. |
| **CANCELLED** | PO was revoked before delivery. |

---

## 4. Inspection / Quality Status

| Status | Meaning | Effect on Project |
|--------|---------|-------------------|
| **PASS** | Part meets all drawing tolerances. | Unlocks 'Dispatch' functionality. |
| **REWORK** | Part failed but can be repaired. | Re-opens 'Production' stage. Accrues additional cost. |
| **SCRAP** | Part is destroyed. | Stops project. Requires immediate management intervention to restart. |
