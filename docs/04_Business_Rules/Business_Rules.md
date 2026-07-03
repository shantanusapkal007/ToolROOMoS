# Business Rules
*ToolRoomOS - Manufacturing Operating System Rules*

## Purpose
This document defines the immutable business rules of ToolRoomOS. These rules govern every project, document, operation, inventory movement, production activity, inspection, dispatch, financial transaction, and approval within the manufacturing lifecycle.

Unlike the Business Process Specification (BPS), which defines *how* work flows, this document defines *what* is permitted and what is forbidden.

These rules are mandatory. No screen, API, workflow, automation, report, or future feature may violate them.

If a requested action violates a business rule, the system must either:
- Block the action
- Request approval
- Trigger an exception workflow
- Record an audit trail

## Rule Categories
Business Rules are divided into:
1. Project Rules
2. Document Rules
3. Engineering Rules
4. Procurement Rules
5. Inventory Rules
6. Production Rules
7. Quality Rules
8. Dispatch Rules
9. Finance Rules
10. Traceability Rules
11. Workflow Rules
12. Approval Rules
13. System Rules

---

## 1. Project Rules
- **Rule 1.1:** Every Project belongs to exactly one Customer. A Project cannot exist without a Customer.
- **Rule 1.2:** A Project must always have one primary requirement document. Accepted documents: Customer PO, Customer Requirement, Approved RFQ.
- **Rule 1.3:** Every Project has one lifecycle. Projects cannot exist in multiple lifecycle stages simultaneously.
- **Rule 1.4:** Every document created after Project creation must belong to that Project. (Examples: Drawing, BOM, Purchase Order, GRN, Inspection, Dispatch, Invoice). Everything belongs to one Project.
- **Rule 1.5:** Projects cannot be deleted. Projects can only be: Active, On Hold, Cancelled, Closed, Archived.
- **Rule 1.6:** Closed Projects become read-only. No operational changes are allowed.

## 2. Document Rules
- **Rule 2.1:** Every uploaded document receives a unique Document ID.
- **Rule 2.2:** Every document stores: Owner, Upload Date, Revision, Project, Status.
- **Rule 2.3:** Documents cannot be overwritten. New versions create revisions.
- **Rule 2.4:** Old revisions remain available. Historical manufacturing must remain reproducible.
- **Rule 2.5:** Every Project always references the latest approved revision.

## 3. Engineering Rules
- **Rule 3.1:** Material must exist in Master Data.
- **Rule 3.2:** Operation must exist in Master Data.
- **Rule 3.3:** Machine must exist before routing is approved.
- **Rule 3.4:** A Project cannot enter Procurement without: Approved BOM, Approved Routing, Material Requirement.
- **Rule 3.5:** Once Procurement begins, Engineering becomes locked. Further changes require Revision.

## 4. Procurement Rules
- **Rule 4.1:** Purchase Orders originate only from Material Requirements. Never manually.
- **Rule 4.2:** Vendor must be active.
- **Rule 4.3:** Vendor must supply requested material.
- **Rule 4.4:** PO quantities cannot exceed Material Requirement.
- **Rule 4.5:** Multiple Projects may exist in one Purchase Order. Every PO Line belongs to exactly one Project.
- **Rule 4.6:** Closing a Purchase Order automatically updates related Projects.

## 5. Inventory Rules
- **Rule 5.1:** Inventory changes only through: GRN, Material Issue, Material Return, Adjustment, Scrap, Transfer. Nothing else.
- **Rule 5.2:** GRN automatically increases stock.
- **Rule 5.3:** Material Issue automatically reduces stock.
- **Rule 5.4:** Material Return automatically restores stock.
- **Rule 5.5:** Negative inventory is prohibited.
- **Rule 5.6:** Material cannot be issued if unavailable.
- **Rule 5.7:** Inventory always stores: Batch, Heat Number, Vendor, GRN, Location, Project.
- **Rule 5.8:** Inventory movement must always be traceable.

