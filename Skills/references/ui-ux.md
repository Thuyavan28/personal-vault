# UI/UX Design

- **Design for the user's mental model**, not the database schema. Match language and grouping to how users think about the task.
- **Consistency**: reuse existing patterns (buttons, spacing, color, terminology) in the codebase/design system before inventing new ones.
- **Visual hierarchy**: size, weight, color, and whitespace should guide the eye to the most important action first (primary vs. secondary vs. tertiary buttons).
- **Feedback for every action**: loading states, success confirmations, error messages that say what went wrong and how to fix it (never a bare "Error").
- **Forms**: label every field, validate inline (not just on submit), preserve user input on error, mark required fields clearly, sensible default focus.
- **Empty states, error states, and loading states are part of the design** — don't design only the "happy path with data" screen.
- **Responsive & cross-device**: design mobile-first or at minimum test at common breakpoints (mobile, tablet, desktop); touch targets ≥44px.
- **Reduce cognitive load**: progressive disclosure (show advanced options only when needed), sensible defaults, avoid asking for information you can infer.
- **Accessibility is UX, not an afterthought** — see `accessibility.md`.
- Refer to the `frontend-design` skill (if available) for concrete implementation guidance (typography, color systems, layout) when actually building UI, not just discussing it.
