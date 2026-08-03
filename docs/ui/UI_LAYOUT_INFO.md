# ToolRoomOS — Current UI & Layout Architecture Specification

> **Version**: 2.0.0 (Enterprise Manufacturing OS)  
> **Last Updated**: August 2026  
> **Design Language**: Apple Liquid Glass Design Language tailored for Enterprise Toolroom Operations  

---

## 1. Design Philosophy & Aesthetic Standards

ToolRoomOS implements an **Apple Liquid Glass Design Language** specifically engineered for high-density enterprise manufacturing environments. Rather than static boxy dashboards, the interface behaves as a physical spatial workspace.

### Core Principles
1. **Multi-Layer Translucency (Apple Liquid Glass)**
   - Backdrop blur (`blur(40px)` to `blur(120px)`) combined with high saturation (`saturate(180%)`).
   - Layer-specific inner specular highlights (`inset 0 1px 0 rgba(255, 255, 255, 1)`).
   - SVG fractal noise texturing overlay (`mix-blend-mode: overlay`) to eliminate gradient banding and provide tactile crystal depth.
   - Micro hairline semi-transparent borders (`rgba(15, 15, 20, 0.08)`).
2. **Spatial Design & Elevation**
   - Floating spatial planes rather than enclosed rectangular containers.
   - Separation via elevation, ambient shadows (`--shadow-floating`, `--shadow-glass`), and soft lighting refractions.
3. **Motion Physics**
   - Emulates Apple Human Interface Guidelines using spring physics (`type: "spring", stiffness: 300, damping: 30`).
   - Micro-interaction hover interpolations (120ms), panel transitions (250ms), page routes (450ms).
4. **Enterprise Precision & Typography Hierarchy**
   - Clean 8-point spatial rhythm.
   - Clear visual hierarchy built with **Outfit** (UI Headings/Body) and **Space Grotesk** (Monospace/Technical/Financial Telemetry).

---

## 2. Global Styling & CSS Design System Tokens