## 6. Production Rules
- **Rule 6.1:** Production starts only after Material Issue.
- **Rule 6.2:** Production follows Routing. Operations cannot be skipped.
- **Rule 6.3:** Machine operation requires: Machine, Operator, Start Time, End Time.
- **Rule 6.4:** End Time must be after Start Time.
- **Rule 6.5:** Produced Quantity cannot exceed Issued Material.
- **Rule 6.6:** Machine Hours are calculated. Never manually entered.
- **Rule 6.7:** Labour Hours are calculated. Never manually entered.

## 7. Quality Rules
- **Rule 7.1:** Inspection begins only after Production.
- **Rule 7.2:** Inspection always references: Drawing, Revision, Project, Operation.
- **Rule 7.3:** `Passed` + `Rework` + `Scrap` must equal `Produced Quantity`.
- **Rule 7.4:** Failed Inspection automatically creates NCR.
- **Rule 7.5:** Projects with open NCRs cannot dispatch.

## 8. Dispatch Rules
- **Rule 8.1:** Only Passed Quantity can dispatch.
- **Rule 8.2:** Dispatch Quantity cannot exceed Available Quantity.
- **Rule 8.3:** Dispatch references: Customer, Project, Inspection, Invoice.
- **Rule 8.4:** Partial Dispatch remains supported. Remaining quantity stays pending.

## 9. Finance Rules
- **Rule 9.1:** Finance never drives manufacturing. Manufacturing drives Finance.
- **Rule 9.2:** Material Cost comes from GRN. Never estimated BOM.
- **Rule 9.3:** `Machine Cost = Machine Hours × Hourly Rate`
- **Rule 9.4:** `Labour Cost = Operator Hours × Labour Rate`
- **Rule 9.5:** Outside Processing Cost comes from Vendor Invoice.
- **Rule 9.6:** Packing Cost comes from Packing Activity.
- **Rule 9.7:** Transport Cost comes from Dispatch.
- **Rule 9.8:** `Project Profit = Invoice Revenue − Total Actual Cost`
- **Rule 9.9:** No operational cost is entered manually. Costs are outcomes. Not inputs.

## 10. Traceability Rules
Every operational record must answer:
- Which Project?
- Which Drawing?
- Which Revision?
- Which Material?
- Which Batch?
- Which Vendor?
- Which Machine?
- Which Operator?
- Which Inspection?
- Which Dispatch?

If any answer is missing, traceability is broken.

## 11. Workflow Rules
Workflows always move forward:
`Project` -> `Engineering` -> `Procurement` -> `GRN` -> `Inventory` -> `Material Issue` -> `Production` -> `Inspection` -> `Dispatch` -> `Invoice` -> `Payment` -> `Closure`

Reverse movement requires authorized rollback.

## 12. Approval Rules
Approvals are mandatory for:
- Engineering Revision
- Purchase Budget Exception
- Material Rejection
- Scrap
- Project Cancellation
- Invoice Adjustment
- Project Closure

## 13. System Rules
- **Rule 13.1:** Capture Once, Reuse Everywhere.
- **Rule 13.2:** No Duplicate Entry.
- **Rule 13.3:** Every operational event updates the Project automatically.
- **Rule 13.4:** Every document belongs to one Project.
- **Rule 13.5:** Every cost belongs to one Project.
- **Rule 13.6:** Every inventory movement belongs to one Project whenever applicable.
- **Rule 13.7:** Every action is audit logged.
- **Rule 13.8:** Nothing is physically deleted. Historical data remains available.
- **Rule 13.9:** The system follows the manufacturing workflow. Users should not have to decide the next step manually.
- **Rule 13.10:** The Project Workspace is the single source of truth. Departments work on the same Project. Departments never recreate Project information.

---

## Golden Rules of ToolRoomOS
These ten rules summarize the entire product philosophy and must guide every implementation:

1. **One Project = One Workspace.**
2. **Capture information once; never re-enter it.**
3. **Every document belongs to exactly one Project.**
4. **Every operational event automatically updates downstream processes.**
5. **GRN increases inventory; Material Issue decreases inventory.**
6. **Finance is generated from manufacturing events, never entered manually.**
7. **Every movement, cost, and decision is traceable.**
8. **Projects move through controlled lifecycle states; no arbitrary jumps.**
9. **Historical records and revisions are preserved; nothing important is overwritten or deleted.**
10. **Simplicity is mandatory:** the software should guide the user through the manufacturing flow instead of forcing them to understand the system.
