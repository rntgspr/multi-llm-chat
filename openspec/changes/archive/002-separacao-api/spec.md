# Especificação de Feature: Separação do WebSocket (EPIC-002)

**Feature Branch**: `002-separacao-websocket`  
**Criado em**: 2026-04-08  
**Status**: Rascunho  
**Input**: Descrição do usuário: "EPIC-002: Separação do WebSocket - Mover servidor WebSocket para apps/api. Migrar API routes para Server Actions do Next.js. apps/api contém APENAS WebSocket, apps/web usa Server Actions para backend."

## Cenários de Usuário e Testes *(obrigatório)*

### User Story 1 — Comunicação em Tempo Real Funciona Perfeitamente (Prioridade: P1)

Como usuário do chat, preciso que a entrega de mensagens em tempo real e atualizações de presença funcionem sem nenhuma interrupção quando o servidor WebSocket for movido do Next.js para o serviço standalone.

**Por que esta prioridade**: Esta é a funcionalidade core do aplicativo de chat. Se a comunicação em tempo real quebrar, o aplicativo inteiro fica inutilizável. Todas as outras features dependem disto funcionando corretamente.

**Teste Independente**: Pode ser totalmente testado abrindo dois clientes de chat, enviando mensagens entre eles, e verificando que as mensagens aparecem em tempo real em ambas as janelas. Isso entrega valor imediato ao provar que a mudança de arquitetura não quebra a funcionalidade core.

**Cenários de Aceite**:

1. **Dado** um usuário conectado a uma sala de chat, **Quando** outro usuário envia uma mensagem para a mesma sala, **Então** o primeiro usuário recebe a mensagem em até 1 segundo via WebSocket
2. **Dado** um usuário perde a conexão, **Quando** o WebSocket reconecta, **Então** o usuário recebe todas as mensagens enviadas durante o período de desconexão
3. **Dado** múltiplos usuários estão em uma sala, **Quando** um usuário entra ou sai, **Então** todos os outros usuários recebem atualizações de presença em até 2 segundos
4. **Dado** um usuário está digitando, **Quando** indicadores de digitação são enviados, **Então** outros participantes da sala veem o status de digitação em tempo real

---

### User Story 2 — Server Actions Substituem API Routes com Sucesso (Prioridade: P1)

Como desenvolvedor do frontend, preciso que todas as operações de backend (criar sala, enviar mensagem, gerenciar assistentes) funcionem via Server Actions do Next.js sem necessidade de rotas REST, mantendo a mesma funcionalidade e segurança.

**Por que esta prioridade**: Sem Server Actions funcionando, usuários não conseguem realizar nenhuma ação no sistema (criar salas, enviar mensagens, etc.). É P1 porque substitui toda a camada de API REST e afeta todas as operações CRUD.

**Teste Independente**: Pode ser testado criando uma nova sala via interface, o que dispara um Server Action. Se a sala é criada e aparece na lista, o Server Action está funcionando. Isso pode ser verificado independentemente sem rodar apps/api (apenas Next.js).

**Cenários de Aceite**:

1. **Dado** um usuário autenticado, **Quando** ele cria uma nova sala via formulário, **Então** o Server Action persiste a sala no banco e retorna sucesso
2. **Dado** um usuário em uma sala, **Quando** ele envia uma mensagem, **Então** o Server Action salva a mensagem e dispara evento WebSocket para outros usuários
3. **Dado** um usuário não autenticado, **Quando** ele tenta executar um Server Action protegido, **Então** recebe erro de não autorizado sem executar a ação
4. **Dado** um Server Action falha (erro de DB, validação), **Quando** o erro é lançado, **Então** o frontend recebe mensagem de erro específica e clara

---

### User Story 3 — WebSocket Conecta de Forma Independente (Prioridade: P1)

Como usuário do sistema, preciso que a conexão WebSocket funcione independentemente do servidor Next.js, conectando ao apps/api na porta 4000, para que atualizações em tempo real sejam mais eficientes e escaláveis.

