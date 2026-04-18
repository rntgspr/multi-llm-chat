# Tarefas: Separação do WebSocket/API (EPIC-002)

**Entrada**: Documentos de design de `.specify/specs/002-separacao-api/`
**Pré-requisitos**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Testes**: Testes NÃO são explicitamente solicitados na especificação. Foco apenas na implementação.

**Organização**: As tarefas são agrupadas por user story para permitir implementação e testes independentes de cada história.

## Formato: `- [ ] [ID] [P?] [Story?] Descrição`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3, US4, US5)
- Incluir caminhos exatos de arquivos nas descrições

## Convenções de Caminhos

Este é um **monorepo** com a seguinte estrutura:
- `apps/web/`: Frontend Next.js + Server Actions (porta 3000)
- `apps/api/`: Serviço Hono + WebSocket (porta 4000)
- `packages/`: Bibliotecas compartilhadas (@multi-llm/db, @multi-llm/platform, etc.)

---

## Fase 1: Setup (Infraestrutura Compartilhada)

**Propósito**: Inicializar apps/api e configurar dependências compartilhadas

- [X] T001 Criar estrutura de diretórios apps/api com src/, src/lib/, src/middlewares/, src/websocket/, src/subscribers/
- [X] T002 Inicializar apps/api package.json com Hono 4.12.9, Socket.io 4.8.3, @hono/node-server 1.19.12
- [X] T003 [P] Configurar TypeScript para apps/api com tsconfig.json (target: ES2022, moduleResolution: bundler)
- [X] T004 [P] Adicionar scripts dev de apps/api à configuração turbo do package.json raiz
- [X] T005 [P] Atualizar .env.example com NEXT_PUBLIC_WS_URL, NEXTAUTH_SECRET (compartilhado), PORT=4000
- [X] T006 Criar apps/api/src/index.ts com inicialização básica do app Hono
- [X] T007 [P] Adicionar biblioteca jose para validação JWT às dependências de apps/api

---

## Fase 2: Fundacional (Pré-requisitos Bloqueantes)

**Propósito**: Infraestrutura central que DEVE estar completa antes que QUALQUER user story possa ser implementada

**⚠️ CRÍTICO**: Nenhum trabalho de user story pode começar até esta fase estar completa

- [X] T008 Implementar utilitário de verificação JWT em apps/api/src/middlewares/auth.ts usando biblioteca jose
- [X] T009 [P] Criar middleware de validação de sessão para WebSocket em apps/api/src/websocket/middleware/session.ts
- [X] T010 [P] Configurar middleware de correlation ID em apps/api/src/lib/correlation-id.ts para rastreamento distribuído
- [X] T011 Configurar subscriber Redis Pub/Sub em apps/api/src/lib/redis-init.ts com verificação de saúde
- [X] T012 Criar inicialização do servidor Socket.io em apps/api/src/websocket/server.ts
- [X] T013 [P] Implementar utilitário de log estruturado com pino em apps/api/src/lib/logger.ts
- [X] T014 Criar tipos de resultado de Server Action em packages/types/src/action-result.ts (ActionSuccess, ActionError, ErrorCode)
- [X] T015 Criar tipos de envelope de evento Redis em packages/platform/src/pubsub/types.ts (PubSubEnvelope)
- [X] T016 [P] Criar constantes de canal Redis em packages/platform/src/pubsub/channels.ts (CHANNELS.CHAT.*, CHANNELS.ROOM.*)
- [X] T017 [P] Atualizar packages/platform para exportar getPublisher e getSubscriber para apps/web e apps/api

**Checkpoint**: Fundação pronta - implementação de user stories pode agora começar em paralelo

---

## Fase 3: User Story 1 — Comunicação em Tempo Real Funciona Perfeitamente (Prioridade: P1) 🎯 MVP

**Objetivo**: Servidor WebSocket roda independentemente em apps/api, clientes se conectam, e entrega de mensagens em tempo real funciona sem interrupção

**Teste Independente**: Iniciar apps/api na porta 4000, conectar com cliente Socket.io, enviar mensagem via Server Action, verificar que WebSocket recebe broadcast

### Implementação para User Story 1

**Migração WebSocket**

