<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ToolRoomOS Design System & Agent Rules

### 1. Design System & Semantic Colors Only
- Agents must EXCLUSIVELY use semantic tokens defined in `globals.css` (`bg-primary`, `bg-canvas`, `text-ink`, `text-cool-gray`, `text-mute`, `border-border-gray`, `bg-semantic-success-subtle`, `text-semantic-success-dark`, `bg-semantic-danger-subtle`, `text-semantic-danger-dark`, `bg-semantic-warning-subtle`, `text-semantic-warning-dark`).
- Arbitrary inline Tailwind palette classes (e.g. `text-zinc-800`, `text-zinc-600`, `bg-emerald-50`, `bg-red-50`, `bg-zinc-900`) and raw hex codes are STRICTLY FORBIDDEN.
- If a new color is needed, the agent MUST request explicit user permission and add it to the Design System tokens in `globals.css` before using it.

### 2. Dark Mode Text Contrast & Visibility
- NEVER use dark gray utility classes (`text-zinc-800`, `text-zinc-700`, `text-zinc-600`) for primary content or table cells, as they render dark-on-dark (black-on-black) in Dark Theme.
- ALWAYS use `text-ink` for main text/headings/table values (renders crisp white `#f3f4f8` in Dark Mode and deep `#101114` in Light Mode).
- Use `text-cool-gray` or `text-mute` for secondary labels, codes, and metadata.

### 3. Module Header Card Layout Standard
- Every main module and sub-page view MUST use the standardized Module Header Card:
  `<div className="bg-white border border-border-gray rounded-[12px] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">`
- Headers must include a 32x32px rounded icon container (`w-8 h-8 rounded-[12px] bg-primary flex items-center justify-center text-white shadow-sm shrink-0`).
- Title format: `text-xl font-semibold text-ink tracking-tight`. Subtitle format: `text-xs text-mute ml-[42px]`.

### 4. Structured Card Layouts & Inset Empty States
- DO NOT leave floating text, floating toolbars, or un-enclosed content sections on the page.
- Every distinct UI section (KPIs, dropzones, registries, tables, forms) MUST be enclosed inside explicit Design System Cards (`bg-white border border-border-gray rounded-[12px] shadow-subtle p-5`).
- NEVER use undefined or legacy classes like `glass-panel` that lack explicit card backgrounds or borders in Tailwind v4.
- Empty states MUST NOT be floating text — render them inside a structured inset card (`bg-canvas border border-border-gray rounded-[12px] p-6 text-center space-y-2`) with an icon badge, bold title, and helper subtext.

### 5. UI Components & Button Usage
- ALWAYS use the standardized `Button` component (`variant="primary"`, `variant="secondary"`, `variant="white"`, `variant="danger"`) with proper size and icon props instead of unstyled raw `<button>` elements.

### 6. Mandatory Light & Dark Theme Compatibility
- Whenever creating any new component, refactoring an existing component, or modifying any UI layout, agents MUST ensure 100% full compatibility for BOTH Light and Dark themes.
- Test and verify that background contrast, text visibility, card borders, icons, and status badges remain crisp, legible, and visually balanced in both Light Mode (`.light`) and Dark Mode (`.dark`).
- Never introduce hardcoded light-only or dark-only surface colors or text styles that break readability or visual quality in either theme.

### 7. Modal Card Layering (Off-White Contrast Standard)
- Modals in Light Mode have a pure white (`bg-white` / `#ffffff`) background.
- Cards placed inside a modal (e.g. Challan details, line item cards, summary footers) MUST use the soft off-white surface style:
  `className="bg-[#f8f9fc] dark:bg-[#181b29] border border-border-gray rounded-[14px] p-5 shadow-subtle"`
- Interactive inputs (`Input`, `Select`, `textarea`) and nested summary strips inside these cards use pure white (`bg-white dark:bg-[#151824]`) to create clean visual hierarchy, depth, and contrast.

### 8. Readable Typography (Strictly Avoid Microscopic 7px Text)
- `text-micro` is defined as 7px in `globals.css` and is an accessibility failure if used for human-readable content.
- Adhere strictly to this hierarchy for readable content:
  * Section/Card headers: `text-body font-semibold text-ink` (16px) or `text-caption font-semibold text-ink` (14px).
  * Form field labels: `text-caption font-medium text-ink` (14px).
  * Subtitles, descriptions, helper text: `text-small text-cool-gray` (12px) in sentence case.
  * Stat values and totals: `text-feature-title` or `text-heading-xl` (22px - 28px).
- Always format batch dropdown options cleanly with `formatBatchOption` (`SS 304 [BAT-473141 • Heat: N/A] — 5 NOS Available`) rather than dumping raw 36-character database UUIDs.

### 9. Corporate Print Stationery System Exception (`OfficialStationery`)
- **Print-Safe Stationery Tokens**: All 6 official printable documents (`AuthenticPoDocument.tsx`, `AuthenticSubcontractPoDocument.tsx`, `AuthenticPrnDocument.tsx`, `AuthenticMaterialIssueDocument.tsx`, QC Certificate in `projects/[id]/quality/page.tsx`, Outward DC in `projects/[id]/dispatch/page.tsx`) MUST wrap content in `OfficialSheetShell` (`src/components/print/OfficialStationery.tsx`) and use the fixed light-paper corporate stationery palette (`#163354` Navy, `#E5EDF6` Ice-Blue fill, `#111827` primary text, `#475569` secondary text, `#CBD5E1` border, `#F8FAFC` card fill, `#C41E2E` company header, `#B91C1C` divider) rather than app dark-mode tokens.
- **Print Layout & Table Alignment Rules**:
  * Never put `overflow-*` classes on `.pro-print-sheet` or `.pro-table-grow` (`globals.css` `@media print` forces `div[class*="overflow-"]` to `display: block !important;`, breaking flex footer anchoring).
  * Pass `itemCount` to `OfficialSheetShell` (`itemCount > 14` enables `.pro-print-multipage` so `thead` repeats cleanly across A4 pages without clipping).
  * Keep vertical column extenders inside `.pro-table-filler` as a nested single-row `<table className="self-stretch w-full flex-1 table-fixed border-collapse">` matching the exact `%` widths (`sum = 100%`) of the main table above—never bare flex `<div>` columns, which drift from `table-fixed border-collapse` dividers.
  * Never place `space-y-*` on containers holding `position: absolute` corner SVGs (`Tailwind v4` applies `margin-block-end` to `:not(:last-child)`, shifting bottom-anchored SVGs upward).