Located in [globals.css](file:///e:/projects/enterprise%20toolroom/ToolRoomOS/frontend/src/app/globals.css).

### 2.1 Color Palette & Semantic Color System
| Category | Variable / Token | Value / Hex | Usage / Context |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `--bg-primary` | `#FBFBFC` | Main application background |
| **Surface Background** | `--bg-surface` | `rgba(255, 255, 255, 0.72)` | Glass surfaces & cards |
| **Panel Glass** | `--bg-panel` | `rgba(255, 255, 255, 0.85)` | High contrast content panels |
| **Text Primary** | `--text-primary` | `#0A0A0C` | High contrast headings & values |
| **Text Secondary** | `--text-secondary` | `#3F3F46` | Subtitles & form labels |
| **Text Tertiary** | `--text-tertiary` | `#71717A` | Metadata, captions & disabled text |
| **Engineering Accent** | `--color-engineering` | `#2563EB` (Blue) | CAD, Drawing & Engineering modules |
| **Purchase Accent**| `--color-purchase` | `#D97706` (Amber) | Procurement & Supplier POs |
| **Inventory Accent** | `--color-inventory` | `#059669` (Emerald) | Stock, Steel & Toolroom Spares |
| **Production Accent**| `--color-production` | `#7C3AED` (Purple) | Machining, Fitting & Stage Progress |
| **Quality Accent** | `--color-quality` | `#0891B2` (Cyan) | CMM Inspection & Quality Approval |
| **Dispatch Accent** | `--color-dispatch` | `#EA580C` (Orange) | Shipping, Packing & Customer Delivery |
| **Finance Accent** | `--color-finance` | `#16A34A` (Green) | MTD Revenue, Invoicing & Payroll |

### 2.2 Typography Scale
- **Display XL**: `4.5rem` / `72px` (Hero metrics, top telemetry)
- **Display**: `3.5rem` / `56px` (Main dashboard metrics)
- **Heading XL**: `2.5rem` / `40px` (Page titles)
- **Heading**: `2.0rem` / `32px` (Section headers)
- **Title**: `1.5rem` / `24px` (Card titles, modal titles)
- **Body Large**: `1.125rem` / `18px` (Featured content body)
- **Body**: `1.0rem` / `16px` (Standard inputs, table cell text)
- **Caption**: `0.875rem` / `14px` (Secondary text, table headers)
- **Micro**: `0.75rem` / `12px` (Uppercase tracking labels, badges)

---

## 3. Main Application Shell & Layout Architecture

The overall layout is structured in [layout.tsx](file:///e:/projects/enterprise%20toolroom/ToolRoomOS/frontend/src/app/layout.tsx) and [page.tsx](file:///e:/projects/enterprise%20toolroom/ToolRoomOS/frontend/src/app/page.tsx).

```
+---------------------------------------------------------------------------------------+
|  DYNAMIC GLOWING BACKGROUND ORBS (Fixed Ambient Layer - Blue, Purple, Emerald, Orange) |
| +-----------------------------------------------------------------------------------+ |
| | COLLAPSIBLE GLASS SIDEBAR       | MAIN WORKSPACE CONTENT AREA (pl-[5.5rem])        | |
| | (Fixed Left)                    |                                                 | |
| |                                 | +---------------------------------------------+ | |
| | - Logo: ToolRoomOS              | | PAGE HEADER / UNIVERSAL TOOLBAR             | | |
| |                                 | | Breadcrumbs, Context Actions, Live Telemetry| | |
| | - Navigation Links:             | +---------------------------------------------+ | |
| |   1. Dashboard (Command Center) | |                                             | | |
| |   2. Projects (3D/CAD/BOM)      | | VIEW / MODULE CANVAS CONTENT               | | |
| |   3. Master Data Hub            | | (Dashboard, Projects, Master Data, Inventory| | |
| |   4. Global Inventory           | |  Maintenance, Payroll, Reports, Settings)   | | |
| |   5. Maintenance                | |                                             | | |
| |   6. Reports (Analytics)        | |                                             | | |
| |   7. Monthly Payroll & Work     | |                                             | | |
| |   8. Activity Log               | |                                             | | |
| |   9. System Settings            | |                                             | | |
| |                                 | |                                             | | |
| | - User Profile Card (Sign Out)  | |                                             | | |
| +---------------------------------+-----------------------------------------------+ | |
|                                                                                       | |
|  GLOBAL FLOATING OVERLAYS: SpotlightWrapper | CommandPalette (Cmd+K) | NotificationCenter | |
+---------------------------------------------------------------------------------------+
```

### 3.1 Ambient Backdrop Layer
- **Fixed Orbs**: 4 dynamic blurred ambient lighting spheres (`blur-[120px]` to `blur-[150px]`) that subtly float in the background:
  - Top-Left: Soft Blue (`bg-blue-400/15`)
  - Top-Right: Soft Purple/Indigo (`bg-indigo-400/10`)
  - Bottom-Left: Emerald (`bg-emerald-400/10`)
  - Center: Warm Amber (`bg-orange-200/20`)
- **Noise Texture Layer**: Subdued overlay (`opacity: 0.03`, `mix-blend-overlay`) preventing color banding.

### 3.2 Collapsible Glass Sidebar (`Sidebar.tsx`)
- **Location**: `fixed left-3 top-3 bottom-3 z-50`
- **Behavior**: Hover-expanding dynamic sidebar. Collapsed width = `4.5rem` (`72px`), Expanded width = `17rem` (`272px`). Powered by Framer Motion spring physics.
- **Styling**: `glass-sidebar` class with `backdrop-filter: blur(40px) saturate(160%)`, rounded corners (`var(--radius-2xl)`), soft shadow (`20px 0 60px rgba(15,15,20,0.05)`).
- **Active Navigation Pill**: Uses Framer Motion `layoutId="activeNav"` for seamless animated sliding highlights when navigating between pages.

### 3.3 Universal Toolbar (`UniversalToolbar.tsx`)
- **Location**: Top of main workspace module headers.
- **Functionality**: Standardized, command-bar interface linked to Zustand state (`useToolbarStore`).
- **Action Set**:
  - `New` (Primary Action Button)
  - `Save` (Dynamic glowing indicator when modified/isDirty)
  - `Duplicate`, `Revision` (Git-like revisioning for tooling BOMs)
  - `Import`, `Export` (Excel/CSV integration)
  - `Print`, `Attach`, `History`
  - `Refresh`, `Search`
  - `Delete` (Danger state, active upon multi-row selection)

---

## 4. Module & Page Layout Breakdown

### 4.1 Mission Control Dashboard (`/` -> `MissionControl.tsx`)
The central operational nerve center displaying real-time shopfloor telemetry:
- **Header Telemetry Bar**:
  - Main Title & Subtitle.
  - Live Digital Clock (HH:MM AM/PM) & Date.
  - **Live Foreign Exchange Widget**: Real-time USD/INR, EUR/INR, GBP/INR rates fetched via exchangerate-api with pill indicators.
- **Primary KPI Ribbon (4 Grid Cards)**:
  1. *Monthly Sales (w/o GST)*: Net tax-free realized revenue.
  2. *Monthly Actual (Done)*: Current MTD vs target.
  3. *Monthly Remaining*: Remaining deficit to reach target.
  4. *Annual Estimated Target*: Interactive modal editor allowing target updates with presets (e.g. ₹50L, ₹1Cr, ₹1.5Cr, ₹2.5Cr, ₹5Cr).
- **Department Load Overview (`DepartmentLoadOverview.tsx`)**: Visual breakdown of workload across Engineering, Machining, Fitting, Trial, Quality.
- **Active Projects Schedule**: Project timeline cards with animated shimmer progress bars, status stage badges, and overdue status indicators.
- **Financial Pulse Section**:
  - MTD Realization card with target progress bar.
  - Open Receivables & Net Taxable Sales.
  - **11-Period Velocity Sparkline**: Interactive bar chart displaying live period invoicing velocity.
- **Critical Action Drawer**: Highlights overdue projects requiring immediate shopfloor intervention.

### 4.2 Projects & Tooling Module (`/projects`)
- **3D CAD Tooling Viewer (`/components/ui/3d`)**: Three.js / React Three Fiber interactive 3D assembly inspector for die sets, mould plates, and components.
- **Gantt & Stage Pipeline**: Stage progression tracking (`DESIGN`, `PATTERN`, `MACHINING`, `HEAT_TREATMENT`, `FITTING`, `TRIAL`, `INSPECTION`, `DESPATCH`).
- **BOM (Bill of Materials) Tree**: Interactive nested tree view for die components, raw steel requirements, and standard hardware.

### 4.3 Master Data Hub (`/master-data`)
- **Tabbed Interface**:
  - Customers / Clients (GSTIN, Address, Payment Terms)
  - Suppliers / Steel Stockists
  - Machines & Workstations (CNC, VMC, EDM, Grinding, Milling)
  - Steel Grades & Materials (P20, D2, H13, EN31, Mild Steel)
  - Standard Hardware Library (Ejector Pins, Guide Pillars, Springs, Screws)
  - Operation Masters & Hourly Rates
- **Components Used**: `SmartTable.tsx`, `SmartForm.tsx`, `Combobox.tsx`, `PageHeader.tsx`.

### 4.4 Global Inventory & Asset Management (`/assets`, `/inventory`)
- Stock status telemetry, raw material receipt logs, minimum reorder thresholds, bin location tracking.

### 4.5 Machine Maintenance OS (`/maintenance`)
- Preventive Maintenance (PM) schedules, breakdown logs, MTBF (Mean Time Between Failures) & MTTR (Mean Time To Repair) metrics.

### 4.6 Monthly Payroll & Worker Logs (`/payroll`)
- Worker attendance, piece-rate shift logs, overtime calculation, automated salary slip generator.

### 4.7 Reports & Manufacturing Analytics (`/reports`)
- Cost variance reports, machine OEE charts, monthly financial realization graphs, exportable PDF/Excel logs.

---

## 5. UI Component Library & Visual Systems (`src/components/ui`)

| Component | File Path | Key Features & Design Details |
| :--- | :--- | :--- |
| **SpotlightWrapper** | `components/ui/SpotlightWrapper.tsx` | Global mouse movement tracking injecting `--mouse-x` and `--mouse-y` variables for cursor lighting. |
| **CommandPalette** | `components/ui/CommandPalette.tsx` | Spotlight `Cmd+K` / `Ctrl+K` modal command search with instant fuzzy search and category grouping. |
| **NotificationCenter** | `components/ui/NotificationCenter.tsx` | Slide-out glass drawer showing system notifications, overdue alerts, and order milestones. |
| **SmartTable** | `components/ui/SmartTable.tsx` | Enterprise-grade grid with column sorting, inline search, pagination, bulk selection, and status badge formatting. |
| **SmartForm** | `components/ui/SmartForm.tsx` | Multi-step form builder with field validation, tabbed sections, and auto-complete dropdowns. |
| **PremiumDrawer** | `components/ui/PremiumDrawer.tsx` | Apple-styled slide-over panel for viewing details without leaving current context. |
| **Modal** | `components/ui/Modal.tsx` | Centered glass overlay dialog (`glass-modal`) with backdrop blur (`blur(28px)`) and spring entry animation. |
| **StatusBadge** | `components/ui/StatusBadge.tsx` | Semantic color-coded pills (Active, Overdue, Pending, In Progress, Completed). |
| **HistoryTimeline** | `components/ui/HistoryTimeline.tsx` | Audit trail timeline showing modification history, timestamps, and user avatars. |
| **ImportWizard** | `components/ui/ImportWizard.tsx` | Multi-stage Excel/CSV file importer with column mapping & error validation. |
| **AmbientCursor** | `components/ui/AmbientCursor.tsx` | Magnetic custom cursor follower that softly illuminates interactive elements on hover. |

---

## 6. Motion & Animation Standards

The motion design system is governed by Apple Human Interface guidelines and CSS keyframes in [globals.css](file:///e:/projects/enterprise%20toolroom/ToolRoomOS/frontend/src/app/globals.css):

```css
/* Motion Timing Tokens */
--motion-hover: 120ms;
--motion-click: 90ms;
--motion-expand: 220ms;
--motion-dialog: 280ms;
--motion-drawer: 320ms;
--motion-page: 450ms;
--motion-shared: 500ms;
```

### Keyframe Animations
- **`animate-float`**: Soft vertical floating motion (`translateY(-10px)`) for background ambient orbs over an 8-second cycle.
- **`shimmer`**: Skewed gradient overlay (`skewX(-20deg)`) for loading progress bars.
- **`slideUp`**: Entrance animation for KPI cards (`translateY(20px)` to `translateY(0)` with `cubic-bezier(0.16, 1, 0.3, 1)` easing).

---

## 7. Print System Architecture (`@media print`)

ToolRoomOS includes print optimizations for shopfloor job cards, POs, and invoices:
- **Chrome Suppression**: Automatically hides `.hide-on-print`, `aside`, `header`, `nav`, `button`, and background glowing ambient orbs.
- **Background Reset**: Strips dark translucent glass filters and forces clean `#FFFFFF` canvas with crisp `#000000` text.
- **Layout Unclamping**: Removes fixed heights (`h-screen`), overflow restrictions (`overflow-hidden`), and enables full document flow.

---

## 8. Summary of UI File Structure

```
frontend/src/
├── app/
│   ├── globals.css                # Global CSS Tokens, Apple Glass Utilities, Print rules
│   ├── layout.tsx                 # Root Layout Shell, Providers, Ambient Backdrop Orbs
│   ├── page.tsx                   # Main Entry Point rendering Mission Control
│   ├── projects/                  # Projects, 3D CAD & Timeline views
│   ├── master-data/               # Master Data hub (Customers, Machines, Materials)
│   ├── inventory/ & assets/       # Material stock & spare parts
│   ├── maintenance/               # PM schedules & breakdown tickets
│   ├── payroll/                   # Worker logs & monthly slips
│   ├── reports/                   # Financial analytics & exportable reports
│   ├── activity-log/              # System event audit log
│   └── settings/                  # Preferences & Role permissions
├── components/
│   ├── layout/                    # Shell Layout (Sidebar, UniversalToolbar, PageHeader)
│   ├── dashboard/                 # MissionControl, DepartmentLoadOverview, KpiCards
│   ├── ui/                        # Glass primitives, SmartTable, SmartForm, Modals, 3D
│   └── auth/                      # AuthProvider, PermissionProvider
├── store/                         # Toolbar & State management (Zustand)
└── hooks/                         # React Query data fetching hooks
```

---
*End of ToolRoomOS UI & Layout Specification.*
