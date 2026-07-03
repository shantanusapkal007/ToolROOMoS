# Finance Flow
*ToolRoomOS – Manufacturing Operating System*

## Purpose
In ToolRoomOS, **Finance is an Outcome.** It is never a manual input. 

Financial tracking is inextricably linked to physical manufacturing operations. Every time a physical action occurs on the shop floor (material arrives, a machine runs, a part is inspected), a financial transaction is automatically executed in the background and applied to the Project.

This document outlines the continuous cost accumulation model that tracks a project's profitability from Customer Order to Final Payment.

---

## 1. The Continuous Cost Accumulation Model
Cost builds sequentially. The system tracks both *Estimated* (Planned) costs and *Actual* costs, calculating the variance in real-time.

**The Financial Pipeline:**
`Quotation (Target Revenue)` -> `Engineering BOM (Estimated Cost)` -> `Vendor PO (Planned Material Cost)` -> `GRN (Actual Material Cost)` -> `Machine Operation (Actual Machine/Labour Cost)` -> `Outside Process (Actual Subcontract Cost)` -> `Dispatch (Actual Logistics Cost)` -> `Tax Invoice (Actual Revenue)` -> `Project Profitability`

---

## 2. Stage-by-Stage Financial Logic

### Stage 1: The Baseline (Estimation)
- **Event:** Engineering finalizes the BOM and Routing.
- **Financial Action:** The system queries Master Data to calculate:
  - Estimated Material Cost (Material Weight × Standard Cost)
  - Estimated Production Cost (Estimated Hours × Standard Hourly Rates)
- **Outcome:** The Project establishes a baseline "Budget" to compare against actuals.

### Stage 2: Procurement (Commitment)
- **Event:** Purchase generates a Vendor PO.
- **Financial Action:** The total value of the PO is reserved as "Planned Material Cost" against the Project budget.
- **Outcome:** Management can view committed capital before material even arrives.

### Stage 3: Material Receipt (Actualization)
- **Event:** Stores department generates a Goods Receipt Note (GRN).
- **Financial Action:** The system captures the *Actual* Material Cost (`Accepted Quantity × Actual PO Rate`).
- **Outcome:** Actual Material Cost is officially logged. The inventory valuation increases.

### Stage 4: Material Consumption
- **Event:** Stores issues the physical material to the shop floor.
- **Financial Action:** The financial value of that specific batch of material is deducted from general Inventory and applied explicitly as "Project Material Consumption".
- **Outcome:** The Project absorbs the cost of the raw material.

### Stage 5: Production Execution (Burn Rate)
- **Event:** Machine Operator logs Start and Stop times on a routing operation.
- **Financial Action:** The system automatically calculates:
  - `Machine Cost = Actual Machine Hours × Machine Master Hourly Rate`
  - `Labour Cost = Actual Operator Hours × Employee Master Hourly Rate`
- **Outcome:** As the machine runs, the Project Cost increases in real-time. There is zero manual time-sheet financial entry required by accounting.

### Stage 6: Outside Processing (Subcontracting)
- **Event:** Material returns from a Heat Treatment vendor and an Inward Challan is processed.
- **Financial Action:** The Vendor's service charge is applied directly to the Project as "Outside Processing Cost".
- **Outcome:** Subcontractor costs are automatically tied to the specific job, rather than lost in general overhead.

### Stage 7: Quality & Rework (The Cost of Failure)
- **Event:** Quality Inspector rejects a part, generating an NCR that requires rework.
- **Financial Action:** The additional machine and labour hours spent on the rework operation are accrued against the Project. If a part is scrapped, the material value is logged as "Scrap Cost".
- **Outcome:** The true cost of poor quality reduces the final profit margin of that specific Project.

### Stage 8: Dispatch & Logistics
- **Event:** Finished goods are packed and dispatched.
- **Financial Action:** Packing materials and transporter logistics costs are applied to the Project.
- **Outcome:** Final Manufacturing and Logistics Cost is locked. No further operational costs can be accrued.

### Stage 9: Revenue Recognition & Profitability
- **Event:** Finance generates the Tax Invoice.
- **Financial Action:** The system recognizes the Tax Invoice amount as Actual Revenue. It then calculates the Final Project Profitability:
  **`Profit = Actual Revenue - (Actual Material Cost + Actual Machine Cost + Actual Labour Cost + Actual Outside Process Cost + Actual Logistics Cost)`**
- **Outcome:** True, accurate, operational profitability is permanently recorded.

---

## 3. Strict Financial Rules (Anti-Patterns)
- **No Manual Journal Entries for Operations:** An accountant cannot simply "type in" a $500 machining cost. The operator *must* log the machine hours, which the system converts to $500.
- **No Disconnected Costs:** A purchase invoice cannot be paid without a matching GRN. The GRN is the sole source of truth for material liability.
- **Real-Time Visibility:** Management does not need to wait for "End of Month Close" to know if a project is profitable. Profitability drops in real-time as machine hours are logged.
