# Experience Architecture (The Foundation)
**ToolRoomOS v2.0**

This document establishes the complete experience architecture that every feature in ToolRoomOS must follow. Nothing is implemented until these standards are adhered to. Every future component must inherit these standards to prevent design inconsistency over time.

## 1. Design Language
- **Philosophy:** Apple Liquid Glass (MANDATORY). Glass must behave like a physical material with multi-layer translucency, dynamic backdrop blur, soft edge diffusion, internal light scattering, and subtle environmental reflections.
- **Form Factor:** Nothing feels trapped inside rectangles. The application is a physical workspace.
- **Hierarchy:** Communicated using Layer, Elevation, Blur, Lighting, Scale, Motion, and Spacing instead of colored boxes.

## 2. Interaction Language
- **Premium Interaction Rules:** Every interactive element must respond (Hover, Mouse movement, Focus, Selection, Drag, Click, Keyboard, Touch). Buttons slightly follow the cursor. Cards subtly tilt. Panels softly illuminate. Everything feels alive.
- **Ambient Intelligence:** Cursor-aware interactions, subtle parallax, dynamic gradients, mouse interpolation, and focus lighting. Never distracting.

## 3. Motion Language
- **Physics:** Animation curves emulate Apple's Human Interface Guidelines. Never animate linearly. Use spring animations, physics-based movement, momentum, elastic overscroll, and soft deceleration.
- **Timing:** 
  - Hover: 120ms
  - Click: 90ms
  - Expand: 220ms
  - Dialog: 280ms
  - Drawer: 320ms
  - Page: 450ms
  - Shared Element: 500ms
  - Success: 700ms
  - Loading: Infinite (Pulse/Spin)

## 4. Accessibility Language
- **WCAG AA Compliance:** Minimum standard for all text contrast and interactive elements.
- **Keyboard Navigation:** 100% of the application must be navigable without a mouse. Focus states must use the Focus Shadow token.
- **One-Hand Mouse Workflow:** Actions should be reachable and grouped intuitively to minimize mouse travel distance.

## 5. Layout Language
- **Layout Philosophy:** No screen should feel crowded. Break the grid intentionally while maintaining alignment.
- **Visual Rhythm:** Use asymmetrical layouts, mix large and small components. Create visual breathing room through aggressive use of whitespace.
- **Visual Rules:** No two adjacent panels should have identical elevation. Every page must have a primary focal point and a secondary focal point.

## 6. Component Language
- **Component Quality Standard:** Every component (Buttons, Inputs, Dropdowns, Tables, Dialogs, etc.) is designed as a reusable primitive.
- **States Required:** Every component must have Hover, Focus, Active, Disabled, Loading, Success, Error, Skeleton, and Dark mode variants.
- **No Placeholders:** No placeholder styling. No generic components. Every component feels custom designed.

## 7. Animation Language
- **Intention:** Every animation should have intention and explain relationships. Never animate to decorate.
- **Context:** Slide + blur for Sidebars. Scale + opacity for Dialogs. Spring fades for Page transitions. Count-up for Numbers. Morph for Timelines. Lift + light for Card hovers.

## 8. Color Language
- **Tokens:** Stop using generic Tailwind colors. Use Semantic tokens mapped to workflow (Engineering, Purchase, Inventory, Production, Quality, Dispatch, Finance).
- **Nuance:** Use interactive color tokens (Primary, Secondary, Hover, Pressed, Disabled, Focus). Glass surfaces use layers of transparency over Background, Canvas, and Panel roots rather than solid hexes.

## 9. Icon Language
- **Library:** Lucide React.
- **Usage:** Icons must morph smoothly between states. Icons should never be purely decorative—they serve as visual anchors for data and actions.

## 10. Data Visualization Language
- **Library:** VisX.
- **Philosophy:** Do not just show numbers. Show the flow (e.g., Cost Waterfall). Visualize Lead Time, Variance, Machine Utilization. Data must be interactive, animated, and beautiful.

## 11. Empty State Language
- **Smart Empty States:** Never show a blank screen. Empty states should explain exactly why the state is empty and provide the primary action to resolve it.

## 12. Error Language
- **Graceful Degradation:** Use contextual error boundaries. An error in a timeline must not crash the workspace.
- **Actionable Errors:** Error states must offer a path forward (Retry, Dismiss, Reconfigure). 

## 13. Loading Language
- **Loading Choreography:** Never use blocking global spinners. Use staggered reveals and contextual Skeleton states that match the final content's structure. Components animate smoothly from skeleton to populated state (Shared element transitions).
