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

- O que acontece quando apps/api (WebSocket) está down mas apps/web está rodando? Usuários devem ver mensagens de "chat offline" mas ainda podem navegar e executar Server Actions.
- Como Server Actions lidam com operações de longa duração (ex: processamento de LLM)? Devem ter timeout adequado e feedback visual de progresso.
- E se a sessão de um usuário expira durante execução de um Server Action? O action deve falhar com erro específico e redirecionar para login.
- Como WebSocket lida com reconnection storms quando apps/api reinicia? Deve implementar jittered reconnection delays e rate limiting.
- O que acontece se um Server Action tenta emitir evento WebSocket mas apps/api está down? Deve logar erro mas não falhar a operação primária (ex: mensagem é salva mas broadcast falha).
- Como garantir que Server Actions e WebSocket usam os mesmos managers/repositories? Devem compartilhar packages `@multi-llm/db`, `@multi-llm/maintenance`, etc.
- E se múltiplas abas estão abertas e uma envia mensagem via Server Action? O WebSocket deve propagar para todas as abas do mesmo usuário também.

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
- **FR-020**: O sistema DEVE permitir que Server Actions emitam eventos WebSocket após operações bem-sucedidas
- **FR-021**: O sistema DEVE usar HTTP client (fetch/axios) de Server Actions para comunicar com apps/api quando necessário
- **FR-022**: O sistema DEVE garantir que Server Actions e WebSocket compartilhem packages de domínio (@multi-llm/db, @multi-llm/maintenance)
- **FR-023**: O sistema DEVE implementar fallback gracioso se WebSocket estiver indisponível durante Server Action

#### Authentication & Session Validation
- **FR-024**: O sistema DEVE manter NextAuth rodando em apps/web para autenticação de usuários
- **FR-025**: O sistema DEVE criar middleware em apps/api para validar sessões NextAuth em conexões WebSocket
- **FR-026**: O sistema DEVE compartilhar chave secreta de sessão entre apps/web e apps/api via variáveis de ambiente
- **FR-027**: O sistema DEVE transmitir token/cookie de sessão do cliente para apps/api durante handshake WebSocket

#### Configuration & Environment
- **FR-028**: O sistema DEVE adicionar NEXT_PUBLIC_WS_URL ao .env.example apontando para http://localhost:4000
- **FR-029**: O sistema DEVE documentar todas as variáveis de ambiente necessárias no README
- **FR-030**: O sistema DEVE validar variáveis de ambiente requeridas no startup de apps/api
- **FR-031**: O sistema DEVE falhar rapidamente (fail-fast) se variáveis críticas estiverem faltando

#### Frontend Client Updates
- **FR-032**: O sistema DEVE atualizar use-websocket.ts em apps/web para conectar a NEXT_PUBLIC_WS_URL
- **FR-033**: O sistema DEVE remover clients de API REST do frontend (já que Server Actions substituem)
- **FR-034**: O sistema DEVE incluir cookies/tokens de sessão em conexão WebSocket
- **FR-035**: O sistema DEVE implementar error handling para falhas de WebSocket (network errors, 401, desconexões)

#### Code Cleanup
- **FR-036**: O sistema DEVE remover todos os arquivos de API routes de apps/web/src/app/api/*
- **FR-037**: O sistema DEVE remover apps/web/src/server.ts e lógica customizada de servidor Next.js
- **FR-038**: O sistema DEVE remover imports não utilizados relacionados a Socket.io de apps/web
- **FR-039**: O sistema DEVE garantir que apps/web usa servidor Next.js padrão após cleanup

### Non-Functional Requirements

- **NFR-001**: Latência de mensagens via WebSocket DEVE ser menor que 1 segundo em 99% dos casos
- **NFR-002**: WebSocket DEVE suportar pelo menos 1000 conexões concorrentes
- **NFR-003**: apps/api DEVE incluir endpoint /health que responde em menos de 100ms
- **NFR-004**: Validação de sessão em WebSocket middleware DEVE adicionar menos de 50ms de latência no handshake
- **NFR-005**: Server Actions DEVEM completar em menos de 3 segundos para operações CRUD simples
- **NFR-006**: O sistema DEVE logar todas as falhas de autenticação para auditoria
- **NFR-007**: apps/api DEVE implementar graceful shutdown para permitir deploys sem perda de conexões

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

- NextAuth já está configurado e funcionando em apps/web
- SurrealDB (EPIC-001) já está funcionando e acessível por apps/web (Server Actions) e apps/api
- Packages compartilhados (@multi-llm/db, @multi-llm/interaction, @multi-llm/maintenance) podem ser consumidos tanto por apps/web quanto apps/api
- Next.js suporta Server Actions na versão instalada
- Desenvolvedores possuem acesso às portas 3000 (Next.js) e 4000 (WebSocket) em suas máquinas locais
- Não há necessidade de API REST externa - todos os clientes consomem via Next.js (SSR + Server Actions)
- Produção usará um reverse proxy ou load balancer para rotear tráfego WebSocket
- Sessões NextAuth usam tokens JWT ou cookies HTTP-only que podem ser validados em apps/api
- Não há requisitos de migração de dados existentes (toda persistência já está em SurrealDB via EPIC-001)
- Server Actions podem fazer HTTP calls para apps/api quando precisarem emitir eventos WebSocket
