# UX Blueprint
*ToolRoomOS – Manufacturing Operating System*

## UX Design Principles
Every screen inside ToolRoomOS must follow these principles:

1. **Project First:** The Project is the application. Everything else exists inside the Project.
2. **Workflow First:** The UI always follows manufacturing (Engineering -> Purchase -> Inventory -> Production -> Inspection -> Dispatch -> Finance). Never the opposite.
3. **One Screen One Purpose:** Every screen should answer exactly one question (e.g., Engineering: "What do I need to manufacture?"). Nothing more.
4. **Zero Duplicate Entry:** Users never type existing information. The screen always loads previous project information automatically. The user only verifies.
5. **Show Contextual Work:** Show the Current Work + Previous Stage Summary + Next Stage Preview. The operator always understands where he came from and where he is going.

---

## Overall Navigation
The navigation is intentionally minimal:
- **Dashboard**
- **Projects**
- **Master Data**
- **Reports**
- **Settings**

*No separate Purchase module. No Inventory module. No Production module. Those belong inside Projects.*

## Dashboard
**Purpose:** Show today's work. Not historical reports. The dashboard answers: *What needs attention today?*
**Dashboard Sections:**
- Today's Projects
- Projects Waiting
- Projects Delayed
- Projects Near Delivery
- Pending Approvals
- Machine Alerts
- Inventory Alerts
- Recent Activities
- My Tasks

## Projects Screen
**Purpose:** Entry point into manufacturing. Shows every project, nothing else.
**Project Card Displays:** Project Number, Customer, Part Name, Current Stage, Progress, Delivery Date, Priority, Status, Material Status, Production Status.
*(Clicking a card opens the Project Workspace).*

---

## Project Workspace
This is the entire software. Everything happens here. Users never need to learn a new page because every page uses the exact same layout.

### Standard Page Layout
```text
+------------------------------------------------------+
| Project Header                                       |
+------------------------------------------------------+
| Current Stage                                        |
+------------------------------------------------------+
| Pending Actions                                      |
+------------------------------------------------------+
| Current Data                                         |
+------------------------------------------------------+
| Documents (Contextual to this stage)                 |
+------------------------------------------------------+
| History                                              |
+------------------------------------------------------+
| Comments                                             |
+------------------------------------------------------+
| Activity Timeline (Interactive Navigation)           |
+------------------------------------------------------+
```

### Interactive Workflow Timeline
The timeline is the heart of the workspace and acts as the primary navigation. Clicking a stage opens that stage.
`✔ Project` -> `✔ Engineering` -> `✔ Purchase` -> `✔ GRN` -> `✔ Inventory` -> `▶ Production` -> `○ Inspection` -> `○ Dispatch` -> `○ Invoice`

---

## The Project Journey (Business Stages)
These are business stages, not ERP modules. That matches how people in a factory think.

Every stage answers exactly these questions:
1. What is this stage?
2. What information came here?
3. What do I need to verify?
4. What should I enter?
5. What happens after I Save?
6. What will be generated?
7. Where does it go next?

### 1. Project Control Center (Homepage)
Contains: Project Health, Current Stage, Today's Pending Tasks, Delivery Risk, Material Status, Production Progress, Inspection Status, Dispatch Status, Financial Summary, Project Timeline.

### 2. Requirements & Engineering
Input: Customer PO, Drawing.
Data: BOM, Routing.
Documents: Automatically shows Customer PO & Drawing.

### 3. Procurement (Material Planning & Purchase)
Input: BOM.
Data: Material Requirement, Vendor PO.
Documents: Automatically shows BOM.

### 4. Material Receipt & Inventory
Input: Vendor PO.
Data: GRN, Issued Material.
Documents: Automatically shows Vendor PO & Delivery Challan.

### 5. Manufacturing (Production)
Input: Issued Material, Routing.
Data: Machine, Operator, Start/Stop Time.
Documents: Automatically shows Drawing, BOM, Issued Material.
Output: Cost (Machine/Labour), Progress. Moves to Inspection.

### 6. Inspection
Input: Completed Operations.
Data: Measurements, Pass/Fail, NCR.
Documents: Automatically shows Drawing & Tolerances.

### 7. Dispatch
Input: Passed Inspection.
Data: Packing, Transport.
Documents: Automatically shows Inspection Report, Delivery Note.

### 8. Financial Summary
Don't just show numbers. Show the cost journey:
`Quotation (₹85,000)` -> `Purchase (₹31,000)` -> `Inventory (₹30,850)` -> `Production (₹14,200)` -> `Inspection (₹1,400)` -> `Packing (₹600)` -> `Dispatch (₹1,200)` -> `Total Cost (₹48,250)` -> `Invoice (₹72,000)` -> `Profit (₹23,750)`

---

## Automatic Information Flow & UX Mechanics

### Contextual Documents
Documents should not be separate. Each stage should automatically show its own documents. A global Documents page can exist for reference, but users shouldn't have to search for the Drawing when in the Production stage.

### Actionable Notifications
Notifications tell the user exactly what to do.
- Instead of "Material Received", use: *"Material received. Project PRJ-102 is now waiting for Material Issue."*
- Instead of "Inspection Done", use: *"Inspection completed. Dispatch can now begin."*

### Activity Feed
Every Project automatically builds its own history feed, invaluable for traceability.
`10:15 Customer PO uploaded` -> `10:22 Drawing Approved` -> `11:03 BOM Approved` -> `12:10 PO Generated` -> `Next Day: GRN Created` -> `Material Issued` -> `Production Started` -> `Inspection Passed`

### Grouped Search
Global Search returns grouped results naturally.
Searching for **"Mounting Plate"** returns:
- **Project:** PRJ-1004
- **Documents:** Drawing, Customer PO
- **Engineering:** BOM, Routing
- **Purchase:** PO-211
- **Inventory:** GRN-120
- **Production:** Operation Log
- **Quality:** Inspection
- **Finance:** Invoice

---

## Final UX Philosophy
A user should feel like they are carrying one physical project file through the factory. Every department opens the same file, completes its work, and passes it to the next stage. No department recreates information, no department searches across disconnected modules, and no department loses context. The software simply guides the project from Customer Order to Payment in the exact way the factory operates.
