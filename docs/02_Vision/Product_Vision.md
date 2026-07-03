# Product Vision: ToolRoomOS

## Vision Statement
ToolRoomOS is a Manufacturing Operating System built specifically for Job Order Toolrooms.

It is designed to manage the complete lifecycle of every manufacturing project—from the moment a customer order is received until the project is delivered, invoiced, and financially closed.

Unlike traditional ERP systems that organize businesses into disconnected modules such as Purchase, Inventory, Production, Finance, and CRM, ToolRoomOS organizes the entire business around Projects.

Every document, every material movement, every manufacturing activity, every inspection, every financial transaction, and every decision belongs to one project.

The purpose of ToolRoomOS is not to digitize paperwork. The purpose is to digitize the movement of work.

## Why ToolRoomOS Exists
Most toolrooms still operate using a mixture of:
- Excel Sheets
- Paper Registers
- Email
- WhatsApp
- Phone Calls
- Printed Drawings
- Manual Reports

Although every department performs different work, they all repeatedly recreate the same information. 
For example:
- Engineering creates the BOM.
- Purchase types the BOM again.
- Stores types it again during GRN.
- Production writes it again on travelers.
- Quality writes it again on inspection reports.
- Finance types it again for costing.

The same information travels through the organization many times, but it is never actually connected. This results in duplicate work, inconsistent information, delayed costing, revision mistakes, inventory mismatches, poor traceability, and management blind spots.

ToolRoomOS exists to eliminate this repeated recreation of information. Information should enter the system once. From that point onward, the system should continuously transform that information into everything required for manufacturing.

## Product Mission
The mission of ToolRoomOS is simple:
**Capture information once. Transform it continuously. Reuse it everywhere.**

The user should never be asked to type the same business information twice. Every subsequent manufacturing activity should build automatically upon previous activities.

## Product Philosophy
ToolRoomOS follows one philosophy: **Manufacturing is a continuous workflow—not a collection of independent departments.**

The software therefore follows the journey of a project rather than the organizational chart. Departments exist. But projects move. The software follows projects.

## What ToolRoomOS Is
ToolRoomOS is:
- a Manufacturing Operating System
- project-centric
- workflow-driven
- document-driven
- operation-driven
- event-driven
- manufacturing-first

It manages engineering, procurement, inventory, production, quality, dispatch, and project costing as one continuous flow.

## What ToolRoomOS Is NOT
ToolRoomOS is NOT:
- a traditional ERP
- a CRM platform
- an accounting package
- a payroll system
- a marketing platform
- a document storage application

Those systems manage departments. ToolRoomOS manages manufacturing projects.

## Core Product Principles
Every design decision inside ToolRoomOS must follow these principles:

1. **Project First**
   Everything belongs to a Project. Not to a department. Every screen should answer: *Which Project does this belong to?*
2. **Workflow First**
   The software follows manufacturing. Manufacturing should never follow software. Users should naturally move to the next activity without searching menus.
3. **Document First**
   Every project begins with documents (Customer PO, Drawing, Specifications, Excel Sheets, Customer Revisions). Documents initiate business processes. They are not merely attachments.
4. **Capture Once**
   Information should only be entered once. No department should recreate information already available elsewhere.
5. **Transform Continuously**
   Business information naturally evolves. No information should be recreated; it should only transform:
   `Customer PO` -> `Project` -> `Drawing` -> `Engineering Review` -> `BOM` -> `Material Requirement` -> `Purchase Order` -> `Vendor Material` -> `GRN` -> `Inventory` -> `Material Issue` -> `Production` -> `Inspection` -> `Assembly` -> `Dispatch` -> `Invoice` -> `Profitability`
6. **Single Source of Truth**
   Every project has exactly one source of truth. Everyone works on the same information. No duplicate Excel files. No duplicate BOMs. No duplicate registers. No duplicate reports.
7. **Automation Through Workflow**
   Automation should happen because work progressed. Not because another person entered another form. (e.g., `GRN Completed` -> `Inventory Updated`)
8. **Finance is an Outcome**
   Finance is not a separate activity. Finance automatically follows operations. Every operational event creates financial impact. (e.g., `GRN` -> `Actual Material Cost`, `Machine Operation` -> `Machine Cost`)
9. **Complete Traceability**
   Every item must be traceable from Vendor to Dispatch. Nothing should lose its history.
