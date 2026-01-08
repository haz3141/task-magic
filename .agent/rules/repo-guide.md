---
trigger: always_on
---

# Repo Guide (Next.js App Router)

These rules define mandatory constraints for working in this repository.
They are always applied.

---

## Tooling

- Use pnpm only.
- Do not use npm or yarn.
- Do not add alternative package managers.
- Do not introduce additional lockfiles.

---

## Git & Commits

- Always work on a feature branch.
- Never commit directly to main.
- Use atomic conventional commits.
- Keep commits small, scoped, and reviewable.
- Do not mix refactors and behavior changes in the same commit.

---

## Next.js Structure

- src/app/ is for routing, layouts, and API routes only.
- Do not place shared logic or UI components directly in src/app/.
- src/components/ contains UI components only.
- src/lib/ contains non-UI application logic only.
- public/ and .agent/ remain at the repo root.

---

## Client / Server Boundaries (Critical)

- Client Components must never import from src/lib/server.
- Any module that imports mongodb, ObjectId, Db, or server-only APIs must live in src/lib/server.
- Shared domain and API “wire” types must live in src/lib/shared.
- React hooks must live in src/lib/hooks and include `"use client"`.
- Do not import server-only modules into client components, hooks, or shared modules.

---

## Refactor Safety

- Do not change runtime behavior during refactors unless explicitly requested.
- Preserve existing API shapes and data contracts unless explicitly requested.
- Avoid speculative, proactive, or “while we’re here” refactors.
- Prefer minimal, incremental changes over large rewrites.

---

## Verification Requirements

- Run lint before finalizing changes.
- Run typecheck or build before finalizing changes.
- Run the development server and perform basic browser smoke testing for affected flows.
- Do not mark work complete without passing verification.

---

## General Discipline

- Follow existing patterns in the codebase.
- Do not introduce new architectural patterns without explicit direction.
- When unsure, prefer the simplest solution that preserves current behavior.
