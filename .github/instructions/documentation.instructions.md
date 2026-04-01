---
description: "Use when writing or reviewing JSDoc comments, README files, or inline documentation for TypeScript/React code."
applyTo: "**/*.{ts,tsx}"
---
# Padrões de Documentação

## Documentação Inline

- Adicione comentários JSDoc a funções, tipos e componentes **exportados**.
- Não documente código óbvio e autodescritivo — prefira nomes claros a comentários.
- Use as tags `@param`, `@returns` e `@example` em funções não triviais.

```typescript
/**
 * Merges chat messages from multiple LLM providers into a unified timeline.
 *
 * @param messages - Array of provider-specific message objects
 * @returns Sorted array of normalized messages
 */
export function mergeMessages(messages: ProviderMessage[]): ChatMessage[] {
```

## Documentação de Componentes

- Documente o propósito do componente e as props principais via JSDoc no topo do arquivo.
- Use os tipos TypeScript das props como documentação primária — mantenha nomes de props descritivos.

## Comentários

- Explique o **porquê**, não o **o quê** — o código já mostra o que faz.
- Use `// TODO:` para melhorias planejadas e `// HACK:` para gambiarras temporárias.
- Remova código comentado — dependa do histórico do git.
