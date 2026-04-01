---
description: "Use when writing or reviewing TypeScript, React, or Next.js code. Enforces coding style, naming conventions, and SOLID/DRY principles."
applyTo: "**/*.{ts,tsx}"
---
# Coding Style & Conventions

## General Principles

- **DRY (Don't Repeat Yourself)**: Extract shared logic into reusable functions, hooks, or utilities. If the same pattern appears more than twice, abstract it.
- **Composition over inheritance**: Build behavior by composing smaller, focused units — never use class inheritance hierarchies.
- **SOLID principles**:
  - **S** — Single Responsibility: Each module, component, or function does one thing.
  - **O** — Open/Closed: Extend behavior through composition and props, not by modifying existing code.
  - **L** — Liskov Substitution: Subtypes must be substitutable for their base types.
  - **I** — Interface Segregation: Prefer small, focused interfaces over large ones.
  - **D** — Dependency Inversion: Depend on abstractions (interfaces/types), not concretions.

## TypeScript

- Use strict TypeScript — avoid `any` and `unknown` where possible.
- Prefer `interface` for object shapes, `type` for unions and intersections.
- Use `const` by default; `let` only when mutation is necessary; never `var`.
- Prefer named exports over default exports.

## React & Next.js

- Use functional components exclusively — no class components.
- Extract reusable logic into custom hooks (`use` prefix).
- Prefer controlled components over uncontrolled.
- Colocate component-specific types in the same file.
- Use Next.js App Router conventions (server components by default, `'use client'` only when needed).

## Naming

- **Files**: `kebab-case` for files and folders (e.g., `chat-message.tsx`).
- **Components**: `PascalCase` (e.g., `ChatMessage`).
- **Functions/variables**: `camelCase`.
- **Types/Interfaces**: `PascalCase`, no `I` prefix.
- **Constants**: `UPPER_SNAKE_CASE` for true constants, `camelCase` for derived values.
- **Booleans**: Prefix with `is`, `has`, `should`, `can` (e.g., `isLoading`, `hasError`).
