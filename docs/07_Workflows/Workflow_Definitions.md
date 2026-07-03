# Workflow Definitions
*ToolRoomOS – Manufacturing Operating System*

## Purpose
While the Business Process Specification (BPS) defines *what* happens in the factory, the **Workflow Definitions** document acts as the technical State Machine for the software. 

It defines the exact permitted transitions a Project can take from one lifecycle state to another. This document dictates the UI logic—specifically, what actions are enabled or disabled for a user at any given time, and how a project physically moves forward (or backward during an exception).

---

## 1. Core Project State Machine (The Happy Path)
Every Project must travel through these states sequentially. A Project cannot skip a state unless explicitly authorized.

`Created` -> `Engineering` -> `Material Planning` -> `Procurement` -> `Material Available` -> `Production` -> `Inspection` -> `Dispatch Ready` -> `Dispatched` -> `Invoiced` -> `Payment Pending` -> `Closed`

## 2. State Transition Definitions

### Transition 1: `Created` -> `Engineering`
- **Current State:** Created
- **Required Trigger:** Sales Manager verifies uploaded Customer PO and clicks "Submit to Engineering".
- **Validation Rules:** Customer PO document must be attached. Customer must exist in Master Data.
- **Resulting State:** Engineering
- **UI Impact:** Unlocks the "Upload Drawing" and "Create BOM" modules for the Engineering department.

### Transition 2: `Engineering` -> `Material Planning`
- **Current State:** Engineering
- **Required Trigger:** Chief Engineer clicks "Approve BOM & Routing".
- **Validation Rules:** BOM must have at least one valid material. Routing must have at least one valid operation.
- **Resulting State:** Material Planning
- **UI Impact:** Locks Engineering module from further edits without a formal revision. Generates Material Requirement in the Procurement queue.

### Transition 3: `Material Planning` -> `Procurement`
- **Current State:** Material Planning
- **Required Trigger:** Purchase department selects a Vendor and generates a Vendor PO against the Material Requirement.
- **Validation Rules:** Vendor must be active. PO value must be calculated.
- **Resulting State:** Procurement (Pending Delivery)
- **UI Impact:** Locks the Material Requirement. Unlocks the GRN module for the Stores department.

### Transition 4: `Procurement` -> `Material Available`
- **Current State:** Procurement
- **Required Trigger:** Stores department generates a Goods Receipt Note (GRN) against the Vendor PO.
- **Validation Rules:** Received quantity cannot exceed PO quantity.
- **Resulting State:** Material Available
- **UI Impact:** Inventory is incremented. Unlocks the "Material Issue" button for Production.

### Transition 5: `Material Available` -> `Production`
- **Current State:** Material Available
- **Required Trigger:** Stores issues the physical material to the shop floor (Material Issue Slip generated).
- **Validation Rules:** Cannot issue more than available inventory stock.
- **Resulting State:** Production
- **UI Impact:** Inventory is decremented. Unlocks the "Machine Shop Daily Report" module for operators to log time.

### Transition 6: `Production` -> `Inspection`
- **Current State:** Production
- **Required Trigger:** All operations in the routing sequence are marked as "Completed".
- **Validation Rules:** Produced quantity must be logged. Machine/Labour hours must be recorded.
- **Resulting State:** Inspection
- **UI Impact:** Unlocks the Quality module for the Inspector to log measurements.

### Transition 7: `Inspection` -> `Dispatch Ready`
- **Current State:** Inspection
- **Required Trigger:** Quality Inspector logs all parts as "Passed".
- **Validation Rules:** `Passed Qty` must equal `Produced Qty`. No open NCRs.
- **Resulting State:** Dispatch Ready
- **UI Impact:** Unlocks the Dispatch module for the logistics team.

### Transition 8: `Dispatch Ready` -> `Dispatched`
- **Current State:** Dispatch Ready
- **Required Trigger:** Dispatch department generates the Dispatch Note (Delivery Challan).
- **Validation Rules:** Dispatched quantity cannot exceed Passed quantity.
- **Resulting State:** Dispatched
- **UI Impact:** Locks manufacturing cost accumulation. Unlocks the Finance module for Invoicing.

### Transition 9: `Dispatched` -> `Invoiced`
- **Current State:** Dispatched
- **Required Trigger:** Finance department generates the Tax Invoice.
- **Validation Rules:** Invoice amount must align with Customer PO terms.
- **Resulting State:** Invoiced
- **UI Impact:** Revenue is recognized. Final Project Profitability is calculated and locked.

### Transition 10: `Invoiced` -> `Payment Pending`
- **Current State:** Invoiced
- **Required Trigger:** Automatic transition once Invoice is generated.
- **Resulting State:** Payment Pending
- **UI Impact:** Unlocks the "Receive Payment" logging screen.

### Transition 11: `Payment Pending` -> `Closed`
- **Current State:** Payment Pending
- **Required Trigger:** Finance logs full payment received.
- **Validation Rules:** Payment received must equal Invoice amount.
- **Resulting State:** Closed (Read-Only)
- **UI Impact:** Entire Project Workspace becomes read-only. No further operational or financial changes can be made.

---

## 3. Exception Workflows (The Unhappy Paths)
Manufacturing does not always follow a straight line. The system must support controlled reverse-transitions (rollbacks) governed by strict authorization.

### Exception A: Engineering Revision
- **Scenario:** Customer changes the drawing *after* the BOM has been approved, but *before* material is ordered.
- **Current State:** Material Planning
- **Action:** Engineer initiates "Create Revision".
- **Validation:** Only possible if Vendor PO has *not* been generated.
- **Resulting State:** Reverts to `Engineering`. The original BOM is archived as Rev_0.

### Exception B: Material Rejection
- **Scenario:** Vendor delivers the wrong material grade.
- **Current State:** Procurement
- **Action:** Stores creates a "Rejection Note" instead of a GRN.
- **Validation:** Material never enters active inventory.
- **Resulting State:** Remains in `Procurement` (Vendor owes replacement material).

### Exception C: Non-Conformance / Rework (NCR)
- **Scenario:** Parts fail Quality Inspection.
- **Current State:** Inspection
- **Action:** Quality Inspector logs parts as "Rework" and generates an NCR.
- **Validation:** Requires Engineering sign-off on the rework instructions.
- **Resulting State:** Reverts to `Production`. Unlocks the routing sequence to add an additional "Rework" operation.

### Exception D: Project Cancellation
- **Scenario:** Customer cancels the order mid-production.
- **Current State:** Production
- **Action:** Sales initiates "Project Cancellation".
- **Validation:** Requires Director/Manager approval.
- **Resulting State:** `Cancelled`.
- **UI Impact:** All pending Purchase Orders are flagged for cancellation. Issued material is routed to "Scrap" or "Return to Stores". All accumulated costs are written off as a loss against the project. Workspace becomes read-only.
