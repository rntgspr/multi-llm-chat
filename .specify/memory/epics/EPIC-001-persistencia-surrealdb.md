# Persistência com SurrealDB — Epic Spec

**Status:** [DONE] ✅  
**Sprint:** 1  
**Prioridade:** Alta  
**Data de criação:** 2026-04-07  
**Última atualização:** 2026-04-07  
**Data de conclusão:** 2026-04-07

---

## 📋 Contexto

Atualmente toda a informação do sistema (salas, mensagens, usuários, assistentes) é armazenada em `Map` e arrays in-memory nos managers de `apps/web/src/services/`. Isso significa que:

- Dados são perdidos a cada restart do servidor
- Impossível escalar horizontalmente
- Sem histórico persistente de conversas
- Sem possibilidade de analytics ou auditoria

Este épico introduz **SurrealDB** como camada de persistência, substituindo completamente o armazenamento in-memory sem alterar as interfaces públicas dos managers.

---

## 🎯 Objetivo

Ao final deste épico, o sistema deve ler e gravar todos os dados (Users, Rooms, Messages, Assistants, Invites) no SurrealDB via repositories type-safe. O armazenamento in-memory nos managers deve ser completamente removido.

---

## 📐 Escopo

### Inclui
- SurrealDB no Docker Compose com volume persistente e health check
- Schema SurrealQL (tabelas, campos, indexes, constraints)
- Modelos TypeScript em `@multi-llm/types` alinhados ao schema
- Cliente SurrealDB singleton em `apps/api`
- Repositories (User, Room, Message, Assistant, Invite) com CRUD
- Migração dos managers: `Map`/arrays → repositories
- Variáveis de ambiente documentadas (`.env.example`)

### Não inclui
- Migração de dados existentes (não há dados persistidos para migrar)
- Admin UI para gerenciar dados no banco
- Backup automático e monitoring (épico futuro)
- Separação de API/WebSocket para `apps/api` (EPIC-002)

---

## 🏗️ Decisões Técnicas

| Decisão | Justificativa |
|---------|---------------|
| SurrealDB v2.x | Multi-model (document + graph + relational), queries nativas type-safe, sem necessidade de ORM |
| Queries SurrealQL nativas (sem ORM) | Aproveitar poder da linguagem de query do SurrealDB; menos abstração, mais controle |
| Singleton pattern para cliente | Evitar múltiplas conexões; reutilizar instância em toda a aplicação |
| Repository pattern | Abstrair queries do banco; facilitar testes e eventual troca de storage |
| Namespace `multi_llm_chat`, Database `chat` | Organização lógica dos dados |
| Docker Compose separado: infra vs LLMs | `docker-compose.yml` (SurrealDB + Redis) e `docker-compose.llm.yml` (Ollama). Lifecycles independentes — LLMs são pesadas e opcionais |
| SurrealDB `file:/data` (não `memory`) | Modo `memory` perde dados no restart — contradiz o objetivo de persistência |
| Redis 7 Alpine | Cache e pub/sub para WebSocket; imagem leve |
| Rede `multi-llm-network` compartilhada | Rede nomeada + `external: true` no compose de LLMs permite comunicação cross-compose |

---

## 🔗 Tasks Vinculadas

### Infra
- [x] `INFRA-001` — Adicionar SurrealDB ao Docker Compose (persistência `file:/data`, health check)
- [x] `INFRA-002` — Configurar volumes persistentes (surrealdb_data, redis_data)
- [x] `INFRA-003` — Adicionar health checks para todos os serviços (SurrealDB + Redis)
- [x] `INFRA-004` — Separar Docker Compose: `docker-compose.yml` (infra) + `docker-compose.llm.yml` (LLMs)
- [x] `INFRA-005` — Atualizar `.env.example` com variáveis SurrealDB e Redis

