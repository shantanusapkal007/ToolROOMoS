# Administrator & Configuration Guide

This manual is exclusively for System Administrators managing the ToolRoom ERP platform. It details how to configure the foundational structures, security policies, and system-wide settings that govern how the ERP operates for end users.

## 1. Organizational Setup

ToolRoom ERP uses a strict hierarchical structure to map your physical business into the digital system.

### 1.1 Tenant & Company Creation
- **Tenant:** The ultimate boundary. Usually represents the parent holding company. Data is never shared across tenants.
- **Company:** A legal entity under a Tenant. Each company has its own base currency, tax registration (e.g., VAT/GST ID), and Chart of Accounts. 
  - *To create:* Navigate to `Admin -> Companies -> Add New`.

### 1.2 Plants & Warehouses
- **Plant (Facility):** A physical manufacturing location belonging to a Company. Plants define working calendars and shifts.
- **Business Unit & Department:** Logical groupings (e.g., "Automotive Unit", "Maintenance Department") used for cost allocation.
- **Cost Center:** Used strictly for financial tracking of expenses and overheads.
- **Warehouse:** Physical or logical storage locations. You must link a Warehouse to a specific Plant.

## 2. System Configuration

### 2.1 Localization Settings
Navigate to `Settings -> General` to define:
- **Currency:** Set the Base Currency for the Company. Add exchange rates for foreign transactions.
- **Calendar & Holidays:** Define the standard work week (e.g., Mon-Fri) and upload a list of statutory holidays. This calendar accurately schedules Work Orders and skips non-working days.
- **Shift Management:** Define shift timings (e.g., 1st Shift: 06:00 - 14:00). Shift data is critical for calculating operator attendance and OEE.
- **UOM (Unit of Measure):** Define standard units (Kg, Lbs, Pcs) and conversion factors (e.g., 1 Box = 10 Pcs).
- **Tax Templates:** Configure regional tax rules (e.g., 20% VAT, 5% State Tax) which automatically apply to Quotations and Invoices.

### 2.2 Feature Flags & Numbering Rules
- **Feature Flags:** Toggle entire modules on/off (e.g., disable "Subcontracting" if not applicable to the company) to simplify the UI for users.
- **Numbering Series:** Define the prefix, year format, and counter for auto-generated documents. 
  - *Example:* Set Purchase Orders to `PO-{{YYYY}}-{{MM}}-####` to generate `PO-2026-08-0001`.

### 2.3 Communication Settings
- **Email (SMTP):** Enter the SMTP Host, Port, and Credentials to allow the system to email PDF Quotes and Invoices.
- **WhatsApp/SMS Integration:** Add API tokens for Twilio or generic SMS gateways to send urgent machine breakdown alerts to maintenance staff.

## 3. Security, Roles, and Access

### 3.1 User Management
- Add users via `Admin -> Users`. 
- **Important:** You must map a user to a specific Company and Plant. A user mapped to Plant A cannot view the Inventory of Plant B.

### 3.2 Roles & Permissions
- ToolRoom ERP utilizes granular Role-Based Access Control (RBAC).
- Create a Role (e.g., "Warehouse Manager").
- Assign Read, Write, Edit, Delete, and Export permissions for individual modules (e.g., full access to Inventory, zero access to Finance).

### 3.3 Security Policies
- **Password Policies:** Enforce minimum length, special characters, and rotation every 90 days.
- **Session Timeout:** Automatically log out inactive users (e.g., 15 minutes for Finance roles).
- **IP Allowlisting:** Restrict login access to specific physical factory IP addresses.

### 3.4 Approval Matrix (Workflows)
- Define strict hierarchical rules for document authorization in `Admin -> Workflows`.
- *Example:* Set a rule on the "Purchase Order" document: `IF TotalAmount > $10,000 THEN require approval from Role: Finance Director`.

## 4. Maintenance and Backup

### 4.1 Backup & Restore
- The system automatically runs continuous Write-Ahead Log (WAL) archiving to cloud storage (S3).
- **Manual Backup:** Go to `Admin -> Database -> Request Snapshot` to download a point-in-time `.dump` file.

### 4.2 Audit Logs
- Navigate to `Admin -> Audit Logs` to view the immutable ledger of all system changes. You can filter by Date, User, or specific Document ID to investigate discrepancies.

### 4.3 Branding & Themes
- Upload the company logo (used on the login screen and printed PDFs).
- Select primary and secondary theme colors to align the software with your corporate identity.
