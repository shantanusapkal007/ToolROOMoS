# Database Blueprint
*ToolRoomOS – Manufacturing Operating System*
*Version 1.0*

## 1. Database Philosophy
The database is the digital twin of the factory. Every entity, document, movement, approval, and cost recorded in ToolRoomOS must represent a real-world manufacturing activity.

The database is not designed around software modules. It is designed around how work physically flows through the factory. If a business activity does not exist in the factory, it should not exist in the database.

---

## 2. Database Hierarchy
The database consists of six logical layers:

`Master Data` -> `Business Objects` -> `Business Documents` -> `Operational Events` -> `Financial Outcomes` -> `Analytics`

Every developer must understand this architecture before creating a single table.

---

## 3. Layer 1 — Master Data
These tables rarely change. They define the factory. Master data never stores project activity.

- `companies`, `plants`, `departments`
- `customers`, `vendors`
- `materials`, `material_shapes`
- `machines`, `operations`, `tools`, `inspection_standards`
- `employees`
- `warehouses`, `locations`
- `uoms`, `cost_rates`, `project_status`, `document_types`

---

## 4. Layer 2 — Business Objects
These are not transactions. They are business entities. Everything else belongs to them.
- `projects`: The heart of the system. Stores Project Number, Customer, Status, Priority, Delivery Date, Current Stage, Progress, Project Owner. Everything else references Project.

---

## 5. Layer 3 — Business Documents
These represent paperwork. Documents create business data; they never exist independently. Every document belongs to one Project.

- `customer_pos`
- `drawings`
- `document_revisions` (Dedicated history of revisions, rather than storing only the latest)
- `bill_of_material_headers`, `bill_of_material_items`
- `vendor_pos`
- `goods_receipt_headers`, `goods_receipt_items`
- `material_issue_headers`, `material_issue_items`
- `machine_shop_daily_reports`
- `inspection_reports`
- `dispatch_notes`
- `invoices`

---

## 6. Layer 4 — Operational Events
This is where the database mirrors the factory. Operational activities become immutable database events. Exactly like the factory.

- `project_timeline` (Tracks movement through each stage)
- `project_activities` (Tracks every action performed on a project)
- `approvals` (Generic approval table recording approvals for BOMs, POs, NCRs, Dispatches, instead of embedding approval fields everywhere)

**Event Concept Map:**
- Material Received -> `Goods Receipt Record`
- Material Issued -> `Material Issue Record`
- Machine Started -> `Production Operation Record`
- Inspection Passed -> `Inspection Record`
- Dispatch Completed -> `Dispatch Record`

### Inventory Model (Event Driven)
Inventory is strictly partitioned into Current Stock and Movement History.
- `inventory_stock` (Current Quantity)
- `inventory_batches` 
- `inventory_transactions` (GRN -> Material Issue -> Return -> Adjustment -> Scrap)
- `inventory_reservations` (Reserved Quantity)
- `inventory_available` (Available Quantity)

### Production Model
- `routing_headers`, `routing_operations`
- `production_batches`, `production_operations` (Replaces `production_headers`)

---

## 7. Layer 5 — Financial Outcomes
Finance becomes a result. The database never stores manually entered costs. Costs originate exclusively from manufacturing events.

- `project_cost_summary` (For fast reporting)
- `project_cost_events` (Stores each granular cost event: material receipt, machine operation, labour, packing, etc. Provides full cost traceability)

### Cost Model Traceability
`Quotation` -> `Estimated Material Cost` -> `Vendor PO` -> `Actual Material Cost (GRN)` -> `Material Consumption` -> `Machine Cost` -> `Labour Cost` -> `Outside Process Cost` -> `Inspection Cost` -> `Packing Cost` -> `Dispatch Cost` -> `Invoice` -> `Profitability`

Every operational event contributes to Project Cost.

---

## 8. Layer 6 — Analytics & Reporting
Reports never own data. Reports read operational tables.
- Machine Shop Daily Report
- Production Report
- Inventory Report
- Purchase Report
- Profitability Report
- Pending Project Report
*No duplicate report tables.*

---

## Standard Columns
**Every table contains:**
`id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `status`, `remarks`

**Transactional tables additionally contain:**
`project_id`, `document_number`, `revision`, `approval_status`

---

## Relationships & Cardinality
The relationships define the workflow. Notice the strict 1-to-Many cardinality proving that Project is the absolute root.

```text
Project (1)
  ↓
(Many) Drawings
  ↓
(Many) BOMs
  ↓
(Many) Material Requirements
  ↓
(Many) Purchase Orders
  ↓
(Many) GRNs
  ↓
(Many) Material Issues
  ↓
(Many) Production Operations
  ↓
(Many) Inspections
  ↓
(Many) Dispatches
  ↓
(One) Invoice
```
*Now developers immediately understand relationships.*

All foreign keys are mandatory where applicable. This guarantees end-to-end traceability (e.g., Invoice -> Dispatch -> Inspection -> Production -> Material Issue -> GRN -> PO -> Vendor).

---

## Golden Database Principles
1. **The database models the factory, not the software.**
2. **Projects are the root of all manufacturing activity.**
3. **Documents initiate business processes.**
4. **Operational events update the Project automatically.**
5. **Financial values are outcomes of manufacturing events.**
6. **Every movement is traceable.**
7. **Every transaction is immutable.**
8. **Master Data defines the factory; transactions record factory activity.**
9. **Reports derive from operational data and never duplicate it.**
10. **The database must remain simple enough that anyone familiar with the factory can understand the relationship between tables.**
