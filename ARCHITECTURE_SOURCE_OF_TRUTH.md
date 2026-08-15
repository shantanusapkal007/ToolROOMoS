# ToolRoomOS Architecture Source of Truth

This document dictates the single source of truth for core reusable systems in ToolRoomOS.

## 1. Layout & Shell Systems

### Main Application Shell
* **Owner**: `src/components/layout/AppLayout.tsx`
* **Purpose**: Primary workspace wrapper providing collapsible Sidebar, TopBar, and fluid content viewport.
* **Status**: 🔒 LOCKED

### Top Bar & User Header
* **Owner**: `src/components/layout/TopBar.tsx`
* **Purpose**: Global search trigger, theme switcher (Light/Dark), notification center, and user profile badge.
* **Status**: 🔒 LOCKED

### Sidebar Navigation
* **Owner**: `src/components/layout/Sidebar.tsx`
* **State**: `src/store/useSidebarStore.ts`
* **Purpose**: Categorized module navigation with active route highlights.
* **Status**: 🔒 LOCKED

### Page Header Standard
* **Owner**: `src/components/ui/PageHeader.tsx`
* **Purpose**: Standard header banner with title, subtitle, breadcrumb, and primary action buttons.
* **Status**: 🔒 LOCKED

---

## 2. UI & Data Presentation Systems

### Data Tables
* **Owner**: `src/components/ui/SmartTable.tsx`
* **Purpose**: Standard table component supporting sorting, pagination, empty states, action menus, and virtualized row rendering for large datasets.
* **Status**: 🔒 LOCKED

### Forms & Input Controls
* **Owner**: `src/components/ui/Input.tsx`, `Select.tsx`, `Combobox.tsx`, `SmartForm.tsx`
* **Purpose**: Standardized, theme-aware form inputs with validation error states.
* **Status**: 🔒 LOCKED

### Modals & Drawers
* **Owner**: `src/components/ui/Modal.tsx`, `PremiumDrawer.tsx`
* **Purpose**: Overlay dialogs and slide-out panels for detail inspection and editing.
* **Status**: 🔒 LOCKED

---

## 3. Data Flow & Contract Standards

1. **API Client**: `src/lib/api.ts` (Axios wrapper with JWT interceptor, standardized envelope unwrapping, and error handling)
2. **Domain Services**: `src/services/*.service.ts` (Strongly-typed API service clients)
3. **State & Caching Hooks**: `src/hooks/use*.ts` (TanStack React Query hooks with bounded stale/gc times)
4. **Local UI Stores**: `src/store/*.ts` (Zustand stores for local client UI states)
5. **Page Views**: `src/app/**/page.tsx` (Next.js App Router views)