- [ ] T018 [P] [US1] Mover lógica de inicialização Socket.io de apps/web/src/server.ts para apps/api/src/websocket/server.ts
- [ ] T019 [P] [US1] Criar handler de namespace /chat em apps/api/src/websocket/namespaces/chat.ts com eventos de entrar/sair de sala
- [ ] T020 [P] [US1] Criar handler de namespace /presence em apps/api/src/websocket/namespaces/presence.ts com atualizações de status
- [ ] T021 [P] [US1] Criar handler de namespace /typing em apps/api/src/websocket/namespaces/typing.ts com indicadores de digitação
- [ ] T022 [US1] Integrar middleware de sessão em todos os namespaces (chat, presence, typing)
- [ ] T023 [US1] Implementar verificação de autorização de sala no namespace chat antes de permitir room:join

**Conexão WebSocket Client-Side**

- [ ] T024 [US1] Atualizar apps/web/src/hooks/use-websocket.ts para conectar a NEXT_PUBLIC_WS_URL com token JWT em auth
- [ ] T025 [US1] Adicionar lógica de reconexão com backoff exponencial (1s → 5s max) a use-websocket.ts
- [ ] T026 [US1] Implementar rastreamento de status de conexão (connected/disconnected/reconnecting) em use-websocket.ts
- [ ] T027 [US1] Adicionar tratamento de erros para eventos connect_error (falhas de validação de token)

**Ponte Redis Subscriber → WebSocket**

- [ ] T028 [US1] Criar módulo de subscriber de eventos em apps/api/src/subscribers/event-subscriber.ts
- [ ] T029 [US1] Inscrever no canal chat.message.sent e fazer broadcast para namespace /chat na sala
- [ ] T030 [P] [US1] Inscrever no canal room.member.joined e fazer broadcast para namespace /chat
- [ ] T031 [P] [US1] Inscrever no canal room.member.left e fazer broadcast para namespace /chat
- [ ] T032 [US1] Adicionar log de correlation ID a todos os handlers de subscriber
- [ ] T033 [US1] Integrar inicialização de subscriber de eventos na inicialização de apps/api (index.ts)

**Ciclo de Vida do Servidor WebSocket**

- [ ] T034 [US1] Implementar handler de desligamento gracioso em apps/api/src/index.ts (listener SIGTERM)
- [ ] T035 [US1] Adicionar notificação de desligamento do servidor a todos os clientes (evento server:shutting-down)
- [ ] T036 [US1] Atualizar script dev em apps/api/package.json para habilitar hot reload

**Testes & Validação**

- [ ] T037 [US1] Iniciar apps/api standalone e verificar que servidor Socket.io inicia na porta 4000
- [ ] T038 [US1] Testar conexão WebSocket com token JWT da sessão NextAuth
- [ ] T039 [US1] Verificar que reconexão funciona após simulação de desconexão de rede

**Checkpoint**: Neste ponto, servidor WebSocket está totalmente operacional e clientes podem se conectar para atualizações em tempo real

---

## Fase 4: User Story 2 — Server Actions Substituem API Routes com Sucesso (Prioridade: P1)

**Objetivo**: Todas as operações de backend (salas, mensagens, assistentes) funcionam via Server Actions sem rotas de API REST

**Teste Independente**: Criar sala via formulário, enviar mensagem, verificar que dados foram salvos no BD e Server Action retorna sucesso

### Implementação para User Story 2

**Infraestrutura de Server Action**

- [ ] T040 [US2] Criar estrutura de diretórios apps/web/src/lib/actions/
- [ ] T041 [P] [US2] Criar schemas Zod para todas as actions em apps/web/src/lib/actions/schemas.ts (SendMessage, CreateRoom, UpdateMessage, etc.)

**Actions de Sala**

- [ ] T042 [P] [US2] Implementar Server Action createRoom em apps/web/src/lib/actions/rooms.ts com validação
- [ ] T043 [P] [US2] Implementar Server Action listRooms em apps/web/src/lib/actions/rooms.ts
- [ ] T044 [P] [US2] Implementar Server Action updateRoom em apps/web/src/lib/actions/rooms.ts
- [ ] T045 [P] [US2] Implementar Server Action deleteRoom em apps/web/src/lib/actions/rooms.ts
- [ ] T046 [US2] Adicionar publicação Redis para eventos room.created, room.updated, room.deleted nas actions de sala

**Actions de Mensagem**

