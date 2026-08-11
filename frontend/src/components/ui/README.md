# ToolRoomOS UI Design System & Component Guidelines

This directory contains the single source of truth for UI primitives and components in ToolRoomOS. All components adhere to the central design tokens defined in `src/lib/tokens.ts` and `src/app/globals.css`.

---

## 1. Design Tokens & Rhythm Scale

### Colors
- **Primary Purple (`color.primary`)**: `#7132f5`
  - Hover: `#5741d8` (`color.primary-hover`)
  - Deep / Active: `#5b1ecf` (`color.primary-deep`)
  - Subtle Bg: `rgba(113, 50, 245, 0.12)` (`color.primary-subtle`)
- **Semantic Status Hierarchy**:
  - `color.semantic.success`: `#149e61` (Subtle bg: `rgba(20, 158, 97, 0.12)`, Dark text: `#026b3f`)
  - `color.semantic.warning`: `#f59e0b` (Subtle bg: `rgba(245, 158, 11, 0.12)`, Dark text: `#b45309`)
  - `color.semantic.danger`: `#ee1d36` (Subtle bg: `rgba(238, 29, 54, 0.12)`, Dark text: `#b91c1c`)
  - `color.semantic.info`: `#7132f5` (Subtle bg: `rgba(113, 50, 245, 0.12)`, Dark text: `#5741d8`)
- **Neutrals**:
  - `ink`: `#101114` (Primary text)
  - `cool-gray`: `#686b82` (Secondary text / neutral icons)
  - `silver-blue`: `#9497a9` (Muted captions / placeholder text)
  - `border-gray` / `hairline`: `#dedee5` (Standard borders)
  - `canvas` / `white`: `#ffffff` (Card & panel surfaces)

### Spacing & Grid System
- Strict **8pt Spacing Scale**: `4px` (`spacing-1`), `8px` (`spacing-2`), `12px` (`spacing-3`), `16px` (`spacing-4`), `24px` (`spacing-6`), `32px` (`spacing-8`), `48px` (`spacing-12`).
- Form controls in toolbars (Search, Select, Date, Buttons) use **36px** (`h-9`) height and `rounded-[10px]` border radius for seamless vertical alignment.

### Typography
- Page Titles: `typography.heading.xl` / `.text-heading-xl` (28px / 700 / line-height 1.25 / letter-spacing -0.02em).
- Section Titles: `.text-display-xs` / `text-display-sm` (18px–20px / 600).
- Body: `.text-body-sm` (14px / 400), `.text-body-sm-strong` (14px / 500).
- Labels / Captions: `.text-caption` (14px / 500), `.text-eyebrow-uppercase-sm` (11px / 600 / uppercase).

---

## 2. Component Reference

### 1. `Button` (`src/components/ui/Button.tsx`)
Formalized 3-tier hierarchy:

| Variant | Purpose | Visual Style | Interaction States |
| :--- | :--- | :--- | :--- |
| `primary` | Reserved for the single primary CTA per view (e.g., "Open Daily Report Sheet") | Solid purple fill (`bg-primary`), white text | Hover (`#5741d8`), Active (`#5b1ecf` + scale 0.98), Focus-visible (2px ring), Disabled (50% opacity), Loading (spinner) |
| `secondary` | Supporting actions (e.g., "Export CSV", "Inter-Section Transfer", "Reset Filters") | Outlined white card (`border-border-gray`), ink text | Hover (border-cool-gray/50 + subtle gray bg), Active (scale 0.98), Focus-visible (2px ring), Disabled, Loading |
| `icon-only` (`iconOnly`) | Universal non-page-specific actions (e.g. notifications bell, settings gear) | Square aspect ratio (`h-9 w-9`), centered icon | Hover, Active (scale 0.95), Focus-visible (2px purple ring), Accessible `aria-label` required |

**Props**:
- `variant`: `'primary' | 'secondary' | 'icon-only'`
- `size`: `'sm' (36px)` | `'md' (40px)` | `'lg' (48px)` | `'icon'`
- `isLoading`: `boolean` (renders spinner, disables button, sets `aria-busy="true"`)
- `leftIcon` / `rightIcon`: `React.ReactNode`
- `aria-label`: `string` (required for `icon-only`)

---

### 2. `SearchInput` (`src/components/ui/SearchInput.tsx`)
Unified search component supporting contextual modes:

| Context | Usage | Features |
| :--- | :--- | :--- |
| `global` | TopBar, global page headers | Displays `⌘K` keyboard chip, triggers command palette on click / Cmd+K |
| `local` | In-panel table filters, dropdown searches | Scoped to current panel, text input with clear `X` button |

**Shared Standards**:
- Height: `h-9` (36px)
- Border Radius: `rounded-[10px]`
- Icon: Left search icon in silver-blue, turns purple on focus
- Focus: `focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary`

---

### 3. `Select` (`src/components/ui/Select.tsx`)
Form dropdown select component:
- Height: `h-9` (`sm`) or `h-10` (`md`)
- Border Radius: `rounded-[10px]`
- States:
  - Default: `border-border-gray bg-white text-ink`
  - Hover: `hover:border-cool-gray/50`
  - Focus-visible: `focus:border-primary focus:ring-2 focus:ring-primary/20`
  - Chevron Icon: Animates and rotates 180° on focus/open (`peer-focus:rotate-180 transition-transform duration-200`)

---

### 4. `Tabs` (`src/components/ui/Tabs.tsx`)
Segmented tab bar navigation:
- Active Tab: Solid `color.primary` (`bg-primary`), white text, subtle elevation shadow
- Inactive Tab: `text-cool-gray hover:text-ink hover:bg-[rgba(148,151,169,0.08)]`
- Focus-Visible: 2px offset purple focus ring (`focus-visible:ring-2 focus-visible:ring-primary`)
- Supports numeric count badges and leading icons

---

### 5. `PageHeader` (`src/components/layout/PageHeader.tsx` & `src/components/ui/PageHeader.tsx`)
- Standardizes page title typography with `typography.heading.xl` (`text-heading-xl font-bold text-ink`)
- Incorporates breadcrumbs, subtitle, global command palette trigger, and notification actions

---

### 6. `StatusBadge` (`src/components/ui/StatusBadge.tsx`)
- Standardizes semantic status pills across the platform
- Variants: `success` (Operational / Active), `warning` (Maintenance / Low Stock), `danger` (Offline / Breakdown), `info` (Engineering / CAD), `neutral`
