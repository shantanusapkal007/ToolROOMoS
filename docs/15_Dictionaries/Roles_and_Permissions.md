# Roles and Permissions
*ToolRoomOS – Manufacturing Operating System*

## Purpose
ToolRoomOS utilizes strict Role-Based Access Control (RBAC). Because users do not "switch modules" but rather navigate a single Project Workspace, permissions dictate *which tabs* within the workspace a user can view or interact with.

This matrix ensures data security and enforces the segregation of duties required in a professional manufacturing environment.

---

## Core Roles

### 1. Admin (Plant Head / Director)
- **Description:** Ultimate authority over the system.
- **Permissions:** Full Read/Write access to all Projects, Master Data, and Reports.
- **Exclusive Powers:** Can override Project Statuses manually, view Financial Profitability summaries, delete incorrect GRNs or Invoices (generates permanent audit log).

### 2. Sales Engineer
- **Description:** Responsible for client communication and order entry.
- **Permissions:** 
  - *Write:* Can create Projects and upload Customer POs.
  - *Read:* Can view Project Timeline, Dispatch Status, and Invoices.
  - *Denied:* Cannot view internal costs, BOMs, or Machine Logs.

### 3. Engineering / Planning
- **Description:** Responsible for converting Customer POs into manufacturing instructions.
- **Permissions:**
  - *Write:* Upload Drawings, Create BOMs, Create Routings.
  - *Read:* Read complete Project history.
  - *Denied:* Cannot execute Purchase Orders or GRNs.

### 4. Purchase Officer
- **Description:** Responsible for sourcing material.
- **Permissions:**
  - *Write:* Generate Vendor Purchase Orders based strictly on Approved BOMs. Manage Vendor Master Data.
  - *Read:* Material Requirements, Inventory Stock.
  - *Denied:* Cannot create Engineering Drawings or approve Invoices.

### 5. Stores (Inventory Manager)
- **Description:** Controls physical material flow.
- **Permissions:**
  - *Write:* Generate GRNs (against valid POs), Execute Material Issues to shop floor, Log Scrap adjustments.
  - *Read:* Active POs, Production Requirements.
  - *Denied:* Cannot generate POs, Cannot edit BOMs.

### 6. Production (Machine Operator / Supervisor)
- **Description:** Executes manufacturing operations.
- **Permissions:**
  - *Write:* Log Machine Shop Daily Reports (Start/Stop time).
  - *Read:* Drawings, BOMs, Routings, Issued Material.
  - *Denied:* Cannot view any financial data (PO rates, Machine hourly rates).

### 7. Quality Inspector
- **Description:** Verifies manufactured parts against engineering tolerances.
- **Permissions:**
  - *Write:* Log Inspection Reports (Pass/Fail/Rework) and generate NCRs.
  - *Read:* Drawings, Operations, Material Heat Numbers.
  - *Denied:* Cannot alter Production Logs or Inventory.

### 8. Finance / Accounts
- **Description:** Manages revenue and final costing.
- **Permissions:**
  - *Write:* Generate Tax Invoices (only after Dispatch Note is generated).
  - *Read:* Complete Project Cost Breakdown (Material Cost, Machine Cost, Logistics), Revenue Reports.
  - *Denied:* Cannot alter operational logs, GRNs, or Production data.