### Database
- [x] `DB-001` — Definir modelos TypeScript (User, Room, Message, Assistant, Invite) em `packages/types/src/db/` ✅
- [x] `DB-002` — Criar schema SurrealQL (DEFINE TABLE/FIELD/INDEX) em `packages/db/src/schema.surql` ✅
- [x] `DB-003` — Documentar queries comuns (CRUD) ✅ (implementado nos repositories)
- [x] `DB-004` — Validar constraints e relationships ✅ (indexes UNIQUE, constraints no schema)
- [x] `DB-005` — Garantir aplicação do schema no startup da API (integrar com cliente singleton) ✅

### Backend
- [x] `BACKEND-001` — Criar cliente SurrealDB singleton em `packages/db/src/lib/db.ts`
- [x] `BACKEND-002` — Implementar repositories (User, Room, Message, Assistant, Invite) em `packages/db/`
- [x] `BACKEND-003` — Migrar managers (`room-manager`, `user-manager`) para usar repositories

### Cleanup
- [x] `CLEANUP-001` — Remover código duplicado de `apps/api/src/repositories/` e `apps/api/src/lib/db*` ✅ (centralizado em `@multi-llm/db`)
- [x] `CLEANUP-002` — Adicionar `@multi-llm/db: workspace:*` como dependência e atualizar imports ✅

### Contratos
- [ ] `CONTRACT-001` — Criar contrato `types-db.md` em `.specify/memory/contracts/` (opcional - tipos já documentados via JSDoc)
- [ ] `CONTRACT-002` — Criar contrato `repositories.md` em `.specify/memory/contracts/` (opcional - interfaces públicas claras)

### Validação
- [x] `VALIDATION-001` — Teste end-to-end: subir SurrealDB → aplicar schema → CRUD via repositories → validar persistência ✅

**Ordem sugerida:** CLEANUP-001 → CLEANUP-002 → DB-005 → DB-003 → DB-004 → VALIDATION-001 → CONTRACT-001/002

---

## 🤝 Contratos

- **Package contract (novo):** `.specify/memory/contracts/types-db.md` — Interfaces dos modelos de DB
- **Package contract (novo):** `.specify/memory/contracts/repositories.md` — Interface pública dos repositories

---

## 📦 Dependências

### Depende de
- Docker Compose funcional (já existente)
- `@multi-llm/types` existente (será estendido)

### Bloqueia
- **EPIC-002** (Separação da API) — precisa de persistência antes de mover rotas
- **EPIC-004** (Multi-LLM Integration) — configuração de assistentes via DB
- Features de histórico, analytics e auditoria

---

## ✅ Critérios de Aceite (Nível Épico)

- [x] `docker compose up -d surrealdb` sobe e responde em `ws://localhost:8000/rpc` ✅
- [x] Schema SurrealQL aplicado sem erros (5 tabelas: user, room, message, assistant, invite) ✅
- [x] Todos os modelos TypeScript em `@multi-llm/types/db` alinhados ao schema ✅
- [x] Cliente SurrealDB conecta, autentica e opera sem erros ✅
- [x] Repositories implementados com CRUD completo para as 5 entidades ✅
- [x] Managers migrados para usar repositories (UserManager ✅, RoomManager ✅) ✅
- [x] Dados persistem entre restarts do servidor ✅
- [x] `pnpm typecheck` passa sem erros nos packages do EPIC-001 ✅
- [x] `.env.example` documenta todas as variáveis SurrealDB ✅

---

## 🚨 Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| SurrealDB v2 ainda jovem — possíveis breaking changes | Médio | Fixar versão exata no Docker; manter queries simples |
| Latência de queries vs in-memory | Baixo | Volumes de dados pequenos no início; otimizar com indexes depois |
| Migração dos managers pode quebrar fluxos existentes | Alto | Manter interfaces públicas idênticas; alterar apenas implementação interna |

---

## 📝 Notas

- Porta do SurrealDB: `8000`
- Credenciais dev: `root/root` (apenas para desenvolvimento local)
- Referência técnica: `.github/tasks/tickets/` contém implementação detalhada de cada task
- O plano original de implementação está em `.github/memory/plano-implementacao.md`
