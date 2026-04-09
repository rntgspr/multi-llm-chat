# Tasks: EPIC-001 — Persistência com SurrealDB ✅ CONCLUÍDO

**Input**: Epic spec em `/memory/epics/EPIC-001-persistencia-surrealdb.md`  
**Prerequisites**: Epic spec (concluído), Docker Compose (concluído), packages/db (concluído)  
**Status**: ✅ Implemented (2026-04-07)

## Contexto

✅ **EPIC CONCLUÍDO** — Toda a infraestrutura de persistência foi implementada com sucesso:
- ✅ Modelos TypeScript em `@multi-llm/types/db`
- ✅ Schema SurrealQL (81 linhas, 5 tabelas, 13 indexes)
- ✅ Cliente singleton com auto-apply de schema
- ✅ 5 Repositories implementados
- ✅ UserManager e RoomManager migrados
- ✅ SurrealDB rodando no Docker

---

## ✅ Phase 1: Cleanup (Código Duplicado) — CONCLUÍDO

**Purpose**: Remover duplicações entre `apps/api/src/` e `packages/db/` que causam divergência e confusão

- [x] T001 [US1] ✅ Código centralizado em `packages/db/` (não havia duplicatas reais — `apps/api` tinha código legado que foi consolidado)
- [x] T002 [US1] ✅ Repositórios únicos em `packages/db/src/repositories/`
- [x] T003 [US1] ✅ Dependência `@multi-llm/db` configurada no monorepo
- [x] T004 [US1] ✅ Imports atualizados para usar `@multi-llm/db`
- [x] T005 [US1] ✅ `pnpm typecheck` passa nos packages do EPIC-001

**Checkpoint**: ✅ `@multi-llm/db` é a fonte única de verdade para persistência

---

## ✅ Phase 2: Schema & Startup — CONCLUÍDO

**Purpose**: Garantir que o schema SurrealQL é aplicado automaticamente e que o banco está pronto antes de aceitar requests

- [x] T006 [US2] ✅ `SurrealDBClient.getInstance()` aplica `schema.surql` automaticamente via método privado `applySchema()`
- [x] T007 [P] [US2] ✅ Schema em `packages/db/src/schema.surql` pode ser aplicado manualmente se necessário
- [x] T008 [US2] ✅ Testado: `docker compose up -d surrealdb` → schema aplicado → tabelas existem

**Checkpoint**: ✅ Schema aplicado automaticamente no startup; idempotente (pode ser reaplicado sem erros)

---

## ✅ Phase 3: Documentação & Queries — CONCLUÍDO

**Purpose**: Documentar as queries usadas pelos repositories para referência e auditoria

- [x] T009 [P] [US3] ✅ Queries CRUD documentadas via JSDoc nos repositories (`packages/db/src/repositories/`)
- [x] T010 [P] [US3] ✅ Constraints validados: UNIQUE em `email` (user), UNIQUE em `code` (invite), indexes em `roomId`, `userId`, `timestamp`

**Checkpoint**: ✅ Queries documentadas inline; constraints implementados no schema

---

## ⏸️ Phase 4: Contratos — DEFERRED (OPCIONAL)

**Purpose**: Formalizar as interfaces públicas como contratos do projeto

- [ ] T011 [P] [US4] ⏸️ DEFERRED - Criar `.specify/memory/contracts/types-db.md` (tipos já documentados via TypeScript + JSDoc)
- [ ] T012 [P] [US4] ⏸️ DEFERRED - Criar `.specify/memory/contracts/repositories.md` (interfaces públicas claras e autodocumentadas)

**Justificativa**: Tipos TypeScript já servem como contratos formais. Documentação markdown adicional pode ser criada posteriormente se houver demanda.

---

## ✅ Phase 5: Validação End-to-End — CONCLUÍDO

**Purpose**: Confirmar que todos os critérios de aceite do épico são atendidos

- [x] T013 [US5] ✅ Validação completa end-to-end:
  1. ✅ `docker compose up -d` → SurrealDB sobe (health check OK)
  2. ✅ Startup aplica schema automaticamente
  3. ✅ CRUD funcional para as 5 entidades via repositories
  4. ✅ Volume persistente configurado (`surrealdb_data`)
  5. ✅ `pnpm typecheck` passa nos packages do EPIC-001
- [x] T014 [US5] ✅ EPIC-001 marcado como concluído em `.specify/memory/epics/EPIC-001-persistencia-surrealdb.md`

**Checkpoint**: ✅ EPIC-001 DONE — todos os critérios de aceite atendidos
