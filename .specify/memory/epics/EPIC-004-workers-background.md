# Workers & Background Jobs — Epic Spec

**Status:** [DRAFT]  
**Sprint:** 3  
**Prioridade:** Baixa  
**Data de criação:** 2026-04-07  
**Última atualização:** 2026-04-07

---

## 📋 Contexto

Processamento de LLM é síncrono e bloqueante. `apps/workers` existe como placeholder sem implementação. Este épico introduz Redis + BullMQ para processar chamadas LLM de forma assíncrona via job queue.

---

## 🎯 Objetivo

Chamadas LLM são processadas em background via workers. O servidor API enfileira jobs e notifica o cliente via WebSocket quando a resposta está pronta.

---

## 📐 Escopo

### Inclui
- Redis no Docker Compose
- BullMQ configurado em `apps/workers`
- Job queue para processamento LLM assíncrono
- Integração com WebSocket para notificação de conclusão

### Não inclui
- Retry policies avançadas (versão futura)
- Monitoring de filas (versão futura)
- Horizontal scaling de workers (versão futura)

---

## 🔗 Tasks Vinculadas

### Infra
- [ ] `INFRA-005` — Adicionar Redis ao Docker Compose
- [ ] `INFRA-006` — Configurar network entre serviços
- [ ] `INFRA-007` — Resource limits

### Backend
- [ ] `BACKEND-011` — Redis Docker
- [ ] `BACKEND-012` — BullMQ setup
- [ ] `BACKEND-013` — Job queue LLM

---

## 📦 Dependências

### Depende de
- **EPIC-001** (Persistência) — dados persistidos
- **EPIC-002** (Separação API) — API e WebSocket em apps/api

### Bloqueia
- Features de processamento batch
- Retry automático de mensagens

---

## ✅ Critérios de Aceite (Nível Épico)

- [ ] Redis e workers rodam via Docker Compose
- [ ] Jobs LLM enfileirados e processados sem bloqueio da API
- [ ] Cliente recebe resposta via WebSocket ao job completar
- [ ] Jobs com erro são logados e não travam o sistema

---

## 📝 Notas

- Spec será detalhada quando Sprint 3 for o foco ativo
