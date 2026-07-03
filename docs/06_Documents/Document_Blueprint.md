# Document Blueprint
*ToolRoomOS – Manufacturing Operating System*
*Version 1.0*

## Purpose
Documents are the primary drivers of business processes within ToolRoomOS. They are not simple file attachments or records for reference. Each document represents a business event that advances a project through its manufacturing lifecycle.

Every document has a clearly defined purpose, owner, workflow, validations, and business impact. A document may:
- Create a Project
- Update Project Status
- Generate Business Data
- Trigger the Next Workflow
- Update Inventory
- Update Production
- Update Financial Cost
- Update Reports
- Maintain Traceability

Every document belongs to exactly one Project (except shared master documents such as Vendor or Customer records).

## Document Lifecycle
Every manufacturing project follows a fixed document lifecycle. Each document consumes information from the previous document and produces information for the next one.

`Customer PO` -> `Engineering Drawing` -> `Bill of Materials (BOM)` -> `Vendor Purchase Order` -> `Goods Receipt Note (GRN)` -> `Material Issue Slip` -> `Machine Shop Daily Report` -> `Inspection Report` -> `Dispatch Note` -> `Tax Invoice`

## Standard Document Structure
Every document in ToolRoomOS follows the same specification:
- **Business Purpose**
- **Business Owner**
- **Trigger**
- **Created By**
- **Inputs**
- **Data Fields**
- **Attachments**
- **Validations**
- **Workflow**
- **System Actions**
- **Automation**
- **Project Impact**
- **Inventory Impact**
- **Cost Impact**
- **Reports Updated**
- **Outputs**
- **Next Document**

---

## 1. Customer Purchase Order
- **Business Purpose:** Officially starts the manufacturing project.
- **Business Owner:** Sales
- **Trigger:** Customer submits Purchase Order.
- **Inputs:** Customer PO, Customer Drawing, Specifications, Delivery Requirement.
- **Core Fields:** Customer, PO Number, PO Date, Part Name, Quantity, Delivery Date, Payment Terms.
- **Attachments:** Original Customer PO (PDF).
- **Workflow:** `Customer` -> `Sales Verification` -> `Project Creation`
- **Automation:** Create Project, Generate Project ID, Create Project Workspace, Generate Timeline, Assign Engineering.
- **Project Impact:** Project Created.
- **Inventory Impact:** None.
- **Cost Impact:** None.
- **Reports Updated:** Project Register, Customer Order Register.
- **Output:** Project.
- **Next Document:** Engineering Drawing.

## 2. Engineering Drawing
- **Business Purpose:** Defines how the product will be manufactured.
- **Business Owner:** Engineering
- **Inputs:** Customer Drawing.
- **Core Fields:** Drawing Number, Revision, Part Name, Material, Dimensions, Tolerances, Surface Finish, Heat Treatment.
- **Attachments:** PDF, DXF, STEP.
- **Workflow:** `Upload` -> `Review` -> `Approve`
- **Automation:** Link to Project, Lock Previous Revision, Prepare Engineering.
- **Project Impact:** Engineering Started.
- **Output:** Approved Drawing.
- **Next Document:** Bill of Materials.

## 3. Bill of Materials (BOM)
- **Business Purpose:** Defines everything required to manufacture the part.
- **Business Owner:** Engineering
- **Inputs:** Drawing, Material, Dimensions.
- **Core Fields:** Material, Raw Size, Finished Size, Quantity, Weight, Scrap Allowance.
- **Workflow:** `Engineering` -> `Review` -> `Approval`
- **Automation:** Calculate Material Weight, Estimate Material Cost, Generate Material Requirement.
- **Project Impact:** Engineering Complete.
- **Cost Impact:** Estimated Material Cost.
- **Output:** Material Requirement.
- **Next Document:** Vendor Purchase Order.

## 4. Vendor Purchase Order
- **Business Purpose:** Purchase required materials.
- **Business Owner:** Purchase
- **Inputs:** Material Requirement.
- **Core Fields:** Vendor, Material, Quantity, Rate, Delivery Date.
- **Automation:** Generate PDF, Reserve Material Budget, Update Procurement Status.
- **Project Impact:** Material Ordered.
- **Cost Impact:** Planned Material Cost.
- **Output:** Pending Material Delivery.
- **Next Document:** GRN.

