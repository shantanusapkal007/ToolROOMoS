# Role-Based Operator Manuals

ToolRoom ERP is highly customized based on your assigned Role. When you log in, the system intentionally hides menus and data that are not relevant to your job, ensuring a clean and focused workspace.

Please locate your role below for instructions on your daily tasks.

---

## 1. Sales Executive
Your primary goal is to manage customer relationships and ensure orders are priced profitably and accurately.
- **Daily Screens:** `CRM`, `Quotations`, `Sales Orders`.
- **Key Task - Creating an RFQ:** When a customer requests pricing, open the `Quotations` module. The system will automatically calculate the raw material costs and estimated machine times based on the Engineering BOM. Add your markup margin and generate the PDF Quote.

## 2. Purchase Officer
You are responsible for ensuring the factory never runs out of raw materials while maintaining cash flow.
- **Daily Screens:** `Procurement`, `Vendors`, `Inventory Alerts`.
- **Key Task - Managing Supplier RFQs:** When an internal Purchase Requisition (PR) is approved, convert it into a Supplier RFQ. Send this to multiple vendors to receive bids.
- **Key Task - Blanket POs:** For high-volume consumables (e.g., cutting fluid), establish a Blanket PO to lock in a price for the entire year, drawing down quantities monthly.
- **Key Task - Invoice Matching:** Before authorizing payment, the system forces a 3-way match: PO Quantity == GRN Quantity == Supplier Invoice Quantity.

## 3. Warehouse Operator
You control the physical movement of goods and ensure the digital inventory perfectly matches physical reality.
- **Daily Screens:** `Inventory`, `Goods Receipt`, `Stock Ledger`.
- **Key Task - Processing a GRN:** When a delivery truck arrives, verify the physical items against the PO. Create a Goods Receipt Note (GRN) to officially move the items into stock. 
- **Key Task - Physical Counts:** Use a barcode scanner to perform routine Cycle Counts, ensuring system quantities match shelf quantities.

## 4. Machine Operator
You are the execution engine of the factory. You interact with the system primarily via robust Shop Floor Tablets.
- **Daily Screens:** `Operator Dashboard` (Tablet View).
- **Key Task - Labor Logging:** Tap your name to log in. Tap `Start` on your assigned Work Order to begin your shift.
- **Key Task - Declaring Production:** At the end of the job, accurately type in the Good Quantity produced and any Scrap generated. The system calculates your runtime automatically.

## 5. Quality Inspector
You are the gatekeeper ensuring defective products never reach the customer or the next stage of production.
- **Daily Screens:** `Quality`, `Inspections`, `NCR`.
- **Key Task - Incoming Inspection:** Check raw materials immediately after a GRN is created. If they fail, change their status to `Quarantine` and generate a Return to Vendor (RTV) ticket.
- **Key Task - In-Process Checks:** Follow the digital inspection plans attached to active Work Orders on the shop floor.

## 6. Maintenance Engineer
You ensure factory uptime and machine health.
- **Daily Screens:** `Maintenance`, `Breakdown Tickets`.
- **Key Task - Breakdown Resolution:** When your phone alerts you to a machine failure, acknowledge the ticket, apply LOTO procedures if necessary, replace the faulty parts (which deducts them from spare part inventory), and close the ticket to turn the machine 'Green' again on the Live Timeline.

## 7. Finance Officer
You manage the monetary lifeblood of the company.
- **Daily Screens:** `Finance`, `Invoicing`, `Costing`.
- **Key Task - WIP Clearing:** At month-end, review all open Work Orders. Settle variances between Standard and Actual costs to keep the General Ledger accurate.
- **Key Task - AP / AR:** Process Accounts Payable for matched vendor invoices and track Accounts Receivable for dispatched customer orders.

## 8. Plant Manager
You require high-level, real-time oversight without getting bogged down in minute data entry.
- **Daily Screens:** `Analytics`, `Dashboards`, `Live Machine Timeline`.
- **Key Task - Executive Oversight:** Monitor the OEE Dashboard to identify bottlenecks. Track Inventory Turnover rates, Supplier Delivery Performance, and overall Customer Margin profitability.
