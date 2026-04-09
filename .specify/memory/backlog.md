# Backlog Consolidado (pré-Spec-Kit)

> Backlog legado consolidado dos TODOs e tickets criados antes da adoção do Spec-Kit.
> Features novas devem ser criadas via `/speckit.specify`.
> Itens aqui podem ser transformados em features spec-kit conforme forem priorizados.

---

## Fase 1: SurrealDB Integration (Alta Prioridade)

### Infra
- [ ] INFRA-001 — Adicionar SurrealDB ao Docker Compose (~1-2h)
- [ ] INFRA-004 — Atualizar .env.example (~30min)

### Database
- [ ] DB-001 — Definir modelos TypeScript (User, Room, Message, Assistant, Invite) (~2-3h)
- [ ] DB-002 — Criar schema SurrealQL (DEFINE TABLE/FIELD/INDEX) (~3-4h)

### Backend
- [ ] BACKEND-002 — Cliente SurrealDB singleton (~2-3h)
- [ ] BACKEND-004 — Implementar repositories (User, Room, Message, Assistant, Invite) (~4-6h)
- [ ] BACKEND-005 — Migrar dados in-memory para SurrealDB (~2-3h)

**Ordem sugerida:** INFRA-001 → INFRA-004 → DB-001 → DB-002 → BACKEND-002 → BACKEND-004 → BACKEND-005

---

## Fase 2: API Separation (Média Prioridade)

### Backend
- [ ] Reestruturar apps/api (routes, websocket, middlewares, services)
- [ ] Mover servidor Socket.io de apps/web para apps/api
- [ ] Migrar rotas REST (assistants, rooms, invites, messages)
- [ ] Implementar autenticação compartilhada entre apps
- [ ] Configurar CORS e variáveis de ambiente

### Frontend
- [ ] Remover server.ts custom (voltar ao Next.js default)
- [ ] Atualizar use-websocket.ts para conectar em apps/api
- [ ] Atualizar clients de API (orchestrator, assistant, room)
- [ ] Remover rotas /api/* do Next.js (agora só UI)
- [ ] Configurar NEXT_PUBLIC_API_URL e NEXT_PUBLIC_WS_URL

**Dependência:** Frontend depende da conclusão da Fase 2 Backend.

---

## Fase 3: Workers & Background Jobs (Baixa Prioridade)

- [ ] Adicionar Redis ao docker-compose
- [ ] Configurar BullMQ em apps/workers
- [ ] Implementar job queue para processamento LLM assíncrono

---

## Database: Otimização e Manutenção (Baixa Prioridade)

- [ ] Indexes para queries frequentes (roomId, userId, timestamp)
- [ ] Paginação eficiente para mensagens
- [ ] Backup automático
- [ ] Scripts de seed para dev environment
- [ ] Migrations/versionamento de schema

---

## Frontend: Melhorias UI (Baixa Prioridade)

- [ ] Loading states durante migração
- [ ] Error boundaries para falhas de conexão
- [ ] Feedback visual de persistência de dados

---

**Consolidado em:** 2026-04-07
**Origem:** .github/tasks/backend/TODO.md, .github/tasks/frontend/TODO.md, .github/tasks/database/TODO.md, .github/tasks/infra/TODO.md, .github/tasks/tickets/*
