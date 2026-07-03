# Manufacturing Process Guide

This manual covers the core operations engine of ToolRoom ERP, bridging the gap between Engineering design, Inventory control, Production execution, and Quality.

## 1. Engineering

Engineering forms the foundation of all manufacturing data in the ERP.

### Managing Bill of Materials (BOM) & Routings
- **Item Master:** The core database containing every raw material, consumable, and finished good.
- **BOM Management:** The system stores hierarchical "recipes" detailing the required raw materials needed to produce a finished good.
- **Routings:** Defines the sequential operations (Work Centers) required to convert the BOM components into the Finished Good.
- *Implementation Status:* The basic data structures for BOMs, Items, and Routings exist. Advanced features like automated BOM Explosions or rigid Engineering Change Orders (ECO) versioning are roadmap items.

## 2. Production (MES)

The Manufacturing Execution System (MES) helps track work on the factory floor.

### Managing the Shop Floor
- **Work Centers & Machines:** Group physical machines into logical Work Centers.
- **Work Orders:** The release ticket for production. Operators log production against specific Work Order IDs.
- **Production Timeline:** Managers can view a chronological timeline of shop floor activity via the Production Dashboard. This is powered by the `Audit Log` API, which tracks every status change (e.g., Job Started, Job Stopped) in real-time.

## 3. Inventory & WMS (Warehouse Management)

### Stock Control
- **Goods Receipt Notes (GRN):** Used to receive raw materials into the warehouse against supplier deliveries.
- **Traceability:** The database contains tables for managing distinct lots and tracking serial numbers.
- *Implementation Status:* The core database schemas exist for tracing items and bins. Dynamic calculation engines for Available To Promise (ATP) and automated FEFO/FIFO algorithms are planned for future phases.

## 4. Quality Management

### Inspection Workflows
- The Quality module contains data models for tracking inspections, logging Non-Conformance Reports (NCR), and managing Corrective Actions (CAPA).
- Quality inspectors can log dimensions and test results directly against specific Work Orders or received raw materials.

## 5. Maintenance

- The Maintenance module provides a ticketing system for Breakdown Maintenance and Preventive Maintenance scheduling.
- Shop floor operators can raise breakdown tickets to alert the maintenance crew when a machine goes offline.

## 6. Finance & Accounting

- The system holds schemas for managing base accounting, Purchase Orders (AP), and Sales Invoices (AR).
- *Implementation Status:* Fully automated Manufacturing Cost Rollups (dynamically calculating standard vs actual cost variances via labor routing times) are currently slated for future development.
