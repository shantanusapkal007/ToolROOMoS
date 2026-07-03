# ToolRoomOS 🏭
**The Next-Generation Manufacturing Operating System**

![ToolRoomOS Prototype](./docs/assets/banner.png) *(Note: Add a real banner image here later)*

ToolRoomOS is a comprehensive, full-stack enterprise application designed to manage the end-to-end lifecycle of a manufacturing plant. Built from the ground up to replace fragmented legacy systems, it operates on a single source of truth—the **Project Workspace**.

## 🚀 Vision: "Capture Once, Configure Centrally, Reuse Everywhere"
Unlike traditional ERPs that feel like managing spreadsheets, ToolRoomOS is designed around a modern **Mission Control** interface. It features:
*   **A Unified Project Workspace:** Engineering, Procurement, Production, Quality, and Finance teams all operate within the exact same project context.
*   **Metadata-Driven Architecture:** The Master Data & Settings platform runs on a custom **Smart Engine** (Smart Table & Smart Form), rendering UI dynamically based on entity registries. No duplicated forms!
*   **Glassmorphism Aesthetics:** Built with a premium, dark-mode-first, highly animated UI using Tailwind CSS and Lucide Icons.

---

## 🏗️ Architecture Stack

ToolRoomOS is a decoupled monorepo leveraging modern enterprise technologies:

### Frontend (Mission Control)
*   **Framework:** Next.js 16 (App Router) & React 19
*   **Styling:** Tailwind CSS (Custom Glassmorphism Design System)
*   **State Management:** React Context + Custom Hooks
*   **Data Fetching:** Axios

### Backend (The Brain)
*   **Framework:** NestJS
*   **Database ORM:** Prisma
*   **Language:** TypeScript (Strict Mode)
*   **Validation:** `class-validator` & `class-transformer`

### Database
*   **Engine:** PostgreSQL
*   **Schema Layers:** 
    *   *Layer 1:* Master Data (Company, Plants, Machines)
    *   *Layer 2:* Business Objects (Projects)
    *   *Layer 3:* Business Documents (BOM, PO, GRN)
    *   *Layer 4:* Operational Events (Machine Logs, Inspections)
    *   *Layer 5:* Financial Outcomes (Cost Rollups, Invoices)

---

## 🛠️ Key Modules

1. **Master Data & Settings (V2.0)**
   A completely dynamic module supporting Customers, Vendors, Materials, Machines, and Employees with built-in Audit Timelines, CSV Exports, and soft-delete archiving.
2. **Engineering**
   Drawing management, multi-level Bill of Materials (BOM), and routing definition.
3. **Procurement & Inventory**
   Purchase Order generation, Goods Receipt Notes (GRN), and Material Issue tracking with Heat Number traceability.
4. **Production & Quality**
   Machine Shop Daily Reports (MSDR) logging setup/cutting times and Inspection gates for Pass/Rework/Scrap limits.
5. **Finance**
   Automated real-time cost rollups (Material + Machine + Logistics) and Tax Invoicing.

---

## 📦 Getting Started

### Prerequisites
*   Node.js (v20+)
*   PostgreSQL Database

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shantanusapkal007/ToolROOMoS.git
   cd ToolROOMoS
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   # Configure your .env file with your DATABASE_URL
   npx prisma migrate dev
   npm run start:dev
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the port specified).

---

## 📄 Documentation
Extensive documentation defining the business logic and database blueprint can be found in the `/docs` directory. 
*   [Database Blueprint](./docs/12_Database/Database_Blueprint.md)
*   [Workflow Definitions](./docs/07_Workflows/Workflow_Definitions.md)
*   [Roles and Permissions](./docs/15_Dictionaries/Roles_and_Permissions.md)

---
*ToolRoomOS — Built to manufacture the future.*
