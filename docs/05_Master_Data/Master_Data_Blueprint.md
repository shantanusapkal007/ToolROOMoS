# Master Data Blueprint
*ToolRoomOS – Manufacturing Operating System*

## Purpose
Master Data defines the permanent business entities used throughout ToolRoomOS. Unlike transactional data (Projects, Purchase Orders, GRNs, Production Logs), Master Data changes infrequently and provides the standardized reference information required by every manufacturing activity.

Every Project, every Document, every Inventory Movement, every Production Operation, every Cost Calculation, and every Report depends on Master Data.

Master Data ensures:
- Standardization
- Consistency
- Traceability
- Cost Accuracy
- Workflow Integrity

Master Data is the foundation of the Manufacturing Operating System.

## Master Data Categories
The masters are grouped into logical business domains:

- **Organization:** Company, Plant, Department, Warehouse, Storage Location
- **Business Partners:** Customer, Vendor
- **Engineering:** Material, Material Shape, Operation, Machine, Tool, Inspection Standard
- **Human Resources:** Employee, Shift
- **Inventory:** Unit of Measure, Material Category, Stock Location
- **Finance:** Machine Hourly Rate, Labour Rate, Outside Processing Rate
- **System:** Document Type, Project Status, Approval Matrix

## General Rules (Applicable to Every Master)
Every master must follow these rules:
1. Has a unique identifier.
2. Has an Active/Inactive status.
3. Cannot be deleted once referenced by a transaction.
4. Supports audit history (Created By, Created On, Updated By, Updated On).
5. May be marked obsolete but never physically removed.
6. Changes affecting historical transactions do not retroactively modify past records.

---

## 1. Company Master
- **Purpose:** Defines the legal manufacturing organization.
- **Owner:** System Administrator
- **Fields:** Company Code, Company Name, GST Number, PAN, Address, Contact Details, Financial Year, Currency
- **Used By:** Projects, Customers, Vendors, Finance

## 2. Plant Master
- **Purpose:** Defines manufacturing plants or factories.
- **Owner:** Administration
- **Fields:** Plant Code, Plant Name, Address, Working Hours, Default Warehouse
- **Used By:** Machines, Employees, Projects

## 3. Department Master
- **Purpose:** Defines operational departments (Engineering, Purchase, Stores, Production, Quality, Dispatch, Finance).
- **Used By:** Employees, Machines, Approvals, Reports

## 4. Warehouse Master
- **Purpose:** Defines physical storage areas.
- **Fields:** Warehouse Code, Name, Type, Plant
- **Used By:** Inventory, GRN, Material Issue

## 5. Storage Location Master
- **Purpose:** Defines rack/bin/shelf locations for precise inventory tracking.
- **Example Hierarchy:** `Warehouse` -> `Rack` -> `Shelf` -> `Bin`

## 6. Customer Master
- **Purpose:** Defines manufacturing customers.
- **Fields:** Customer Code, Company Name, GST, Billing Address, Shipping Address, Contact Person, Payment Terms
- **Used By:** Projects, Customer PO, Invoice, Dispatch

## 7. Vendor Master
- **Purpose:** Defines material suppliers and subcontractors.
- **Vendor Types:** Material Supplier, Heat Treatment, Plating, Grinding, Coating, Tool Supplier
- **Used By:** Purchase, GRN, Outside Processing, Finance

## 8. Material Master
- **Purpose:** Defines every purchasable material.
- **Fields:** Material Code, Material Grade, Material Category, Density, Standard Cost, Default UOM, Default Vendor
- **Used By:** Engineering, BOM, Purchase, GRN, Inventory, Project Costing

## 9. Material Shape Master
- **Purpose:** Defines stock forms to avoid free-text entry.
- **Examples:** Plate, Round, Square, Pipe, Bar, Block, Sheet

## 10. Unit of Measure (UOM) Master
- **Purpose:** Defines measurement standards.
- **Examples:** KG, PCS, MM, MTR, LTR

## 11. Machine Master
- **Purpose:** Defines manufacturing equipment.
- **Fields:** Machine Code, Machine Name, Machine Type, Department, Hourly Rate, Capacity, Status
- **Used By:** Routing, Production, Costing, Maintenance

## 12. Operation Master
- **Purpose:** Defines standard manufacturing operations.
- **Examples:** Milling, Turning, Drilling, Grinding, EDM, Heat Treatment, Inspection, Assembly
- **Used By:** Routing and Production

## 13. Tool Master
- **Purpose:** Defines cutting tools used for production and tooling cost allocation.
- **Fields:** Tool Code, Tool Name, Tool Type, Tool Life, Cost

## 14. Employee Master
- **Purpose:** Defines the workforce.
- **Fields:** Employee Code, Name, Department, Designation, Hourly Rate, Shift
- **Used By:** Production, Inspection, Maintenance, Approvals

## 15. Shift Master
- **Purpose:** Defines factory working shifts (Morning, Evening, Night, General).

## 16. Inspection Standard Master
- **Purpose:** Defines inspection criteria (Diameter, Flatness, Surface Finish, Parallelism, Concentricity).

## 17. Document Type Master
- **Purpose:** Standardizes project documents (Customer PO, Drawing, Revision, BOM, Vendor PO, GRN, Inspection Report, Dispatch Note, Invoice).

## 18. Project Status Master
- **Purpose:** Defines lifecycle stages (Created, Engineering, Purchase, Production, Inspection, Dispatch, Closed). Used by every project.

## 19. Approval Matrix Master
- **Purpose:** Defines approval authority (Purchase Approval, Engineering Approval, Quality Approval, Finance Approval, Project Closure Approval).

## 20. Cost Rate Master
- **Purpose:** Defines costing parameters to drive automatic project costing (Machine Hourly Rate, Labour Hourly Rate, Outside Processing Rate, Inspection Rate, Packing Rate).

---

## Relationships
The relationships between masters are intentionally hierarchical:
```
Company
│
├── Plant
│   ├── Department
│   │   ├── Employee
│   │   └── Machine
│   │
│   ├── Warehouse
│   │   └── Storage Location
│   │
│   └── Projects
│
├── Customer
├── Vendor
│
├── Material
│   ├── Material Shape
│   └── UOM
│
├── Operation
├── Tool
├── Shift
├── Inspection Standard
├── Cost Rate
├── Project Status
└── Document Type
```

## Master Data Governance
To maintain data quality:
- Only authorized users may create or modify Master Data.
- Masters cannot be deleted once referenced.
- Historical references always remain valid.
- Every change is audit logged.
- Critical masters (Material, Customer, Vendor, Machine) require approval before activation.
- Obsolete masters remain available for historical reporting but cannot be used in new projects.

## Design Principles
1. Master Data defines the business.
2. Transactions consume Master Data; they never redefine it.
3. Every master has a clear business owner.
4. Every master has a lifecycle.
5. Every master participates in project traceability.
6. Every master contributes to workflow consistency.
7. Every master supports accurate costing.
8. Master Data is shared across all projects and is never duplicated.