- [ ] T047 [P] [US2] Implementar Server Action sendMessage em apps/web/src/lib/actions/messages.ts com validação de conteúdo (1-5000 chars)
- [ ] T048 [P] [US2] Implementar Server Action listMessages em apps/web/src/lib/actions/messages.ts com paginação
- [ ] T049 [P] [US2] Implementar Server Action updateMessage em apps/web/src/lib/actions/messages.ts (janela de edição de 24 horas)
- [ ] T050 [P] [US2] Implementar Server Action deleteMessage em apps/web/src/lib/actions/messages.ts
- [ ] T051 [US2] Adicionar publicação Redis para chat.message.sent com correlation ID na action sendMessage
- [ ] T052 [US2] Adicionar publicação Redis para chat.message.updated, chat.message.deleted nas respectivas actions
- [ ] T053 [US2] Implementar degradação graciosa para falhas Redis (retornar success: true, code: REDIS_UNAVAILABLE)

**Actions de Assistente**

- [ ] T054 [P] [US2] Implementar Server Action listAssistants em apps/web/src/lib/actions/assistants.ts
- [ ] T055 [P] [US2] Implementar Server Action configureAssistant em apps/web/src/lib/actions/assistants.ts
- [ ] T056 [US2] Adicionar publicação Redis para evento room.assistant.configured

**Actions de Convite**

- [ ] T057 [P] [US2] Implementar Server Action createInvite em apps/web/src/lib/actions/invites.ts com lógica de expiração
- [ ] T058 [P] [US2] Implementar Server Action acceptInvite em apps/web/src/lib/actions/invites.ts
- [ ] T059 [US2] Adicionar publicação Redis para room.member.joined quando convite é aceito

**Autenticação & Tratamento de Erros**

- [ ] T060 [US2] Adicionar verificação de autenticação a todas as Server Actions usando auth() do NextAuth
- [ ] T061 [US2] Implementar formato de resposta de erro consistente (união discriminada ActionResult) em todas as actions
- [ ] T062 [US2] Adicionar geração de correlation ID a todas as Server Actions (crypto.randomUUID())

**Integração Frontend**

- [ ] T063 [US2] Atualizar formulário de criação de sala para usar Server Action createRoom com useFormState
- [ ] T064 [US2] Atualizar formulário de mensagem para usar Server Action sendMessage com atualizações otimistas (useOptimistic)
- [ ] T065 [US2] Adicionar exibição de erros para falhas de Server Action nos formulários de sala e mensagem
- [ ] T066 [US2] Implementar atualizações otimistas de UI para sendMessage com indicador de estado pendente

**Testes & Validação**

- [ ] T067 [US2] Testar action createRoom via formulário UI e verificar que sala aparece no banco de dados
- [ ] T068 [US2] Testar action sendMessage e verificar que mensagem é salva mesmo se Redis estiver inativo (degradação graciosa)
- [ ] T069 [US2] Verificar que Server Actions não autorizadas retornam código de erro UNAUTHORIZED

**Checkpoint**: Todas as operações CRUD funcionam via Server Actions, rotas de API REST não são mais necessárias

---

## Fase 5: User Story 3 — WebSocket Conecta de Forma Independente (Prioridade: P1)

**Objetivo**: Conexão WebSocket para apps/api:4000 funciona independentemente do Next.js, com validação de autenticação e reconexão

**Teste Independente**: Iniciar apenas apps/api, conectar com cliente Socket.io standalone, verificar que conexão estabelece com JWT válido

### Implementação para User Story 3

**Servidor WebSocket apps/api**

- [ ] T070 [US3] Configurar servidor Socket.io em apps/api para escutar na PORT 4000 (de env)
- [ ] T071 [US3] Adicionar configuração CORS ao servidor Socket.io para permitir origem apps/web
- [ ] T072 [US3] Implementar extração de token JWT de socket.handshake.auth.token ou query.token
- [ ] T073 [US3] Adicionar validação de token no middleware de sessão (verificar assinatura com NEXTAUTH_SECRET)
- [ ] T074 [US3] Anexar userId e sessionId a socket.data após autenticação bem-sucedida
- [ ] T075 [US3] Rejeitar conexão com erro "Invalid token" se validação JWT falhar
- [ ] T076 [US3] Rejeitar conexão com "Authentication token required" se nenhum token for fornecido

**Reconexão & Ciclo de Vida do Cliente**

