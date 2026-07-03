# The Ultimate Business Process Specification (BPS)
*ToolRoomOS - Manufacturing Operating System for Job Order Toolrooms*

## Purpose
The Business Process Specification (BPS) is the operational blueprint of ToolRoomOS. It defines exactly how a manufacturing project moves through the organization from customer requirement to project completion.

This document is the single source of truth for:
- Business workflow
- Department responsibilities
- Document lifecycle
- Information lifecycle
- Cost lifecycle
- Approval lifecycle
- Automation lifecycle
- Inventory lifecycle
- Project lifecycle

Every future feature, workflow, screen, API, database table, report, automation, and integration must conform to this document. If a proposed implementation violates this document, the implementation is incorrect.

## Manufacturing Lifecycle
Every manufacturing project follows exactly one lifecycle. Every project must move sequentially. No stage may be skipped without authorization.

`Customer Requirement` -> `Project Creation` -> `Engineering` -> `Material Planning` -> `Procurement` -> `Material Receipt (GRN)` -> `Inventory` -> `Material Issue` -> `Production` -> `Outside Processing (if required)` -> `Inspection` -> `Assembly (if required)` -> `Packing` -> `Dispatch` -> `Invoice` -> `Payment` -> `Project Closure`

## Project Lifecycle
Every Project progresses through defined business states. These statuses represent business progress. Every module derives its behavior from these states.

`Created` -> `Engineering` -> `Material Planning` -> `Procurement` -> `Material Available` -> `Production` -> `Inspection` -> `Dispatch Ready` -> `Dispatched` -> `Invoiced` -> `Payment Pending` -> `Closed`

## Process Definition Structure
Every business process is documented using exactly the following structure. This format is mandatory across the product.
- **Business Objective**
- **Business Owner**
- **Trigger**
- **Preconditions**
- **Inputs**
- **Documents**
- **Business Activities**
- **System Activities**
- **Validations**
- **Automations**
- **Outputs**
- **Cost Impact**
- **Inventory Impact**
- **Project Impact**
- **Reports Updated**
- **Exception Handling**
- **Next Process**

---

## Process 1 — Customer Requirement & Project Creation
- **Business Objective:** Convert a customer requirement into an executable manufacturing project.
- **Business Owner:** Sales
- **Trigger:** Customer submits: Purchase Order, Drawing, Specification, Excel, or Revision.
- **Preconditions:** Customer exists or is created.
- **Inputs:** Customer PO, Drawing, Specifications, Quantity, Delivery Schedule.
- **Business Activities:** Review customer documents. Confirm customer details. Upload documents. Review project requirements. Create Project.
- **System Activities:** Create Project ID. Create Project Workspace. Store uploaded documents. Generate Project Timeline. Assign Engineering.
- **Outputs:** Project, Customer, Documents, Timeline, Project Status.
- **Cost Impact:** None.
- **Inventory Impact:** None.
- **Project Impact:** Project Created.
- **Reports Updated:** New Project Register, Engineering Queue, Customer Order Register.
- **Next Process:** Engineering.

## Process 2 — Engineering
- **Business Objective:** Convert customer requirements into manufacturing instructions.
- **Inputs:** Customer Drawing, Customer PO, Specifications.
- **Business Activities:** Review drawing. Select material. Determine raw stock. Define machining sequence. Prepare routing. Prepare BOM.
- **System Activities:** Store BOM. Store Routing. Link Drawing. Link Revision. Generate Material Requirement.
- **Outputs:** Approved BOM, Routing, Operations, Material Requirement.
- **Cost Impact:** Estimated Material Cost, Estimated Machine Cost, Estimated Labour Cost, Estimated Outside Process Cost, Estimated Total Cost.
- **Project Impact:** Engineering Complete.
- **Reports Updated:** Engineering Status, BOM Register, Material Planning Report.
- **Next Process:** Procurement.

## Process 3 — Procurement
- **Business Objective:** Procure required materials.
- **Inputs:** Approved BOM, Material Requirement.
- **Business Activities:** Select Vendor. Create Purchase Order. Send Purchase Order. Track Delivery.
- **System Activities:** Generate Vendor PO. Reserve Budget. Update Procurement Status.
- **Outputs:** Purchase Order, Vendor, Expected Delivery.
- **Cost Impact:** Planned Material Cost.
- **Project Impact:** Material Ordered.
- **Reports Updated:** PO Register, Pending Purchase Report, Vendor Report.
- **Next Process:** GRN.

