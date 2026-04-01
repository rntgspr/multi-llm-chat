---
description: "Use when designing components, organizing files, or structuring features in a Next.js App Router project. Covers architecture patterns and project structure."
---
# Architecture Patterns

## Project Structure

Organize by feature, not by type:

```
src/
  app/                  # Next.js App Router pages and layouts
  components/
    ui/                 # Reusable, presentational components (buttons, inputs)
    features/           # Feature-specific composed components
  hooks/                # Shared custom hooks
  lib/                  # Utilities, helpers, external service wrappers
  types/                # Shared type definitions
  services/             # API clients, data access layers
```

## Component Architecture

- **Presentational components** — receive data via props, render UI, no side effects.
- **Container components** — compose presentational components, manage state and effects.
- **Server components** (default) — fetch data at the server level when possible.
- **Client components** — use `'use client'` only for interactivity (event handlers, hooks, browser APIs).

## Composition Patterns

- Prefer **render props** or **children-as-function** over HOCs.
- Use **custom hooks** to share stateful logic between components.
- Compose complex UIs from small, single-purpose components.
- Use the **compound component** pattern for related component groups (e.g., `Tabs`, `Tabs.List`, `Tabs.Panel`).

## Data Flow

- Keep state as close to where it's used as possible.
- Lift state up only when siblings need to share it.
- Use React Context sparingly — prefer props and composition first.
- For server data, use Next.js data fetching (Server Components, `fetch` with caching).

## Error Boundaries

- Wrap feature sections with error boundaries to contain failures.
- Use Next.js `error.tsx` convention for route-level error handling.