**Por que esta prioridade**: Separar o WebSocket permite escalar a camada de real-time independentemente do frontend/backend. É P1 porque sem WebSocket funcionando, não há comunicação em tempo real.

**Teste Independente**: Pode ser testado iniciando apenas apps/api (porta 4000) e usando um cliente Socket.io standalone para conectar. Se a conexão estabelece e mensagens são recebidas, o WebSocket standalone está funcionando.

**Cenários de Aceite**:

1. **Dado** apps/api está rodando na porta 4000, **Quando** o frontend tenta conectar ao WebSocket, **Então** a conexão é estabelecida com sucesso em `ws://localhost:4000`
2. **Dado** um usuário está autenticado, **Quando** a conexão WebSocket é estabelecida, **Então** o servidor valida a sessão antes de aceitar a conexão
3. **Dado** apps/api reinicia, **Quando** o frontend detecta desconexão, **Então** ele automaticamente tenta reconectar com exponential backoff
4. **Dado** múltiplos usuários conectados, **Quando** um evento é emitido, **Então** apenas usuários autorizados (mesma sala) recebem o evento

---

### User Story 4 — API Health e Monitoramento Funcionam (Prioridade: P2)

Como engenheiro DevOps, preciso de um endpoint de health check em apps/api para verificar que o servidor WebSocket está rodando e aceitando conexões antes de rotear tráfego para ele.

**Por que esta prioridade**: Essencial para deployment e troubleshooting, mas o sistema funciona sem isso em desenvolvimento. É P2 porque não bloqueia funcionalidade mas é crítico para produção.

**Teste Independente**: Pode ser testado fazendo curl no endpoint /health de apps/api. Uma resposta 200 OK confirma que o servidor está rodando e pronto para aceitar conexões.

**Cenários de Aceite**:

1. **Dado** apps/api está rodando, **Quando** uma requisição GET /health é feita, **Então** o endpoint retorna 200 OK com status do servidor
2. **Dado** Socket.io não conseguiu inicializar, **Quando** /health é chamado, **Então** retorna 503 Service Unavailable com detalhes do erro
3. **Dado** o servidor está sob carga, **Quando** /health é consultado, **Então** responde em menos de 100ms sem afetar conexões WebSocket
4. **Dado** múltiplas requisições de health check, **Quando** são feitas simultaneamente, **Então** todas retornam status consistente

---

### User Story 5 — Código Legado é Removido Completamente (Prioridade: P3)

Como mantenedor da codebase, preciso que API routes antigas sejam removidas de apps/web e o servidor Socket.io customizado seja eliminado para evitar confusão sobre qual código está ativo.

**Por que esta prioridade**: Limpeza de código é importante para manutenibilidade mas não afeta funcionalidade. É P3 porque pode ser feito após validar que tudo funciona.