## 5. Goods Receipt Note (GRN)
- **Business Purpose:** Receive material into inventory.
- **Business Owner:** Stores
- **Inputs:** Vendor Delivery, Vendor PO.
- **Core Fields:** Vendor, Material, Batch, Heat Number, Accepted Quantity, Rejected Quantity.
- **Automation:** Increase Inventory, Update Purchase Order, Record Actual Material Cost, Notify Production.
- **Project Impact:** Material Available.
- **Inventory Impact:** Increase Stock.
- **Cost Impact:** Actual Material Cost.
- **Reports Updated:** GRN Register, Inventory Ledger.
- **Output:** Inventory Batch.
- **Next Document:** Material Issue.

## 6. Material Issue Slip
- **Business Purpose:** Allocate inventory to production.
- **Business Owner:** Stores
- **Inputs:** Production Requirement.
- **Core Fields:** Batch, Material, Quantity, Project.
- **Automation:** Reduce Inventory, Record Material Consumption, Update Project Cost.
- **Project Impact:** Production Ready.
- **Inventory Impact:** Decrease Stock.
- **Cost Impact:** Material Consumption.
- **Output:** Material Allocation.
- **Next Document:** Machine Shop Daily Report.

## 7. Machine Shop Daily Report
- **Business Purpose:** Record daily manufacturing activity. (This report is entered manually by the supervisor/operator, as per the client's requirement.)
- **Business Owner:** Production
- **Inputs:** Operation, Machine, Operator.
- **Core Fields:** Machine, Operation, Start Time, End Time, Quantity, Scrap, Rework.
- **Automation:** Calculate Machine Hours, Calculate Labour Hours, Update Production Progress, Update Project Timeline, Calculate Machine Cost, Calculate Labour Cost.
- **Project Impact:** Production Progress.
- **Cost Impact:** Machine Cost, Labour Cost.
- **Output:** Completed Operation.
- **Next Document:** Inspection Report.

## 8. Inspection Report
- **Business Purpose:** Verify manufacturing quality.
- **Business Owner:** Quality
- **Inputs:** Completed Operation, Drawing.
- **Core Fields:** Passed, Rework, Scrap, Measurements.
- **Automation:** If Pass -> Project Ready. If Fail -> Generate NCR.
- **Project Impact:** Quality Updated.
- **Cost Impact:** Inspection Cost.
- **Output:** Approved Parts or NCR.
- **Next Document:** Dispatch Note.

## 9. Dispatch Note
- **Business Purpose:** Authorize shipment.
- **Business Owner:** Dispatch
- **Inputs:** Passed Inspection.
- **Core Fields:** Customer, Quantity, Vehicle, Transport, Dispatch Date.
- **Automation:** Lock Manufacturing Cost, Update Dispatch Status, Notify Finance.
- **Project Impact:** Dispatched.
- **Cost Impact:** Packing Cost, Logistics Cost.
- **Output:** Delivery Challan.
- **Next Document:** Tax Invoice.

## 10. Tax Invoice
- **Business Purpose:** Complete commercial closure of the project.
- **Business Owner:** Finance
- **Inputs:** Dispatch, Customer PO.
- **Core Fields:** Invoice Number, Customer, Amount, GST, Dispatch Reference.
- **Automation:** Record Revenue, Calculate Final Project Cost, Calculate Profitability, Update Project Status.
- **Project Impact:** Project Invoiced.
- **Cost Impact:** Revenue Recognition, Final Profitability.
- **Output:** Invoice, Project Profitability.
- **Next Document:** Project Closure.

---

## Document Ownership Matrix
| Document | Owner | Creates | Updates | Next Document |
| :--- | :--- | :--- | :--- | :--- |
| Customer PO | Sales | Project | Project Status | Drawing |
| Engineering Drawing | Engineering | Manufacturing Specification | Engineering Status | BOM |
| BOM | Engineering | Material Requirement | Estimated Cost | Vendor PO |
| Vendor PO | Purchase | Procurement | Planned Cost | GRN |
| GRN | Stores | Inventory | Actual Material Cost | Material Issue |
| Material Issue | Stores | Material Consumption | Inventory & Project Cost | Machine Report |
| Machine Shop Daily Report | Production | Production Progress | Machine & Labour Cost | Inspection |
| Inspection Report | Quality | Quality Decision | Quality Cost | Dispatch |
| Dispatch Note | Dispatch | Shipment | Logistics Cost | Invoice |
| Tax Invoice | Finance | Revenue | Profitability | Project Closure |

## Document Design Principles
1. Every document belongs to one Project.
2. Every document has one business owner.
3. Every document consumes data from previous documents instead of duplicating it.
4. Every document automatically updates the Project Workspace.
5. Every document triggers the next stage of the workflow.
6. Every document contributes to project traceability.
7. Every document updates costs where applicable.
8. Documents are the business events that move manufacturing forward—they are not merely records.
