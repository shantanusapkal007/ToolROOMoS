# Reporting Blueprint
*ToolRoomOS – Manufacturing Operating System*

## Purpose
In ToolRoomOS, reports are **outcomes, not inputs.** Because every business process updates the database in real-time, there is no "End of Month" reconciliation required to generate a report. 

Reports serve to answer high-level questions for Management and specific operational questions for Department Heads. They provide visibility, prevent bottlenecks, and track financial health.

This document identifies the core reports required to run the factory, categorized by the departments that consume them.

---

## 1. Management (Executive Dashboard)
Management requires high-level oversight of factory health, profitability, and delivery performance.
- **Project Profitability Report:** Compares Actual Revenue against the sum of all Actual Costs (Material, Machine, Labour, Outside Process, Quality, Logistics) on a per-project basis.
- **OTIF (On-Time In-Full) Delivery Report:** Measures the percentage of projects delivered by the agreed-upon customer deadline.
- **Factory Utilization Report:** A high-level view of machine uptime versus downtime across the entire plant.

## 2. Sales
Sales needs visibility into the order book and project progression.
- **Order Book Status:** A register of all active projects, their current stage in the BPS pipeline, and expected delivery dates.
- **Sales Revenue Report:** Total revenue generated within a specified time period (based on generated Tax Invoices).

## 3. Engineering
Engineering needs to track their backlog and execution speed.
- **Pending Engineering Queue:** A list of projects awaiting Drawing approval or BOM generation.
- **BOM Generation Speed:** Tracks the time elapsed between Project Creation and Material Requirement generation.

## 4. Procurement (Purchase)
Purchase needs to track vendor performance and pending liabilities.
- **Pending PO Register:** A list of all active Vendor Purchase Orders awaiting GRN (Goods Receipt).
- **Vendor Performance Report:** Ranks vendors based on Delivery Speed (Agreed vs Actual Delivery Date) and Quality (Percentage of material rejected at GRN).

## 5. Stores (Inventory)
Stores needs to manage physical assets and trace consumption.
- **Current Stock Ledger:** Real-time visibility into all available stock, grouped by Material Grade and Batch.
- **Below Minimum Stock Report:** Alerts for common consumable materials (e.g., standard tooling, oils) that require reordering.
- **Project Material Consumption Report:** A ledger showing exactly which batches of material were issued to which specific Projects.

## 6. Production
Production needs to track machine efficiency and operational bottlenecks.
- **Machine Shop Daily Report (Aggregated):** A daily rollup of all operations performed on the shop floor, detailing total machine hours and labour hours burned.
- **Machine Utilization / Downtime Report:** Tracks the ratio of productive cutting time versus setup time, maintenance, or idle time.
- **Pending Operations Report:** A queue of projects sitting in `Production` that have not yet had their routing operations completed.

## 7. Quality
Quality needs to track the cost of failure and identify recurring issues.
- **Scrap & Rework Analysis:** Calculates the total cost (sunk material + sunk machine hours) attributed to failed inspections.
- **NCR (Non-Conformance) Register:** A log of all open and closed NCRs, categorizing the root cause of the failure (e.g., Operator Error, Machine Fault, Bad Material).

## 8. Dispatch & Finance
Finance needs to track un-invoiced shipments and cash flow.
- **Un-Invoiced Dispatch Report:** A list of projects that have physically left the building (Dispatch Note generated) but have not yet been billed (Tax Invoice pending).
- **Final Project Costing Statement:** The detailed financial breakdown of a completed project, used for historical quoting comparisons.

---

## Reporting Principles
1. **Real-Time Accuracy:** Reports are generated on the fly from the live operational database.
2. **Drill-Down Traceability:** A manager looking at the "Project Profitability Report" can click on a high "Machine Cost" figure and drill down to see the exact Machine Shop Daily Reports that caused the cost overrun.
3. **No Manual Compilation:** No department should ever export data to Excel to manually build these standard reports. If a report is needed, it must be coded into the system.