- [ ] T077 [US3] Configurar opções de reconexão do cliente Socket.io (reconnectionDelay: 1000, reconnectionDelayMax: 5000)
- [ ] T078 [US3] Implementar handler de evento connect para re-entrar em salas após reconexão
- [ ] T079 [US3] Implementar handler de evento disconnect para detectar desconexões iniciadas pelo servidor (expiração de token)
- [ ] T080 [US3] Adicionar lógica para atualizar token JWT se motivo da desconexão for "io server disconnect"

**Gerenciamento de Sala via WebSocket**

- [ ] T081 [US3] Implementar handler de evento room:join no namespace chat (verificar que usuário tem acesso à sala)
- [ ] T082 [US3] Implementar handler de evento room:leave no namespace chat
- [ ] T083 [US3] Garantir que clientes re-entrem em salas na reconexão (armazenar salas ativas no estado do cliente)
- [ ] T084 [US3] Fazer broadcast de evento member:joined quando usuário entra na sala via room:join

**Broadcast de Eventos**

- [ ] T085 [US3] Verificar que evento message:new faz broadcast para todos os sockets em room:${roomId}
- [ ] T086 [US3] Verificar que eventos member:joined e member:left fazem broadcast para membros da sala
- [ ] T087 [US3] Garantir que correlation IDs são incluídos em todos os eventos de broadcast

**Testes & Validação**

- [ ] T088 [US3] Iniciar apps/api na porta 4000 independentemente e verificar que endpoint /health responde
- [ ] T089 [US3] Testar conexão WebSocket com token JWT válido da sessão apps/web
- [ ] T090 [US3] Testar rejeição de conexão com token JWT inválido ou expirado
- [ ] T091 [US3] Simular desconexão de rede e verificar reconexão automática com backoff exponencial
- [ ] T092 [US3] Verificar re-inscrição em sala após reconexão

**Checkpoint**: Servidor WebSocket totalmente independente, clientes conectam e reconectam de forma confiável com autenticação

---

## Fase 6: User Story 4 — API Health e Monitoramento Funcionam (Prioridade: P2)

**Objetivo**: Endpoint /health em apps/api fornece verificação de status para servidor WebSocket e conexão Redis

**Teste Independente**: curl http://localhost:4000/health retorna 200 OK com status do servidor

### Implementação para User Story 4

**Endpoint de Health Check**

- [ ] T093 [US4] Criar rota /health em apps/api/src/index.ts usando Hono
- [ ] T094 [US4] Adicionar verificação de saúde Redis ao endpoint /health (ping com timeout)
- [ ] T095 [US4] Adicionar verificação de status Socket.io ao endpoint /health (verificar se io.engine.clientsCount >= 0)
- [ ] T096 [US4] Retornar 200 OK com status: "ok", timestamp, websocket: { active_connections } se saudável
- [ ] T097 [US4] Retornar 503 Service Unavailable se ping Redis falhar ou Socket.io não estiver inicializado
- [ ] T098 [US4] Garantir que endpoint /health responde em <100ms (sem operações custosas)

**Validação de Inicialização**

- [ ] T099 [US4] Adicionar validação de variáveis de ambiente na inicialização de apps/api (fail-fast se variáveis críticas estiverem faltando)
- [ ] T100 [US4] Registrar status de conexão Redis na inicialização (connected / failed)
- [ ] T101 [US4] Registrar status de inicialização Socket.io na inicialização (listening on port X)

**Testes & Validação**

- [ ] T102 [US4] Testar GET /health retorna 200 OK quando apps/api está rodando normalmente
- [ ] T103 [US4] Testar GET /health retorna 503 se Redis estiver indisponível
- [ ] T104 [US4] Verificar que /health responde em <100ms sob carga (requisições concorrentes)

**Checkpoint**: Verificações de saúde habilitam automação de deploy e monitoramento

---

## Fase 7: User Story 5 — Código Legado é Removido Completamente (Prioridade: P3)

**Objetivo**: Remover todas as rotas de API de apps/web e código de servidor customizado do Next.js, garantindo migração limpa

