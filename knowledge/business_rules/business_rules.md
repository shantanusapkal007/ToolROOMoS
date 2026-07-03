# ToolRoomOS Business Rules & Workflows

## Core Manufacturing Workflows

### 1. Document Upload to Structured Data
- All client interactions begin with document ingestion (Excel, PDF, Customer POs, Drawings).
- The system parses imports from `imports/` to populate `master_data/` and active transactional tables.

### 2. Material Planning to Purchase
- Based on imported BOMs and Drawings, the Material Requirement Planning (MRP) triggers Purchase Requests.
- Material costs are calculated using the `Material Cost Formula` from the Calculation Library.

### 3. Inventory Updates via GRN
- Goods Receipt Notes (GRN) automatically increase Inventory stock levels.
- Quality Inspections are triggered upon GRN for critical materials.

### 4. Machine Shop Daily Reporting
- Operators log daily production output and machine usage.
- Downtime is logged against maintenance workflows.
- Costs accrue in real-time against active Work Orders.

### 5. Production Tracking & Quality Inspection
- First Article Inspections (FAI) and Non-Conformance Reports (NCR) are tightly integrated with the Production routing.
- Parts cannot move to the next operation if they fail Quality Inspection (unless approved via Concession).

### 6. End-to-End Costing & Dispatch
- Before Packing and Dispatch, final project costs are compiled by aggregating all actuals (Material, Machine, Labour, Outside Process).
- Packing lists and Dispatch notes are generated dynamically based on the Customer Order.

## Validation Rules
- **Quantities:** Received quantities cannot exceed Ordered quantities without manager override.
- **Approvals:** Purchase Orders over predefined limits require secondary approval.
- **Revisions:** A new ECO (Engineering Change Order) must be generated if a Drawing revision is uploaded.

---
*Note: This is a living document. Specific workflow nodes and transition logic will be expanded by domain experts based on these initial structures.*
