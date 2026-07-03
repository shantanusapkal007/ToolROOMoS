# ToolRoom ERP V1 - Comprehensive & Detailed User Manual

Welcome to **ToolRoom ERP V1**, a modern, interconnected Enterprise Resource Planning system built from the ground up for tooling, manufacturing, and engineering companies. 

Unlike legacy software, ToolRoom ERP V1 is built around an **Event-Driven Architecture**. This means that when something happens in one department (like a customer approving a quote), the system automatically notifies the next department (Engineering gets a task, Procurement gets a materials request). No more sending emails or walking paperwork across the factory.

This manual provides an in-depth look at all 11 modules, common workflows, and step-by-step instructions for everyday tasks.

---

## Table of Contents
1. [Key Terminology Guide](#1-key-terminology-guide)
2. [Navigating the System](#2-navigating-the-system)
3. [Role-Based Quick Start](#3-role-based-quick-start)
4. [Module Deep Dives & Step-by-Step Instructions](#4-module-deep-dives--step-by-step-instructions)
   - [CRM (Sales)](#crm-sales)
   - [Procurement (Supply Chain)](#procurement-supply-chain)
   - [Engineering & PLM (Design)](#engineering--plm-design)
   - [Inventory (WMS)](#inventory-wms)
   - [Production (MES)](#production-mes)
   - [Quality Control (QMS)](#quality-control-qms)
   - [Maintenance (EAM)](#maintenance-eam)
   - [Financial Accounting](#financial-accounting)
   - [Analytics (Control Tower)](#analytics-control-tower)
5. [The Ultimate End-to-End Workflow](#5-the-ultimate-end-to-end-workflow)

---

## 1. Key Terminology Guide

Manufacturing has its own language. Here is how ToolRoom ERP V1 translates industry terms into digital features:

- **ATP (Available to Promise):** Engine that ensures Sales cannot sell parts we don't have.
- **OEE (Overall Equipment Effectiveness):** A score (0-100%) telling you how efficiently a machine is running. It looks at Availability (uptime), Performance (speed), and Quality (good parts vs. scrap).
- **LOTO (Lockout/Tagout):** A mandatory safety protocol for machine repair, digitally enforced via signatures.
- **NCR (Non-Conformance Report):** A "red tag." Used to digitally lock down bad parts so they cannot be shipped to the customer (via WMS Quarantine).
- **CAPA (Corrective and Preventive Action):** The 8-step (8D) investigation process to find root causes.
- **BOM (Bill of Materials):** The "recipe" for a part. Every piece of steel, plastic, and screw needed to build it.
- **WIP (Work In Progress):** The financial value of material that is currently being machined on the floor.

---

## 2. Navigating the System

ToolRoom ERP V1 features a "Glassmorphic," dark-mode-first design designed to reduce eye strain on the factory floor while feeling incredibly fast and responsive.

### The Layout
1. **Left Rail (Main Menu):** The vertical bar on the far left. Contains icons for every major department (Dashboard, CRM, Engineering, Manufacturing, Quality, etc.). Clicking these switches your primary workspace.
2. **Secondary Sidebar:** Located next to the Left Rail. This acts as a table of contents for the department you are in.
3. **Contextual Slide-Over Drawers:** Instead of forcing you to load a new page when you want to view a specific item, a drawer smoothly slides out from the right side of the screen.

---

## 3. Role-Based Quick Start

Depending on your job, you will use different parts of the system:

- **Executives & Controllers:** You will spend your time in the **Analytics** (Control Tower) and **Finance** modules. Your goal is to watch OEE, Double-Entry Trial Balances, and clear Variances.
- **Sales Reps:** You live in the **CRM**. Your goal is to move RFQs from "Lead" to "Won" in the Pipeline.
- **Engineers:** You live in the **Engineering Hub (PLM)**. You manage CAD files, control Immutable BOM releases, and manage formal ECOs.
- **Shop Floor Operators:** You will look at the **MES Cockpit** on a tablet. You see what job is assigned to your machine and log setup/runtime.
- **Quality Inspectors:** You log defect data in the **QMS**. If a part fails, you open an **NCR** which physically locks the item in the WMS.
- **Maintenance Techs:** You use the **EAM Mobile App** to sign digital LOTO tags and repair broken machines (which instantly alerts the MES scheduler).

---

## 4. Module Deep Dives & Step-by-Step Instructions

### CRM (Sales)
- **Features:** Order Capture, Available-To-Promise (ATP) engine preventing over-selling.

### Procurement (Supply Chain)
- **Features:** Vendor routing, PO generation, and 3-Way matching to ensure AP is only paid when physical Goods Receipt aligns with the PO.

### Engineering & PLM (Design)
- **Features:** Strict management of Bill of Materials (BOM) and Routings. Once released, a BOM is mathematically immutable without a formal Engineering Change Order (ECO).

### Inventory (WMS)
- **Features:** Append-only ledger for all physical materials. Enforces negative inventory limits and handles instant QMS quarantine locks.

### Production (MES)
- **Features:** Finite Capacity Scheduler. Work Orders rigorously follow the sequence dictated by the PLM routing. Stops scheduling if EAM marks a machine down.

### Quality Control (QMS)
- **Features:** Disposition workflows, 8D CAPA investigations, and the Non-Conformance Report (NCR) engine.

### Maintenance (EAM)
- **Features:** Machine health state machines, PM (Preventive Maintenance) usage-triggers, and digital Lockout/Tagout (LOTO) protocols.

### Financial Accounting
- **Features:** The Double-Entry General Ledger. When MES closes a Work Order, Finance perfectly calculates the Standard vs Actual Cost and clears the WIP balance into specific Variance accounts. Enforces hard financial period locks.

### Analytics (Control Tower)
- **Features:** Aggregates data from all 10 operational modules using isolated, read-only CQRS models. Evaluates threshold rules and sends autonomous SMS/Email escalations if KPIs like Scrap Rate spike.

---

## 5. The Ultimate End-to-End Workflow

To see the true power of ToolRoom ERP V1, let's trace a single complex order from start to finish.

1. **The Request:** Sales logs a Lead in the **CRM**.
2. **The Review:** Engineering uses **PLM** to build a BOM and route.
3. **The Purchases:** Supply Chain sees the BOM requires special steel. They generate a **PO** in Procurement. 
4. **The Arrival:** The steel arrives. **WMS** marks it "Received", triggering the **Procurement** 3-way match, establishing the **Finance** AP liability.
5. **The Machining:** The **MES** Scheduler assigns the job to Machine A. The operator clicks "Start Job".
6. **The Hiccup:** The machine breaks. The operator logs an **EAM Work Order**. Maintenance signs the **LOTO** tag and fixes it. **MES** capacity dynamically adjusts.
7. **The Inspection:** The finished part goes to Quality. The inspector logs a defect into the **QMS**. An **NCR** is generated, instantly dropping a Quarantine lock on the item in the **WMS**.
8. **The Fix:** Quality Dispositions the part as Use-As-Is. The WMS lock lifts.
9. **The Financial Close:** The **MES** job is complete. The **Finance** engine runs `ClearWIP()`, absorbing the exact cost difference into a variance account.
10. **The Executive View:** The CEO opens the **Analytics Control Tower**. The dashboard automatically recalculates the factory-wide OEE, reflecting the brief machine downtime and the temporary quality defect.

By connecting every department natively, ToolRoom ERP V1 ensures that nothing falls through the cracks, communication is instantaneous, and you always have mathematically perfect insight into the health of your manufacturing business.
