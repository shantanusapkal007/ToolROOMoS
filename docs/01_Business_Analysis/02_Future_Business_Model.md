# Future Business Model: ToolRoomOS

*ToolRoomOS is not designed to digitize existing paperwork. It is designed to replace disconnected manual activities with a continuous, project-centric workflow where information is captured once, reused everywhere, and automatically flows from one manufacturing stage to the next.*

## 1. The Three Major Concepts
The software operates on only three foundational concepts. Everything else is derived from these:

### Level 1: Master Data
This rarely changes. It provides the foundation.
- Customers
- Vendors
- Materials
- Machines
- Operations
- Employees
- Departments
- Tools
- Processes
- Heat Treatment Vendors
- Inspection Standards
- Units
- Tax Masters
- Company Settings

### Level 2: Projects
Every customer job becomes one Project. Everything revolves around this entity rather than disconnected modules like CRM or Inventory.
**Project Hierarchy:**
- `Project`
  - Customer
  - RFQ
  - Quotation
  - Customer PO
  - Drawings
  - Revisions
  - BOM
  - Routing
  - Material Planning
  - Purchase
  - Inventory
  - Production
  - Inspection
  - Dispatch
  - Invoice
  - Profitability

### Level 3: Operations
Operations are the activities that happen daily. These are independent activities but they are **always** linked back to a Project.
- Receive Material
- Issue Material
- Machine Operation
- Inspection
- Maintenance
- Dispatch
- Attendance
- Machine Shop Daily Report

## 2. One Project = One Workspace
The client does not want to jump across modules. Every piece of data related to a project is accessible from a single, continuous workspace:
`Project`
├── Overview
├── Documents
├── Engineering
├── Material Planning
├── Procurement
├── Material Receipt
├── Inventory
├── Production
├── Inspection
├── Assembly
├── Dispatch
├── Financials
└── Timeline

## 3. Document Intelligence
The goal is not just to "upload" files, but to extract and reuse data intelligently:
**Receive -> Understand -> Extract -> Validate -> Convert -> Reuse**

**The Document Lifecycle Workflow:**
`Upload Customer PO` -> `Create Project` -> `Upload Drawing` -> `Extract Part Information` -> `Engineering verifies` -> `Generate BOM` -> `Material Planning` -> `Purchase` -> `GRN` -> `Inventory` -> `Production` -> `Inspection` -> `Dispatch` -> `Invoice` -> `Profitability`

## 4. Information Has a Lifecycle
Information is never re-typed. It transforms. Every document becomes another document.
`Customer PO` -> `Project` -> `Drawing` -> `Engineering Data` -> `BOM` -> `Material Requirement` -> `Purchase Order` -> `GRN` -> `Inventory` -> `Production` -> `Inspection` -> `Dispatch` -> `Invoice` -> `Profitability`

## 5. Manufacturing Philosophy
**ToolRoomOS is not a traditional ERP.** 
Traditional ERPs ask users to enter information into multiple modules. ToolRoomOS asks users to provide information once, at the point where it naturally enters the business. 
From that point onward, the system moves the project through manufacturing by continuously transforming the same information into the documents, transactions, reports, and financial records required at each stage.
**The software manages the movement of work—not the movement of forms.**

## 6. Financial Philosophy
**Every financial impact must occur automatically when an operational event occurs.**
Finance is an outcome of Operations, not a separate activity.

- **Purchase Order** -> Planned Material Cost
- **GRN** -> Actual Material Cost
- **Material Issue** -> Project Material Consumption
- **Machine Entry** -> Machine Cost
- **Operator Entry** -> Labour Cost
- **Outside Process** -> Outside Cost
- **Inspection** -> Quality Cost
- **Dispatch** -> Final Cost
- **Invoice** -> Revenue
- **Payment** -> Project Closure

## 7. Core Product Principles
1. **Project First**
2. **Document First**
3. **Workflow First**
4. **Automation First**
5. **Single Source of Truth**
6. **No Duplicate Entry**
7. **Everything Traceable**
8. **Everything Costed**
9. **Everything Connected**
10. **Simple UI**

*(Replaces "Capture once. Use everywhere."):*
**Capture Once. Transform Continuously. Reuse Everywhere.**

## 8. Product Mission
ToolRoomOS exists to eliminate repetitive work from toolroom manufacturing. 
The system follows the lifecycle of a project rather than the structure of departments. 
Information enters the system once through documents or operational activities. 
Every subsequent process transforms that information automatically into the next business artifact. 
The objective is not to digitize paperwork. The objective is to create a continuous manufacturing flow where projects move naturally from customer order to final payment with complete traceability, accurate costing, and minimal manual effort.