**Teste Independente**: Buscar por apps/web/src/app/api/* e apps/web/src/server.ts, verificar zero resultados

### Implementação para User Story 5

**Remover Código Legado**

- [ ] T105 [US5] Deletar apps/web/src/server.ts (servidor Next.js customizado)
- [ ] T106 [US5] Deletar todos os arquivos em apps/web/src/app/api/* (rotas de API REST)
- [ ] T107 [US5] Remover imports de servidor Socket.io da codebase apps/web
- [ ] T108 [US5] Atualizar scripts de apps/web package.json para usar servidor Next.js padrão (remover servidor customizado)
- [ ] T109 [US5] Remover dependências não usadas do servidor Socket.io de apps/web/package.json se não forem necessárias para o cliente

**Atualizar Documentação**

- [ ] T110 [US5] Atualizar README.md para refletir arquitetura apps/web (porta 3000) + apps/api (porta 4000)
- [ ] T111 [US5] Documentar uso da variável de ambiente NEXT_PUBLIC_WS_URL
- [ ] T112 [US5] Documentar que NEXTAUTH_SECRET deve ser idêntico em apps/web e apps/api
- [ ] T113 [US5] Atualizar quickstart de desenvolvedor para iniciar apps/web e apps/api concorrentemente

**Validação de Build & Deploy**

- [ ] T114 [US5] Executar build para apps/web e verificar que não há imports de servidor customizado ou warnings
- [ ] T115 [US5] Executar build para apps/api e verificar build limpo sem erros
- [ ] T116 [US5] Verificar que pnpm dev inicia apps/web e apps/api concorrentemente via turbo

**Testes & Validação**

- [ ] T117 [US5] Buscar na codebase por apps/web/src/app/api/* e verificar que nenhum arquivo existe
- [ ] T118 [US5] Buscar na codebase por apps/web/src/server.ts e verificar que arquivo foi deletado
- [ ] T119 [US5] Verificar que não há warnings no console sobre imports não usados ou padrões de servidor depreciados
- [ ] T120 [US5] Executar todos os testes existentes e verificar zero falhas após limpeza

**Checkpoint**: Codebase está limpo, nenhum padrão legado permanece, migração completa

---

## Fase 8: Polimento & Preocupações Transversais

**Propósito**: Melhorias que afetam múltiplas user stories

**Logging & Observabilidade**

- [ ] T121 [P] Adicionar logging estruturado a todas as Server Actions com correlation IDs em apps/web/src/lib/actions/
- [ ] T122 [P] Adicionar logging estruturado a todos os subscribers Redis em apps/api/src/subscribers/event-subscriber.ts
- [ ] T123 [P] Adicionar logging estruturado a eventos de conexão/desconexão WebSocket em apps/api

**Melhorias no Tratamento de Erros**

- [ ] T124 Adicionar rate limiting às Server Actions (10 mensagens/min, 5 salas/hora, 10 convites/hora)
- [ ] T125 Implementar resposta de erro de rate limit com campo retryAfter

**Endurecimento de Segurança**

- [ ] T126 [P] Adicionar validação Zod a todos os payloads de evento Redis nos subscribers de apps/api
- [ ] T127 [P] Garantir que todos os broadcasts WebSocket respeitam autorização de sala (verificar acesso do usuário)
- [ ] T128 Adicionar verificação de expiração de token JWT no middleware WebSocket (desconectar se expirado)

**Otimização de Performance**

- [ ] T129 Implementar pipeline Redis para publicação de eventos em lote nas Server Actions
- [ ] T130 Adicionar debouncing a eventos de indicador de digitação no lado do cliente (intervalo de 3 segundos)

**Documentação & Experiência do Desenvolvedor**

- [ ] T131 [P] Criar documentação de API para todas as Server Actions em apps/web/src/lib/actions/README.md
- [ ] T132 [P] Documentar schemas de evento WebSocket em apps/api/README.md
- [ ] T133 [P] Documentar schemas de canal Redis em packages/platform/README.md
- [ ] T134 Validar instruções de quickstart.md seguindo-as passo a passo
- [ ] T135 Atualizar README.md raiz com diagrama de arquitetura EPIC-002

**Validação Final**

- [ ] T136 Executar teste end-to-end completo: criar sala, enviar mensagem, verificar entrega em tempo real
- [ ] T137 Testar degradação graciosa: parar Redis, verificar que mensagens são salvas com atualizações otimistas
- [ ] T138 Testar desligamento gracioso: reiniciar apps/api, verificar que clientes reconectam automaticamente
- [ ] T139 Teste de carga: simular 100 conexões WebSocket concorrentes e verificar performance

---

## Dependências & Ordem de Execução

### Dependências de Fase

- **Setup (Fase 1)**: Sem dependências - pode começar imediatamente
- **Fundacional (Fase 2)**: Depende da conclusão do Setup - BLOQUEIA todas as user stories
- **User Stories (Fase 3-7)**: Todas dependem da conclusão da fase Fundacional
  - US1, US2, US3 são prioridade P1 e devem ser feitas primeiro (podem ser paralelizadas com múltiplos devs)
  - US4 é prioridade P2 e pode ser feita após as stories P1
  - US5 é prioridade P3 e deve ser feita por último (limpeza)
- **Polimento (Fase 8)**: Depende de todas as user stories desejadas estarem completas

### Dependências de User Story

- **User Story 1 (P1)**: Pode começar após Fundacional (Fase 2) - Estabelece servidor WebSocket em apps/api
- **User Story 2 (P1)**: Pode começar após Fundacional (Fase 2) - Implementa Server Actions independentemente de WebSocket
- **User Story 3 (P1)**: Depende da conclusão de US1 (precisa do servidor WebSocket rodando) - Integra conexão do cliente
- **User Story 4 (P2)**: Pode começar após Fundacional (Fase 2) - Implementação independente de health check
- **User Story 5 (P3)**: Deve esperar até US1-US3 estarem completas e validadas - Limpeza final

### Caminho Crítico

```
Setup (T001-T007) 
  → Fundacional (T008-T017) ✋ BLOQUEIA TUDO
    → US1: Migração WebSocket (T018-T039) 🔴 P1
    → US2: Server Actions (T040-T069) 🔴 P1
    → US3: Conexão Independente (T070-T092) 🔴 P1 (depende de US1)
      → US4: Health Check (T093-T104) 🟡 P2
      → US5: Limpeza de Código (T105-T120) 🟢 P3
        → Polimento (T121-T139)
```

### Dentro de Cada User Story

- Tarefas marcadas com [P] dentro de uma story podem executar em paralelo
- Tarefas não marcadas dentro de uma story devem seguir a ordem listada
- Complete todas as tarefas de uma story antes de marcá-la como concluída

### Oportunidades de Paralelização

**Fase 1 (Setup)**: T003, T004, T005, T007 podem executar em paralelo após T001-T002

**Fase 2 (Fundacional)**: 
- T009, T010, T013, T014, T015, T016, T017 podem executar em paralelo após T008
- T008, T011, T012 devem executar sequencialmente (auth → redis → socket.io)

**User Story 1**:
- T018, T019, T020, T021 podem executar em paralelo (arquivos de namespace diferentes)
- T030, T031 podem executar em paralelo (handlers de evento diferentes)

**User Story 2**:
- T042, T043, T044, T045 podem executar em paralelo (funções de action de sala diferentes)
- T047, T048, T049, T050 podem executar em paralelo (funções de action de mensagem diferentes)
- T054, T055 podem executar em paralelo (funções de action de assistente diferentes)
- T057, T058 podem executar em paralelo (funções de action de convite diferentes)

**User Story 5**:
- T105-T109 podem executar em paralelo (deletando arquivos diferentes)
- T110-T113 podem executar em paralelo (atualizando documentos diferentes)

**Fase 8 (Polimento)**:
- T121, T122, T123 podem executar em paralelo (localizações de logging diferentes)
- T126, T127 podem executar em paralelo (preocupações de segurança diferentes)
- T131, T132, T133 podem executar em paralelo (arquivos de documentação diferentes)

---

## Exemplo de Paralelização: User Story 2 (Server Actions)

```bash
# Lançar todas as implementações de actions de sala juntas:
# Tarefa T042: "Implementar Server Action createRoom em apps/web/src/lib/actions/rooms.ts"
# Tarefa T043: "Implementar Server Action listRooms em apps/web/src/lib/actions/rooms.ts"
# Tarefa T044: "Implementar Server Action updateRoom em apps/web/src/lib/actions/rooms.ts"
# Tarefa T045: "Implementar Server Action deleteRoom em apps/web/src/lib/actions/rooms.ts"

# Lançar todas as implementações de actions de mensagem juntas:
# Tarefa T047: "Implementar Server Action sendMessage em apps/web/src/lib/actions/messages.ts"
# Tarefa T048: "Implementar Server Action listMessages em apps/web/src/lib/actions/messages.ts"
# Tarefa T049: "Implementar Server Action updateMessage em apps/web/src/lib/actions/messages.ts"
# Tarefa T050: "Implementar Server Action deleteMessage em apps/web/src/lib/actions/messages.ts"
```

---

## Estratégia de Implementação

### MVP Primeiro (Apenas User Stories 1-3)

1. Completar Fase 1: Setup (T001-T007)
2. Completar Fase 2: Fundacional (T008-T017) ✋ CRÍTICO - bloqueia todas as stories
3. Completar Fase 3: User Story 1 (T018-T039) - Servidor WebSocket operacional
4. Completar Fase 4: User Story 2 (T040-T069) - Server Actions substituem API REST
5. Completar Fase 5: User Story 3 (T070-T092) - Conexão WebSocket independente
6. **PARAR e VALIDAR**: Testar fluxo end-to-end (criar sala, enviar mensagem, verificar entrega em tempo real)
7. Fazer deploy/demo se estiver pronto

### Entrega Incremental

1. Completar Setup + Fundacional (T001-T017) → Fundação pronta
2. Adicionar User Story 1 (T018-T039) → Servidor WebSocket rodando → Testar independentemente
3. Adicionar User Story 2 (T040-T069) → Server Actions funcionando → Testar independentemente
4. Adicionar User Story 3 (T070-T092) → Integração completa → Testar end-to-end (MVP PRONTO! 🎯)
5. Adicionar User Story 4 (T093-T104) → Health checks para prontidão de produção
6. Adicionar User Story 5 (T105-T120) → Limpar código legado
7. Adicionar Polimento (T121-T139) → Sistema pronto para produção

### Estratégia de Time Paralelo

Com múltiplos desenvolvedores (após conclusão da fase Fundacional T008-T017):

**Opção 1: Por User Story**
- Desenvolvedor A: User Story 1 (migração WebSocket)
- Desenvolvedor B: User Story 2 (Server Actions)
- Desenvolvedor C: User Story 4 (Health checks)
- Ponto de sincronização: User Story 3 requer US1 completa

**Opção 2: Por Componente**
- Desenvolvedor A: Todo o trabalho WebSocket (US1, US3)
- Desenvolvedor B: Todo o trabalho de Server Actions (US2)
- Desenvolvedor C: Infraestrutura (US4, Polimento)

---

## Notas

- **Tarefas [P]**: Arquivos diferentes, sem dependências - podem executar em paralelo
- **Label [Story]**: Mapeia tarefa para user story específica para rastreabilidade
- **Cada user story**: Independentemente completável e testável
- **Correlation IDs**: Devem ser propagados através de Server Action → Redis → WebSocket → Cliente para rastreamento
- **Degradação graciosa**: Sistema deve funcionar (com UX degradada) mesmo se Redis estiver inativo
- **Validação JWT**: NEXTAUTH_SECRET deve ser idêntico em apps/web e apps/api
- **Estratégia de commit**: Commitar após cada tarefa ou grupo lógico
- **Checkpoints**: Parar em qualquer checkpoint para validar story independentemente
- **Evitar**: Tarefas vagas, conflitos no mesmo arquivo, dependências entre stories que quebram independência

---

## Mapeamento de Critérios de Sucesso

| Critério de Sucesso | Verificado pelas Tarefas |
|---------------------|--------------------------|
| SC-001: Latência de mensagem <1s p99 | T037-T039, T085-T087, T136 |
| SC-002: Zero bugs de regressão | T120, T136-T139 |
| SC-003: 1000 conexões concorrentes | T139 (teste de carga) |
| SC-004: Server Actions <3s | T067-T069 |
| SC-005: Validação JWT <50ms | T073-T076, T090 |
| SC-006: Sem servidor customizado em apps/web | T105-T109, T117-T120 |
| SC-007: /health responde <100ms | T093-T098, T102-T104 |
| SC-008: Reconexão <5s | T077-T080, T091-T092 |
| SC-009: Zero falhas de autenticação | T060-T062, T074-T076 |
| SC-010: Sucesso de broadcast >99% | T085-T087, T136 |
| SC-011: Documentação funciona na primeira tentativa | T110-T113, T134 |

---

**Total de Tarefas**: 139 tarefas em 8 fases
**Paralelização Estimada**: 30-40% das tarefas podem executar em paralelo com equipe adequada
**Escopo MVP**: Fases 1-5 (T001-T092) = ~66% do total de tarefas
**Caminho Crítico**: Setup → Fundacional → US1 → US3 → Polimento (caminho mínimo viável)

**Próximos Passos**: Executar tarefas sequencialmente por fase, ou paralelizar dentro das fases usando marcadores [P]. Começar com Fase 1 (T001-T007).
