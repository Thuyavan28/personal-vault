# Accessibility

- Semantic HTML first (`<button>`, `<nav>`, headings in order) — it gives you most accessibility for free.
- All interactive elements reachable and operable by keyboard alone; visible focus states.
- Sufficient color contrast (WCAG AA minimum: 4.5:1 for normal text); never convey information by color alone.
- `alt` text for meaningful images; empty `alt=""` for purely decorative ones.
- ARIA roles/labels only where semantic HTML can't express the pattern — don't overuse ARIA.
- Test with a screen reader and keyboard-only navigation, not just visually.
