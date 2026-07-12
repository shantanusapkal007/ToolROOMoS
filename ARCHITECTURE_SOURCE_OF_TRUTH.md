# Architecture Source of Truth

This document dictates the SINGLE source of truth for every reusable system in ToolRoomOS.

**RULE**: Whenever a new implementation is considered, this document MUST be updated first. If an implementation is locked, NO duplicates or alternatives may be created.

## Core Layout Systems

### Universal Layout
* **Owner**: `src/components/layout/UniversalLayout.tsx`
* **Purpose**: The main application shell providing sidebar, workspace, and floating modals.
* **Forbidden**: Page-specific layouts, nested UniversalLayouts, Project-specific shells (e.g., `projects/[id]/layout.tsx` must eventually migrate to use this).
* **Status**: 🔒 LOCKED

### Module Layout
* **Owner**: `src/components/layout/ModuleLayout.tsx` (To be extracted in Phase 5)
* **Purpose**: The standard wrapper for module-level routing, breadcrumbs, and tabs.
* **Forbidden**: Copy-pasting 100 lines of layout boilerplate into every module.
* **Status**: ⏳ PENDING ABSTRACTION

### Workbench
* **Owner**: `src/components/workspace/UniversalWorkbench.tsx` (To be standardized)
* **Purpose**: The standard contract for document pages (exposing Toolbar, Inspector, Selection, Dirty, Busy, Commands, History).
* **Forbidden**: Custom document wrappers, features importing pages.
* **Status**: ⏳ PENDING ABSTRACTION

## Navigation & Actions

### Toolbar
* **Owner**: `src/components/layout/UniversalToolbar.tsx`
* **Controller**: `src/hooks/useStandardToolbar.ts`
* **State**: `src/store/useToolbarStore.ts`
* **Purpose**: Global actions (New, Save, Delete, Duplicate, Print, Import, Export, History, Attachments, Refresh, Search).
* **Forbidden**: `LegacyToolbar`, custom page-level toolbars, placing business workflow actions in the toolbar.
* **Status**: 🔒 LOCKED

### Document Actions
* **Owner**: `src/components/layout/DocumentActions.tsx`
* **Purpose**: Business workflow actions (Approve, Issue, Start, Pause, Complete, Reject). 
* **Forbidden**: Placing these actions in the Universal Toolbar.
* **Status**: 🔒 LOCKED

### Context Menu
* **Owner**: `src/components/layout/UniversalContextMenu.tsx`
* **State**: `src/store/useContextMenuStore.ts`
* **Purpose**: Right-click actions across all tables and grids.
* **Forbidden**: Page-specific custom context menus.
* **Status**: 🔒 LOCKED

### Command Palette
* **Owner**: `src/components/search/CommandPalette.tsx`
* **State**: `src/store/useCommandStore.ts`
* **Purpose**: Global keyboard-driven navigation and search.
* **Forbidden**: `src/components/ui/CommandPalette.tsx` (Duplicate to be removed).
* **Status**: 🔒 LOCKED

### Keyboard Shortcuts
* **Owner**: `src/hooks/useUniversalKeyboard.ts`
* **Purpose**: Global keybindings (Ctrl+S, Ctrl+K, etc).
* **Forbidden**: Page-specific `useEffect` keydown listeners.
* **Status**: 🔒 LOCKED

## UI & Panels

### Inspector
* **Owner**: `src/components/layout/UniversalInspector.tsx`
* **Purpose**: Right-side panel for metadata, attachments, and secondary actions.
* **Forbidden**: Custom side panels, Inspector owning business logic or mutating data directly.
* **Status**: 🔒 LOCKED

### History
* **Owner**: `src/components/layout/UniversalHistory.tsx`
* **Purpose**: Audit logs and revision history modal.
* **Forbidden**: Custom history implementations per module.
* **Status**: 🔒 LOCKED

### Attachments
* **Owner**: `src/components/layout/UniversalAttachments.tsx`
* **Purpose**: Global attachment management modal.
* **Forbidden**: Custom attachment uploaders.
* **Status**: 🔒 LOCKED

### Tables & Grids
* **Owner (Read-Only)**: `src/components/tables/UniversalTable.tsx`
* **Owner (Editable)**: `src/components/tables/EditableDataGrid.tsx`
* **Forbidden**: `SmartTable.tsx` (Duplicate to be removed/merged).
* **Status**: 🔒 LOCKED

### Forms & Inputs
* **Owner (Controlled)**: `src/components/ui/Input.tsx`, `Select.tsx`
* **Owner (React Hook Form)**: `src/components/forms/FormInput.tsx`, `FormSelect.tsx`
* **Forbidden**: Ad-hoc raw HTML inputs without unified styling.
* **Status**: 🔒 LOCKED

## Data Flow Contract

1. **API**: `src/lib/api.ts` (Axios client)
2. **Service**: `src/services/*.service.ts` (API wrappers)
3. **Hook**: `src/hooks/use*.ts` (React Query mutations/queries)
4. **Store**: `src/store/*.ts` (Zustand UI state)
5. **Component**: `src/app/.../page.tsx` (Renders UI and calls hooks)

**Forbidden**: 
- Skipping layers (e.g., calling Axios directly inside a component).
- Components containing raw `fetch` calls.
- Mutating state inside grids directly without passing through hooks.
- Duplicating business logic.