## Process 4 — GRN
- **Business Objective:** Receive purchased material.
- **Business Activities:** Verify Vendor Delivery. Verify Quantity. Verify Material Grade. Record Heat Number. Accept Material. Upload Vendor Challan. Create GRN.
- **System Activities:** Create GRN. Increase Inventory. Update Purchase Order. Update Material Cost. Update Project. Notify Production.
- **Outputs:** GRN, Inventory Stock, Vendor Receipt, Material Batch.
- **Cost Impact:** Actual Material Cost Added.
- **Inventory Impact:** Stock Increased.
- **Project Impact:** Material Available.
- **Reports Updated:** Inventory Ledger, GRN Register, Material Receipt Report.
- **Next Process:** Material Issue.

## Process 5 — Material Issue
- **Business Objective:** Allocate material to the project.
- **Business Activities:** Select Material Batch. Issue Material. Confirm Quantity.
- **System Activities:** Reduce Inventory. Record Material Consumption. Update Project.
- **Cost Impact:** Material Consumption Added.
- **Inventory Impact:** Stock Reduced.
- **Project Impact:** Production Ready.
- **Next Process:** Production.

## Process 6 — Production
- **Business Objective:** Manufacture the component.
- **Business Activities:** Start Operation. Complete Operation. Record Quantity. Record Rework. Record Scrap.
- **System Activities:** Calculate Machine Hours. Calculate Labour Hours. Calculate Machine Cost. Calculate Labour Cost. Update Production Progress. Update Project Timeline.
- **Outputs:** Operation Log, Completed Quantity, Machine Hours, Labour Hours.
- **Cost Impact:** Machine Cost, Labour Cost, Tool Cost, Scrap Cost.
- **Project Impact:** Manufacturing Progress.
- **Reports Updated:** Machine Shop Daily Report, Production Report, Ongoing Project Report.
- **Next Process:** Outside Process or Inspection.

## Process 7 — Outside Processing
- **Business Objective:** Send parts out for external operations (Only executed if required).
- **Business Activities:** Generate Outward Challan. Send Material. Receive Material. Record Vendor Charges. Update Project Cost.

## Process 8 — Inspection
- **Business Objective:** Verify manufactured quality.
- **Business Activities:** Inspect Dimensions. Record Measurements. Approve. Reject. Raise NCR if required.
- **System Activities:** Update Project Status. Generate Inspection Report. Update Quality Cost.
- **Outputs:** Inspection Report, NCR.
- **Next Process:** Dispatch (or Rework).

## Process 9 — Dispatch
- **Business Objective:** Deliver finished goods.
- **Business Activities:** Pack. Generate Delivery Note. Dispatch.
- **System Activities:** Update Dispatch Status. Update Logistics Cost. Complete Manufacturing.
- **Outputs:** Dispatch Note, Packing List.
- **Project Impact:** Project Delivered.
- **Next Process:** Invoice.

## Process 10 — Invoice
- **Business Objective:** Generate Customer Invoice.
- **Business Activities:** Verify Dispatch. Generate Invoice. Record Revenue.
- **System Activities:** Calculate Final Project Cost. Calculate Profit. Update Financial Dashboard.
- **Outputs:** Invoice, Profitability, Financial Summary.
- **Next Process:** Payment.

## Process 11 — Payment & Closure
- **Business Objective:** Close the project.
- **Business Activities:** Receive Payment. Close Project. Archive Documents.
- **System Activities:** Update Project Status. Lock Costing. Generate Final Report.
- **Outputs:** Closed Project, Final Profitability, Complete Traceability.

---

## Continuous Business Flows
Every process contributes to six continuous flows that exist throughout the project lifecycle.

1. **Information Flow:** Customer → Engineering → Purchase → Stores → Production → Quality → Dispatch → Finance
2. **Document Flow:** PO → Drawing → BOM → Purchase Order → GRN → Machine Report → Inspection → Dispatch → Invoice
3. **Material Flow:** Vendor → GRN → Inventory → Material Issue → Production → Assembly → Dispatch
4. **Cost Flow:** Estimate → Purchase → GRN → Material Issue → Production → Outside Process → Inspection → Packing → Dispatch → Invoice → Profitability
5. **Approval Flow:** Engineering → Purchase → Material → Quality → Dispatch → Finance
6. **Traceability Flow:** Customer → Project → Material → Machine → Operator → Inspection → Dispatch → Invoice

## Business Success Criteria
A manufacturing project is considered successfully executed when:
- Information is entered only once.
- Documents are linked to the project from start to finish.
- Every operational stage updates the project automatically.
- GRN updates inventory without manual intervention.
- Material Issue updates inventory and project consumption.
- Production updates machine, labour, and project costs automatically.
- Inspection updates quality status and project readiness.
- Dispatch updates logistics costs and project completion.
- Invoice reflects actual manufacturing costs.
- Profitability is available in real time.
- Every activity is fully traceable.
- Every department works from the same project workspace.
