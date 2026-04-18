---
description: "Use ao projetar componentes, organizar arquivos ou estruturar features em um projeto Next.js App Router. Cobre padrões de arquitetura e estrutura de projeto."
---
# Padrões de Arquitetura

## Estrutura de Pastas

Organize por funcionalidade, não por tipo:

```
src/
  app/                  # Páginas e layouts do App Router do Next.js
  components/
    ui/                 # Componentes reutilizáveis e apresentacionais (botões, inputs)
    features/           # Componentes compostos específicos de cada feature
  hooks/                # Custom hooks compartilhados
  lib/                  # Utilitários, helpers, wrappers de serviços externos
  types/                # Definições de tipos compartilhados
  services/             # Clientes de API e camadas de acesso a dados
```

## Arquitetura de Componentes

- **Componentes apresentacionais** — recebem dados via props, renderizam UI, sem efeitos colaterais.
- **Componentes container** — compõem componentes apresentacionais, gerenciam estado e efeitos.
- **Server components** (padrão) — busque dados no servidor sempre que possível.
- **Client components** — use `'use client'` apenas para interatividade (event handlers, hooks, APIs do browser).

## Padrões de Composição

- Prefira **render props** ou **children-as-function** a HOCs.
- Use **custom hooks** para compartilhar lógica com estado entre componentes.
- Componha UIs complexas a partir de componentes pequenos e de responsabilidade única.
- Use o padrão **compound component** para grupos de componentes relacionados (ex.: `Tabs`, `Tabs.List`, `Tabs.Panel`).

## Fluxo de Dados

- Mantenha o estado o mais próximo possível de onde é usado.
- Eleve o estado apenas quando componentes irmãos precisarem compartilhá-lo.
- Use React Context com moderação — prefira props e composição primeiro.
- Para dados do servidor, use o data fetching do Next.js (Server Components, `fetch` com cache).

## Error Boundaries

- Envolva seções de feature com error boundaries para isolar falhas.
- Use a convenção `error.tsx` do Next.js para tratamento de erros por rota.