**Teste Independente**: Pode ser testado buscando por arquivos em /app/api/* e server.ts customizado. Sucesso significa zero ocorrências e todos os testes passando.

**Cenários de Aceite**:

1. **Dado** Server Actions substituíram API routes, **Quando** a codebase é inspecionada, **Então** não existem arquivos em apps/web/src/app/api/*
2. **Dado** WebSocket foi movido, **Quando** apps/web inicia, **Então** não há inicialização de servidor Socket.io customizado
3. **Dado** código legado foi removido, **Quando** o build é executado, **Então** não há imports não utilizados ou warnings
4. **Dado** a migração está completa, **Quando** novos desenvolvedores revisam o código, **Então** está claro que apps/web usa Server Actions e apps/api é apenas WebSocket

---

### Edge Cases

- **When apps/api (WebSocket) está down mas apps/web está rodando**: Usuários devem ver graceful degradation com optimistic updates - a UI permite enviar mensagens que aparecem localmente com indicador de "pendente", e Server Actions salvam no DB normalmente. Quando apps/api volta, mensagens pendentes são sincronizadas via WebSocket.
- Como Server Actions lidam com operações de longa duração (ex: processamento de LLM)? Devem ter timeout adequado e feedback visual de progresso.
- E se a sessão de um usuário expira durante execução de um Server Action? O action deve falhar com erro específico e redirecionar para login.
- Como WebSocket lida com reconnection storms quando apps/api reinicia? Deve implementar jittered reconnection delays e rate limiting.
- **Quando Server Action salva dados com sucesso mas Redis Pub/Sub falha no broadcast para apps/api**: Sistema usa local echo + eventual consistency - mensagem aparece imediatamente na UI do remetente (optimistic), é salva no DB, mas se Redis falhar, outros usuários só verão quando fizerem polling/refresh ou quando Redis se recuperar e reprocessar eventos pendentes.
- Como garantir que Server Actions e WebSocket usam os mesmos managers/repositories? Devem compartilhar packages `@synergy/db`, `@synergy/platform`, etc.
- E se múltiplas abas estão abertas e uma envia mensagem via Server Action? O WebSocket deve propagar para todas as abas do mesmo usuário também.
- **Para debugging de falhas de entrega de mensagens na arquitetura distribuída**: Sistema deve implementar Correlation IDs propagados através de logs com structured logging - cada operação recebe um correlation ID único que é passado de Server Action → Redis → WebSocket → Cliente, permitindo rastrear toda a jornada nos logs estruturados.

## Requirements *(obrigatório)*

### Functional Requirements

#### WebSocket Infrastructure
- **FR-001**: O sistema DEVE iniciar apps/api como serviço independente usando Hono framework na porta 4000
- **FR-002**: O sistema DEVE inicializar servidor Socket.io em apps/api exclusivamente para comunicação em tempo real
- **FR-003**: O sistema DEVE estruturar apps/api com diretórios para websocket, middlewares e config (SEM rotas REST)
- **FR-004**: O sistema DEVE garantir que apps/api pode ser desenvolvido e deployado independentemente de apps/web
- **FR-005**: O sistema DEVE configurar hot reload em apps/api para desenvolvimento local

#### WebSocket Migration
- **FR-006**: O sistema DEVE mover servidor Socket.io de apps/web/src/server.ts para apps/api/src/websocket
- **FR-007**: O sistema DEVE implementar namespaces WebSocket para separar concerns (/chat, /presence, /typing)
- **FR-008**: O sistema DEVE validar sessão de usuário antes de aceitar conexão WebSocket
- **FR-009**: O sistema DEVE propagar eventos de sala (join, leave, typing, message) apenas para usuários autorizados
- **FR-010**: O sistema DEVE implementar reconnection logic com exponential backoff no cliente
- **FR-011**: O sistema DEVE desconectar usuários quando suas sessões expirarem

#### Server Actions Implementation
- **FR-012**: O sistema DEVE criar Server Actions em apps/web para todas as operações de backend
- **FR-013**: O sistema DEVE implementar Server Actions para gerenciar salas (criar, listar, atualizar, deletar)
- **FR-014**: O sistema DEVE implementar Server Actions para gerenciar mensagens (enviar, listar, marcar como lida)
- **FR-015**: O sistema DEVE implementar Server Actions para gerenciar assistentes (listar, configurar, ativar)
- **FR-016**: O sistema DEVE implementar Server Actions para gerenciar convites (criar, validar, usar)
- **FR-017**: O sistema DEVE validar autenticação em todos os Server Actions usando NextAuth
- **FR-018**: O sistema DEVE validar inputs em Server Actions usando Zod ou similar
- **FR-019**: O sistema DEVE retornar erros tipados de Server Actions para tratamento no frontend

#### Integration Between Server Actions and WebSocket
- **FR-020**: O sistema DEVE permitir que Server Actions emitam eventos WebSocket após operações bem-sucedidas via Redis Pub/Sub
- **FR-021**: O sistema DEVE publicar eventos em canais Redis após Server Actions completarem (ex: `chat:room:{roomId}:message`) com correlation ID incluído no payload
- **FR-022**: O sistema DEVE fazer apps/api subscrever canais Redis e propagar eventos via WebSocket para clientes conectados, preservando correlation ID
- **FR-023**: O sistema DEVE garantir que Server Actions e WebSocket compartilhem packages de domínio (@synergy/db, @synergy/platform)
- **FR-024**: O sistema DEVE implementar fallback gracioso se Redis estiver indisponível durante Server Action usando local echo + eventual consistency (salva dados no DB, retorna sucesso ao cliente com optimistic update, mas não faz broadcast em tempo real)

#### Authentication & Session Validation
- **FR-025**: O sistema DEVE manter NextAuth rodando em apps/web para autenticação de usuários
- **FR-026**: O sistema DEVE criar middleware em apps/api para validar sessões NextAuth em conexões WebSocket usando validação de JWT token com chave secreta compartilhada
- **FR-027**: O sistema DEVE compartilhar chave secreta JWT entre apps/web e apps/api via variáveis de ambiente (NEXTAUTH_SECRET)
- **FR-028**: O sistema DEVE transmitir JWT token de sessão do cliente para apps/api durante handshake WebSocket via query parameter ou auth header

#### Configuration & Environment
- **FR-029**: O sistema DEVE adicionar NEXT_PUBLIC_WS_URL ao .env.example apontando para http://localhost:4000
- **FR-030**: O sistema DEVE adicionar REDIS_URL ao .env.example para conexão Redis Pub/Sub
- **FR-031**: O sistema DEVE adicionar NEXTAUTH_SECRET compartilhado ao .env.example para validação JWT entre apps/web e apps/api
- **FR-032**: O sistema DEVE documentar todas as variáveis de ambiente necessárias no README
- **FR-033**: O sistema DEVE validar variáveis de ambiente requeridas no startup de apps/api
- **FR-034**: O sistema DEVE falhar rapidamente (fail-fast) se variáveis críticas estiverem faltando

#### Frontend Client Updates
- **FR-035**: O sistema DEVE atualizar use-websocket.ts em apps/web para conectar a NEXT_PUBLIC_WS_URL
- **FR-036**: O sistema DEVE remover clients de API REST do frontend (já que Server Actions substituem)
- **FR-037**: O sistema DEVE incluir JWT token de sessão NextAuth em conexão WebSocket via query parameter ou auth header
- **FR-038**: O sistema DEVE implementar error handling para falhas de WebSocket com graceful degradation (network errors, 401, desconexões) mostrando optimistic updates quando WebSocket está offline

#### Code Cleanup
- **FR-039**: O sistema DEVE remover todos os arquivos de API routes de apps/web/src/app/api/*
- **FR-040**: O sistema DEVE remover apps/web/src/server.ts e lógica customizada de servidor Next.js
- **FR-041**: O sistema DEVE remover imports não utilizados relacionados a Socket.io de apps/web
- **FR-042**: O sistema DEVE garantir que apps/web usa servidor Next.js padrão após cleanup

### Non-Functional Requirements

- **NFR-001**: Latência de mensagens via WebSocket DEVE ser menor que 1 segundo em 99% dos casos
- **NFR-002**: WebSocket DEVE suportar pelo menos 1000 conexões concorrentes
- **NFR-003**: apps/api DEVE incluir endpoint /health que responde em menos de 100ms
- **NFR-004**: Validação de sessão JWT em WebSocket middleware DEVE adicionar menos de 50ms de latência no handshake
- **NFR-005**: Server Actions DEVEM completar em menos de 3 segundos para operações CRUD simples
- **NFR-006**: O sistema DEVE implementar structured logging com correlation IDs em todos os componentes (Server Actions, Redis Pub/Sub, WebSocket handlers) para rastreabilidade end-to-end
- **NFR-007**: O sistema DEVE logar todas as falhas de autenticação JWT para auditoria
- **NFR-008**: apps/api DEVE implementar graceful shutdown para permitir deploys sem perda de conexões
- **NFR-009**: Correlation IDs DEVEM ser gerados no Server Action e propagados através de Redis events até os logs do WebSocket, permitindo rastrear uma operação completa nos logs estruturados

## Success Criteria *(obrigatório)*

### Measurable Outcomes

- **SC-001**: Latência de entrega de mensagens em tempo real é menor que 1 segundo em 99% das vezes (medida via logs de timestamp)
- **SC-002**: Zero bugs de regressão relacionados a funcionalidade de chat são reportados após deploy (medido via issue tracking)
- **SC-003**: apps/api suporta 1000 conexões WebSocket concorrentes sem degradação de performance (medido via load testing)
- **SC-004**: Todas as operações CRUD via Server Actions completam em menos de 3 segundos (medido via APM)
- **SC-005**: Validação de sessão no WebSocket adiciona menos de 50ms de latência no handshake (medido via logs)
- **SC-006**: apps/web não contém servidor customizado nem API routes REST (medido via code review)
- **SC-007**: Endpoint /health de apps/api responde em menos de 100ms em 99% das vezes (medido via monitoring)
- **SC-008**: Tempo de reconexão WebSocket após queda de rede é menor que 5 segundos (medido via testes simulados)
- **SC-009**: Zero erros de "action failed" em Server Actions devido a problemas de autenticação (medido via logs)
- **SC-010**: Server Actions que emitem eventos WebSocket têm taxa de sucesso de broadcast > 99% (medido via telemetria)
- **SC-011**: Documentação para iniciar apps/web e apps/api localmente está completa e funciona na primeira tentativa (medido via onboarding de desenvolvedor)

## Assumptions

- NextAuth já está configurado e funcionando em apps/web com suporte a JWT tokens
- NextAuth JWT tokens podem ser validados em apps/api usando NEXTAUTH_SECRET compartilhado
- SurrealDB (EPIC-001) está funcionando para persistência de histórico e dados frios
- Redis (EPIC-003) está funcionando para sessions, cache, pub/sub e hot storage
- **Redis é o hot storage primário para conversas ativas** - mensagens recentes armazenadas no Redis para leitura ultra-rápida
- **apps/api acessa APENAS Redis** (zero acesso direto ao SurrealDB) - toda persistência vai via apps/workers
- **apps/web acessa SurrealDB e Redis** - Server Actions escrevem no SurrealDB para dados persistentes e no Redis para dados hot
- apps/workers faz sync assíncrono Redis → SurrealDB (background jobs de persistência)
- Packages compartilhados (@synergy/db, @synergy/interaction, @synergy/platform) podem ser consumidos tanto por apps/web quanto apps/api
- Next.js suporta Server Actions na versão instalada
- Desenvolvedores possuem acesso às portas 3000 (Next.js), 4000 (WebSocket) e 6379 (Redis) em suas máquinas locais
- Não há necessidade de API REST externa - todos os clientes consomem via Next.js (SSR + Server Actions)
- Produção usará um reverse proxy ou load balancer para rotear tráfego WebSocket
- Sistema de logs estruturados (JSON logging) já está configurado ou será facilmente integrável
- Clients podem tolerar eventual consistency quando Redis está indisponível (optimistic updates + local echo)

## Clarifications

### Session 2026-04-08

- Q: How should Server Actions in apps/web trigger WebSocket broadcasts in apps/api? → A: C - Redis Pub/Sub
- Q: How should WebSocket authentication work when validating NextAuth sessions? → A: B - JWT token validation with shared secret
- Q: When apps/api (WebSocket server) is down but apps/web is running, how should the UI behave for chat functionality? → A: A - Graceful degradation with optimistic updates
- Q: When a Server Action successfully saves data but Redis Pub/Sub fails to deliver the broadcast event to apps/api, how should the system behave? → A: B - Local echo + eventual consistency
- Q: When debugging a message delivery failure across the distributed architecture, how should the system enable tracing and correlation? → A: C - Correlation IDs propagated through logs with structured logging
