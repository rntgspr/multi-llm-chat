# Separação da API — Epic Spec

**Status:** [DRAFT]  
**Sprint:** 2  
**Prioridade:** Média  
**Data de criação:** 2026-04-07  
**Última atualização:** 2026-04-07

---

## 📋 Contexto

Atualmente, toda a lógica de backend (rotas REST, WebSocket, autenticação) está acoplada dentro de `apps/web` (Next.js). O `apps/api` (Hono) existe mas está vazio. Este épico move a camada de API e WebSocket para `apps/api`, transformando `apps/web` em um frontend puro.

---

## 🎯 Objetivo

`apps/web` serve apenas UI e SSR. Toda comunicação de dados e real-time passa por `apps/api`. Autenticação é compartilhada entre os dois apps.

---

## 📐 Escopo

### Inclui
- Reestruturar `apps/api` (routes, websocket, middlewares, services)
- Mover Socket.io de `apps/web` para `apps/api`
- Migrar rotas REST (assistants, rooms, invites, messages)
- Autenticação compartilhada entre apps
- CORS e variáveis de ambiente
- Atualizar clientes no frontend

### Não inclui
- Mudanças nos packages (interaction, interpretation, maintenance)
- Novas features de UI
- Workers e background jobs (EPIC-003)

---

## 🔗 Tasks Vinculadas

### Backend
- [ ] `BACKEND-006` — Reestruturar apps/api
- [ ] `BACKEND-007` — Mover Socket.io para apps/api
- [ ] `BACKEND-008` — Migrar rotas REST
- [ ] `BACKEND-009` — Auth compartilhado
- [ ] `BACKEND-010` — CORS e env vars

### Frontend
- [ ] `FRONTEND-001` — Remover server.ts custom
- [ ] `FRONTEND-002` — Atualizar use-websocket.ts
- [ ] `FRONTEND-003` — Atualizar API clients
- [ ] `FRONTEND-004` — Remover rotas /api/* do Next.js
- [ ] `FRONTEND-005` — Configurar env vars

---

## 📦 Dependências

### Depende de
- **EPIC-001** (Persistência SurrealDB) — repositories prontos ✅
- **EPIC-003** (Redis Session Store e Pub/Sub) — necessário para sessões compartilhadas e comunicação entre apps/web e apps/api

### Bloqueia
- **EPIC-006** (Streaming Token-por-Token) — precisa de WebSocket separado
- Features de real-time chat

---

## ✅ Critérios de Aceite (Nível Épico)

- [ ] `apps/web` não contém rotas REST nem servidor WebSocket
- [ ] `apps/api` serve todas as rotas REST e WebSocket
- [ ] Autenticação funciona em ambos os apps
- [ ] Frontend conecta via `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_WS_URL`
- [ ] `pnpm typecheck` passa sem erros

---

## 📝 Notas

- Tasks frontend dependem da conclusão das tasks backend
- Spec será detalhada quando Sprint 2 for o foco ativo
