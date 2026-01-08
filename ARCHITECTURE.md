# Architecture

This document explains how the Task Magic codebase is organized and the key conventions to follow.

**What this covers:** Directory structure, client/server boundaries, type conventions.  
**What this doesn't cover:** Deployment, database schema details, feature roadmap.

---

## High-Level Structure

```
src/
├── app/          # Next.js App Router (routing, layouts, API routes)
├── components/   # React UI components
└── lib/          # Non-UI application logic
```

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Pages, layouts, and `/api` routes. No shared logic here. |
| `src/components/` | Reusable UI components (modals, forms, list items). |
| `src/lib/` | Business logic, types, hooks—split by client/server safety. |

---

## src/lib Mental Model

The `lib/` folder is split into three subdirectories based on **where the code can run**:

### src/lib/shared/

**Client-safe code.** Types, constants, and validation helpers that have no server dependencies.

- ✅ Can be imported anywhere (client components, server code, API routes)
- ❌ Must NOT import `mongodb`, `ObjectId`, or any Node-only APIs

Examples: `TodoClient`, `BoardMember`, `TaskVisibility`, `DEFAULT_BOARD_ID`

### src/lib/server/

**Server-only code.** Anything that touches MongoDB or uses Node APIs.

- ✅ Imported only in API routes and server components
- ❌ Must NOT be imported in client components or hooks

Examples: `Todo` (with `ObjectId`), `todoToClient()`, database connection

### src/lib/hooks/

**React hooks.** Client-side state management with `"use client"` directive.

- ✅ Must include `"use client"` at the top
- ✅ Can import from `src/lib/shared/`
- ❌ Must NOT import from `src/lib/server/`

Examples: `useActor()`

---

## Client vs Server Boundaries

This is the most important rule in the codebase:

> **Client Components must never import from `src/lib/server/`.**

### Do ✅

- Import `TodoClient` from `src/lib/shared/types/todo` in a client component
- Import `todoToClient()` from `src/lib/server/todos` in an API route
- Use `useActor()` hook in a `"use client"` component

### Don't ❌

- Import `Todo` (the Db type with `ObjectId`) in a client component
- Import `mongodb` anywhere outside `src/lib/server/`
- Create a hook that imports from `src/lib/server/`

---

## Types & Data Flow

We use a **Db → Client** mapping pattern to keep MongoDB types off the client.

### The Pattern

1. **Db types** live in `src/lib/server/` (e.g., `Todo` with `ObjectId` and `Date`)
2. **Client types** live in `src/lib/shared/` (e.g., `TodoClient` with `string` id and ISO strings)
3. **Mapping functions** convert Db → Client in API routes (e.g., `todoToClient()`)

### Example

```typescript
// src/lib/server/todos.ts (server-only)
interface Todo {
  _id: ObjectId;
  createdAt: Date;
  // ...
}

function todoToClient(todo: Todo): TodoClient {
  return {
    _id: todo._id.toHexString(),
    createdAt: todo.createdAt.toISOString(),
    // ...
  };
}
```

```typescript
// src/lib/shared/types/todo.ts (client-safe)
interface TodoClient {
  _id: string;
  createdAt: string;
  // ...
}
```

API routes call `todoToClient()` before sending responses. Client components only ever see `TodoClient`.

---

## Refactor Philosophy

When making changes:

1. **UI-first, logic second** — Extract/refactor components before touching business logic.
2. **No behavior changes during refactors** — If you're moving code, don't also change what it does.
3. **Minimal, incremental changes** — Small PRs are easier to review and less risky.
4. **Follow existing patterns** — Don't invent new conventions without explicit discussion.

---

## What We Intentionally Avoid

These are conscious scope limits, not TODOs:

- **Authentication** — Actors are device-local, not user accounts.
- **Multi-board UI** — One board ("Home") for now.
- **Offline-first / sync** — Simple fetch-on-load, no local persistence of tasks.
- **Over-engineering** — No state machines, no Redux, no complex abstractions.

If you're tempted to add one of these, pause and discuss first.