10. **Simplicity**
    Every screen should answer one question: *"What should I do next?"* The software should never overwhelm the operator.

## Core Business Model
The entire system revolves around three concepts. Everything belongs somewhere within these:
**Master Data** -> **Projects** -> **Operations**

- **Master Data:** Defines the business. Rarely changes. (Customers, Vendors, Materials, Machines, Operations, Employees, Departments, Tools, etc.)
- **Projects:** Every customer requirement becomes a Project. A Project contains EVERYTHING (RFQ, PO, Drawings, BOM, Routing, Purchase, Inventory, Production, Quality, Dispatch, Invoice, Profitability).
- **Operations:** Daily manufacturing activities (Receive Material, Machine Operation, Assembly, Inspection, Maintenance, Dispatch) that update Projects automatically.

## Project Workspace Philosophy
The user should never jump across disconnected modules. One Project. One Workspace.
`Overview` -> `Documents` -> `Engineering` -> `Material Planning` -> `Procurement` -> `Material Receipt` -> `Inventory` -> `Production` -> `Quality` -> `Assembly` -> `Dispatch` -> `Financials` -> `Timeline`

## Information Lifecycle
Information enters once. It evolves naturally.
`Customer PO` -> `Project` -> `Drawing` -> `Engineering` -> `BOM` -> `Material Requirement` -> `Purchase` -> `Vendor` -> `GRN` -> `Inventory` -> `Production` -> `Inspection` -> `Dispatch` -> `Invoice` -> `Payment` -> `Project Closure`

## Document Lifecycle
Every document exists for a purpose.
- `Customer PO` -> Creates Project
- `Drawing` -> Defines Manufacturing
- `BOM` -> Defines Material
- `Purchase Order` -> Procures Material
- `GRN` -> Creates Inventory
- `Machine Shop Daily Report` -> Records Production
- `Inspection Report` -> Approves Quality
- `Dispatch Note` -> Completes Manufacturing
- `Invoice` -> Completes Financial Cycle

## Cost Lifecycle
Cost accumulates automatically. Every operational activity automatically contributes to project profitability.
`Quotation` -> `Estimated Material / Labour / Machine Cost` -> `Purchase` -> `Actual Material Cost` -> `GRN` -> `Inventory Valuation` -> `Material Issue` -> `Consumption` -> `Machine Operations` -> `Machine Cost` -> `Labour` -> `Labour Cost` -> `Outside Process` -> `Vendor Cost` -> `Quality` -> `Inspection Cost` -> `Packing` -> `Packing Cost` -> `Dispatch` -> `Logistics Cost` -> `Invoice` -> `Revenue` -> `Profitability`

## User Experience Philosophy
The software should feel like following a manufacturing job—not operating software. The user should always know:
- where the project is
- what has been completed
- what remains
- who is responsible
- what documents are pending
- what approvals are pending
- what costs have accumulated
...without opening multiple modules.

## Product Scope
ToolRoomOS focuses exclusively on job-order manufacturing: Customer Order, Engineering, BOM, Material Planning, Purchase, GRN, Inventory, Production, Assembly, Quality, Dispatch, Project Costing, Project Profitability. Nothing more.

## Out of Scope
ToolRoomOS deliberately excludes: Marketing CRM, Sales Pipelines, Campaign Management, Payroll, Income Tax, General Ledger, Trading Inventory, Retail Billing, E-commerce, Generic Accounting ERP Features. These can integrate with external systems if required.

## Success Definition
ToolRoomOS will be successful when:
- A customer order creates a project without duplicate entry.
- Documents naturally drive the next business activity.
- GRN automatically updates inventory.
- Inventory automatically supports production.
- Production automatically contributes to project costing.
- Every operation is traceable.
- Every cost is visible in real time.
- Every document belongs to a project.
- Every employee works from the same information.
- The entire manufacturing lifecycle—from customer order to payment—is managed inside one continuous workflow with minimal manual intervention.

## Final Product Statement
ToolRoomOS is a Project-Centric Manufacturing Operating System for Job Order Toolrooms. It transforms documents into workflows, workflows into operations, operations into financial outcomes, and disconnected departmental activities into one continuous manufacturing lifecycle. It is built on a single principle: capture information once, transform it throughout manufacturing, and never ask the user to do the same work twice.
