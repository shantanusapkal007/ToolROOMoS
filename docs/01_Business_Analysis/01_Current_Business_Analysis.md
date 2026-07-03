# Current Business Analysis

## 1. Industry & Toolroom Type
- **Industry:** Toolroom Manufacturing
- **Type:** Job Order Manufacturing, Production, Make to Order
- **Customer:** OEM / Industrial
- **Products:** Tools, Fixtures, Dies, Jigs, Machine Parts, Assembly Parts, Development Parts, Prototype Parts

## 2. Factory Structure
- **Core Operations:** Machining, Assembly, Heat Treatment (In-house/Outside), Inspection, Packaging.
- **Physical Layout:** Reception -> Raw Material Stores -> Machine Shop -> Quality Control Area -> Assembly Line -> Dispatch Dock.

## 3. Departments
- **Sales/Quoting:** Receives Customer PO, coordinates quoting.
- **Engineering:** Develops process, estimates material, creates BOM.
- **Purchase:** Procures material, generates Vendor POs.
- **Stores/Inventory:** Receives material (GRN), manages stock.
- **Production:** Executes machining and assembly.
- **Quality Assurance:** Performs inspections, generates reports.
- **Finance & Dispatch:** Invoices customer, tracks profitability, manages shipping.

## 4. Current Manual Process & Data Recreation
Currently, the process is highly disconnected, forcing massive data recreation. The workflow is:
1. `Customer` sends PO, Drawing, Specs, Excel via Emails.
2. `Sales` receives and interprets the emails.
3. `Engineering` manually types the BOM based on the drawings.
4. `Purchase` **again types** the material requirements into quotes.
5. `Stores` **again types** the material into the ledger upon receipt.
6. `Production` **again types** the part numbers onto paper travelers.
7. `Finance` **again types** the numbers into the accounting system.

## 5. Current Document Flow
The physical flow of documents relies heavily on manual interpretation at every step:
`Customer sends PO, Drawing, Excel, Specs, Revisions via Email` -> `Manually Interpreted` -> `Excel BOM` -> `Purchase Order` -> `Vendor Challan` -> `GRN` -> `Machine Shop Daily Report` -> `Inspection Report` -> `Dispatch Note` -> `Invoice`

## 6. Current Information Flow
Information never flows automatically. Each department recreates information in a silo:
`Customer` -> `Engineering` -> `Purchase` -> `Stores` -> `Production` -> `Quality` -> `Dispatch` -> `Finance`

## 7. Current Cost Flow
Costs accumulate sequentially but are currently impossible to track in real-time. The desired flow is:
`Quotation` -> `Estimated Cost` -> `Purchase Cost` -> `Inventory Cost` -> `Production Cost` -> `Machine Cost` -> `Labour Cost` -> `Outside Process` -> `Heat Treatment` -> `Assembly` -> `Packing` -> `Dispatch` -> `Invoice` -> `Profitability`

## 8. Current Reports
The following reports are manually generated:
Machine Shop Daily Report, Production Report, Purchase Report, Material Consumption, Inventory Report, Maintenance Report, Inspection Report, Dispatch Report, Project Cost Report, Pending Jobs Report.

## 9. Current Registers
Paper or standalone Excel registers currently in use:
Machine Shop Daily Report, Material Issue Register, Material Return Register, Tool Issue Register, Maintenance Register, Visitor Register, Attendance Register, Quality Register, Dispatch Register, Purchase Register, Vendor Register.

## 10. Current Approvals
Approval flow is currently managed verbally or via physical signature:
`Customer PO` -> `Engineering Approval` -> `Purchase Approval` -> `Material Approval` -> `Quality Approval` -> `Dispatch Approval` -> `Invoice Approval`

## 11. Current Software Landscape
The shop floor runs on disconnected, unstructured systems:
- Excel
- Paper Registers
- WhatsApp
- Email
- Phone Calls
- Physical Drawings
- Paper Reports

## 12. Biggest Pain Point: Manual Entry
The #1 biggest pain point across the board is **too much manual entry**. The exact same information is manually typed multiple times across Engineering, Purchase, Inventory, Production, and Finance.

- **Engineering:** Manual BOM creation, Drawing Revision chaos, Manual Material Estimation.
- **Purchase:** Duplicate Entry, Difficult Vendor Comparison.
- **Inventory:** Delayed GRN logging, Manual Stock counting, Wrong Balances.
- **Production:** Paper Travelers, No Live Status, No Machine Tracking.
- **Quality:** Paper Inspection sheets, Revision Confusion.
- **Finance:** Delayed Cost calculation, Manual Cost Allocation, Profit Unknown until long after dispatch.
