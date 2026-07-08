# ToolRoomOS Status Matrix

This document defines the lifecycle states for major business entities in ToolRoomOS.

## 1. Purchase Lifecycle
- **Draft:** Purchase Request/Order created but not submitted.
- **Pending Approval:** Submitted for management approval.
- **Approved:** Approved, ready to send to vendor.
- **PO Generated:** Purchase Order sent to vendor.
- **Ordered:** Vendor confirmed receipt.
- **Partial Receipt:** Some items received via GRN.
- **Received:** All items received.
- **Closed:** Invoice matched and closed.
- **Cancelled:** Cancelled before fulfillment.

## 2. Production Lifecycle
- **Planned:** Work Order created and scheduled.
- **Material Issued:** Raw material allocated from inventory.
- **Started:** Operator logged in and started first operation.
- **Running:** Active machining or assembly taking place.
- **Paused/Hold:** Stopped due to machine breakdown, tooling issue, or material shortage.
- **Completed:** All operations finished.
- **Closed:** Costing finalized and moved to finished goods.

## 3. Quality Lifecycle
- **Pending:** Item awaiting inspection (e.g., FAI or routine check).
- **In Inspection:** Quality engineer currently inspecting.
- **Pass:** Item meets all tolerances.
- **Fail:** Item rejected (NCR generated).
- **Rework:** Sent back for correction.
- **Approved (Concession):** Failed but accepted under deviation allowance.

## 4. Quotation Lifecycle
- **Draft:** RFQ received, costing being built.
- **Under Review:** Sent for internal commercial approval.
- **Sent:** Submitted to customer.
- **Negotiation:** Revising pricing based on customer feedback.
- **Won:** Customer approved quote (triggers Customer Order).
- **Lost:** Customer rejected quote.

## 5. Maintenance Lifecycle
- **Reported:** Machine breakdown logged.
- **Assigned:** Technician allocated.
- **In Progress:** Repair work ongoing.
- **Awaiting Spares:** Paused due to unavailable parts.
- **Resolved:** Machine back online.
- **Closed:** Maintenance log signed off by production.

---
*Note: Derived from standard manufacturing practices and mapped from the legacy ERP modules (`procurement`, `production`, `quality`, `quoting`, `maintenance`).*
