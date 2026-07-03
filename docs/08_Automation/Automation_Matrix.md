# Automation Matrix
*ToolRoomOS – Manufacturing Operating System*

## Purpose
ToolRoomOS relies heavily on "Automation through Workflow." Automations remove the burden of manual data entry, ensuring that when an operational event occurs, the system instantly calculates costs, moves inventory, and notifies the next department.

This document explicitly defines every background automation that must be coded into the system. Every automation follows the pattern:
**Trigger** -> **Condition** -> **Action** -> **Result** -> **Notification**

---

## 1. Project Initialization Automation
- **Trigger:** Sales Department uploads and verifies a Customer PO.
- **Condition:** PO must be linked to a valid Customer Master.
- **Action:** 
  - System generates a unique Project ID.
  - System provisions the Project Workspace.
  - System extracts delivery dates to formulate a timeline.
- **Result:** Project state changes to `Engineering`.
- **Notification:** Engineering Queue receives a "New Project Setup" alert.

## 2. Material Requirement (PR) Generation
- **Trigger:** Engineering approves the Bill of Materials (BOM).
- **Condition:** BOM must contain at least one valid material from Master Data.
- **Action:** 
  - System calculates total required material weight (using density and cut sizes).
  - System calculates Estimated Material Cost.
  - System generates a Material Requirement request.
- **Result:** Material Requirement is placed in the Procurement Queue. Project state changes to `Material Planning`.
- **Notification:** Purchase Department receives a "Material Required" alert.

## 3. Inventory Addition & Actual Costing (GRN)
- **Trigger:** Stores completes a Goods Receipt Note (GRN) against a Vendor PO.
- **Condition:** Received quantity must be <= Pending PO quantity.
- **Action:** 
  - System mathematically increases stock levels in the Inventory module.
  - System calculates Actual Material Cost (`Received Qty * PO Rate`).
  - System applies Actual Material Cost directly to the Project Financials.
  - System updates the Vendor PO line item status.
- **Result:** Inventory is incremented. Project state changes to `Material Available`.
- **Notification:** Production Supervisor receives a "Material Available for Machining" alert.

## 4. Inventory Consumption (Material Issue)
- **Trigger:** Stores issues material batch to the shop floor.
- **Condition:** Issued quantity must be <= Available Stock quantity.
- **Action:** 
  - System mathematically decreases stock levels in the Inventory module.
  - System applies Material Consumption Cost to the Project Financials.
- **Result:** Inventory is decremented. Project state changes to `Production`.
- **Notification:** None. (Operator begins work).

## 5. Live Production Costing
- **Trigger:** Machine Operator logs Stop Time on a routing operation.
- **Condition:** Start Time must exist and be logically prior to Stop Time.
- **Action:** 
  - System calculates total duration (Hours).
  - System calculates Machine Cost (`Hours * Machine Hourly Rate`).
  - System calculates Labour Cost (`Hours * Operator Hourly Rate`).
  - System injects these costs directly into the Project Financials ledger.
- **Result:** Project Profitability margin is actively reduced in real-time.
- **Notification:** None.

## 6. Non-Conformance (NCR) Generation
- **Trigger:** Quality Inspector marks an inspected quantity as "Rework" or "Scrap".
- **Condition:** Must specify the reason code for failure.
- **Action:** 
  - System automatically generates an NCR document.
  - System calculates the sunk cost (Scrap Value) and logs it as a Quality Cost.
  - System halts the Project's forward progression to Dispatch.
- **Result:** NCR is generated. Project requires engineering intervention.
- **Notification:** Quality Manager and Engineering receive an "NCR Generated" alert.

## 7. Financial Locking & Profitability
- **Trigger:** Finance generates the Tax Invoice.
- **Condition:** Dispatch Note must be completed and signed off.
- **Action:** 
  - System locks all operational cost accruals. No further machine/labour logs can be added to the Project.
  - System recognizes the Tax Invoice amount as Revenue.
  - System calculates Final Project Profitability (`Revenue - Total Accumulated Costs`).
- **Result:** Project state changes to `Invoiced`. Profitability is permanently recorded.
- **Notification:** Management dashboard updates with finalized project margins.
