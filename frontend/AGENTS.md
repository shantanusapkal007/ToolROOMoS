<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design System Color Rules

- Agents must EXCLUSIVELY use the semantic colors defined in the project's design system (`globals.css` or equivalent theme file).
- Inline colors (e.g. arbitrary Tailwind palette classes like `emerald-800` or raw hex codes) are strictly forbidden.
- If a new color is needed that is not present in the design system, the agent MUST take permission from the user first and add it to the design system before using it.
