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
