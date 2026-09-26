---
name: antigravity
description: Full-stack software engineering playbook covering the entire delivery lifecycle — brainstorming, planning & project management, UI/UX design, architecture & system design, code quality (clean code, SOLID, design patterns, refactoring, documentation), version control, testing (unit, integration, API, E2E, UI, regression), debugging, security, performance (frontend, backend, database, caching, load handling), accessibility, CI/CD & deployment, observability, and code review. Use this skill any time the user is building, reviewing, fixing, planning, testing, securing, or optimizing software — even if they only mention one narrow piece (e.g. "write a unit test," "why is this slow," "review my code," "plan this feature," "is this secure") — because these disciplines overlap constantly and this skill keeps them consistent. Trigger proactively whenever a request touches app/web development, bug fixes, code reviews, architecture decisions, sprint/task planning, or "make this better/faster/safer" requests.
---

# Antigravity — Full-Stack Engineering Playbook

A single entry point for the whole software lifecycle: think → design → build → test → secure → ship → operate. This file is a router — read it, figure out which reference file(s) apply, then open just those before acting. Don't load every reference for every request.

## How to use this skill

1. Identify which phase(s) of the lifecycle the request touches (see map below).
2. Open the matching `references/*.md` file(s) — each is self-contained and short.
3. Apply judgment: scale rigor to task size. A one-line fix doesn't need a full test matrix; a payment system does.
4. Be proactive: if someone asks for a feature, silently also consider tests, security, and performance for it, and mention real trade-offs rather than staying quiet about risk.
5. When a task spans domains (e.g., "build a login form" = UI/UX + security + testing), pull from all relevant references, not just one.

## Reference map

| Phase / topic | File |
|---|---|
| Brainstorming & ideation techniques | `references/brainstorming.md` |
| Planning, estimation, prioritization, agile ceremonies | `references/planning-pm.md` |
| UI/UX design principles | `references/ui-ux.md` |
| Architecture & system design, ADRs, API/data design | `references/architecture.md` |
| Clean code, SOLID, design patterns, refactoring, documentation | `references/code-quality.md` |
| Git workflow, commits, PRs, secrets hygiene | `references/version-control.md` |
| Unit, integration, API, E2E, UI, regression testing | `references/testing.md` |
| Debugging methodology | `references/debugging.md` |
| Security (OWASP-style checklist, authN/Z, injection, secrets) | `references/security.md` |
| Performance: frontend, backend, database, caching, load | `references/performance.md` |
| Accessibility (WCAG-level basics) | `references/accessibility.md` |
| CI/CD, deployment strategies, migrations | `references/cicd-deployment.md` |
| Observability, logging/metrics/tracing, incident response | `references/observability.md` |
| Code review checklist | `references/code-review.md` |

## Applying this skill

Don't mechanically dump every reference into every answer. Read the request, identify the 1–4 files that actually apply, and go deep there — pulling in adjacent files (e.g., security + testing for an auth feature) only when genuinely relevant. Match effort to scope.
