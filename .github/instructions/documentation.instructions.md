---
description: "Use when writing or reviewing JSDoc comments, README files, or inline documentation for TypeScript/React code."
applyTo: "**/*.{ts,tsx}"
---
# Documentation Standards

## Inline Documentation

- Add JSDoc comments to **exported** functions, types, and components.
- Skip documentation for obvious, self-documenting code — prefer clear naming over comments.
- Use `@param`, `@returns`, and `@example` tags for non-trivial functions.

```typescript
/**
 * Merges chat messages from multiple LLM providers into a unified timeline.
 *
 * @param messages - Array of provider-specific message objects
 * @returns Sorted array of normalized messages
 */
export function mergeMessages(messages: ProviderMessage[]): ChatMessage[] {
```

## Component Documentation

- Document component purpose and key props at the top via JSDoc.
- Use TypeScript prop types as the primary documentation — keep prop names descriptive.

## Comments

- Explain **why**, not **what** — the code shows what it does.
- Use `// TODO:` for planned improvements and `// HACK:` for temporary workarounds.
- Remove commented-out code — rely on git history instead.
