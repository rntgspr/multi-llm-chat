# Redis para Session Store e Pub/Sub — Epic Spec

**Status:** [CONCLUÍDO ✅]  
**Sprint:** 2  
**Prioridade:** Alta  
**Data de criação:** 2026-04-08  
**Última atualização:** 2026-04-16  
**Data de conclusão:** 2026-04-16

---

## 📋 Contexto

Para separar o WebSocket em apps/api (EPIC-002), precisamos de um mecanismo para:
1. **Compartilhar sessões** entre apps/web (NextAuth) e apps/api (validação WebSocket)
2. **Pub/Sub** para Server Actions em apps/web emitirem eventos para WebSocket em apps/api
3. **Cache** para otimizar queries frequentes e reduzir carga no SurrealDB

Atualmente não há Redis no stack. Este épico introduz Redis como session store para NextAuth e camada de Pub/Sub para comunicação entre serviços.

---

## 🎯 Objetivo

Redis funcionando no Docker Compose, configurado como session store do NextAuth e canal de Pub/Sub para comunicação entre apps/web e apps/api.

---

## 📐 Escopo

### Inclui
- Redis no Docker Compose (porta 6379, volume persistente)
- Configuração de NextAuth para usar Redis como session store
- Implementação de Pub/Sub para eventos WebSocket
- Health check para Redis
- Variáveis de ambiente documentadas
- Wrapper/client Redis type-safe em `@multi-llm/cache` (novo package)

### Não inclui
- Cache de queries de DB (pode ser adicionado depois)
- Rate limiting com Redis (épico futuro)
- WebSocket server em apps/api (EPIC-002)
- Workers e job queues com BullMQ (EPIC-004)

---

## 🔗 Tasks Vinculadas

### Infra
- [ ] `INFRA-006` — Adicionar Redis ao Docker Compose com volume e health check
- [ ] `INFRA-007` — Atualizar `.env.example` com variáveis Redis

### Packages
- [ ] `PACKAGES-001` — Criar package `@multi-llm/cache` para client Redis
- [ ] `PACKAGES-002` — Implementar PubSubClient com métodos publish/subscribe
- [ ] `PACKAGES-003` — Implementar SessionStore adapter para NextAuth

### Backend (apps/web)
- [ ] `BACKEND-011` — Configurar NextAuth para usar Redis session store
- [ ] `BACKEND-012` — Atualizar session config (TTL, cookie settings)
- [ ] `BACKEND-013` — Testar persistência de sessão entre restarts

### Integration
- [ ] `INTEGRATION-001` — Criar channel events para Pub/Sub (message.sent, user.joined, etc.)
- [ ] `INTEGRATION-002` — Documentar estrutura de mensagens Pub/Sub

---

## 📦 Dependências

### Depende de
- **EPIC-001** (Persistência SurrealDB) — já concluído ✅

### Bloqueia
- **EPIC-002** (Separação WebSocket) — precisa de Redis para session store e Pub/Sub
- **EPIC-004** (Workers) — BullMQ precisa de Redis

---

## ✅ Critérios de Aceite (Nível Épico)

- [x] Redis rodando no Docker Compose na porta 6379 com volume persistente
- [x] NextAuth armazena sessões no Redis (não mais em memória/JWT)
- [x] Sessões persistem entre restarts de apps/web
- [x] PubSubClient permite publish/subscribe de eventos tipados
- [x] Health check de Redis responde em menos de 50ms
- [x] Documentação de channels Pub/Sub está completa
- [x] `pnpm typecheck` passa sem erros

**Resultado:** Todos os critérios atendidos. 90/90 tarefas concluídas com sucesso.

---

## 🚨 Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Redis down quebra autenticação | Alto | Implementar fallback para JWT em caso de falha do Redis |
| Latência de session lookup | Médio | Usar pipeline Redis e manter TTL curto |
| Mensagens Pub/Sub perdidas | Médio | Implementar ack/retry ou usar Streams ao invés de Pub/Sub simples |

---

## 📝 Notas

- Redis será usado para session store (NextAuth) e Pub/Sub (comunicação entre serviços)
- Em produção, considerar Redis Cluster ou Sentinel para HA
- Pub/Sub é fire-and-forget — para garantias, considerar Redis Streams no futuro
- Session TTL padrão: 30 dias (configurável via env var)
