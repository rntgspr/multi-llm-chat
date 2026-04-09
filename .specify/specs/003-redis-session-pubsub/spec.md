# Especificação de Feature: Infraestrutura de Session Store Redis e Pub/Sub

**Feature Branch**: `003-redis-session-pubsub`  
**Criado**: 2024-04-09  
**Status**: Rascunho  
**Epic**: EPIC-003 - Redis para Session Store e Pub/Sub  
**Input**: Descrição do usuário: "Redis para Session Store e Pub/Sub - Objetivo: Redis no Docker Compose como session store do NextAuth e Pub/Sub para comunicação apps/web ↔ apps/api"

## Cenários de Usuário & Testes *(obrigatório)*

### User Story 1 - Sessões de Autenticação Persistentes (Prioridade: P1)

Um desenvolvedor precisa garantir que as sessões de autenticação de usuários persistam entre reinicializações da aplicação e sejam compartilhadas entre a aplicação web e os serviços de API.

**Por que esta prioridade**: Esta é a fundação para autenticação confiável de usuários em um sistema distribuído. Sem sessões persistentes, usuários seriam desconectados a cada deploy ou reinicialização do servidor, criando uma experiência de usuário ruim e bloqueando a separação dos serviços WebSocket (EPIC-002).

**Teste Independente**: Pode ser completamente testado autenticando um usuário, reiniciando a aplicação web e verificando que a sessão permanece válida. Entrega valor imediato ao melhorar a confiabilidade de sessões e habilitar deploys sem downtime.

**Cenários de Aceitação**:

1. **Dado** que um usuário está autenticado na aplicação web, **Quando** a aplicação web reinicia, **Então** o usuário permanece autenticado sem precisar fazer login novamente
2. **Dado** que um usuário se autentica na aplicação web, **Quando** os dados da sessão são consultados no session store, **Então** a sessão contém ID do usuário, email e timestamp de autenticação
3. **Dado** que uma sessão está armazenada, **Quando** 30 dias passam sem atividade, **Então** a sessão é automaticamente removida do store
4. **Dado** que múltiplas instâncias da aplicação estão rodando, **Quando** um usuário se autentica na instância A, **Então** a sessão é acessível a partir da instância B

---

### User Story 2 - Biblioteca Cliente de Cache Type-Safe (Prioridade: P2)

Um desenvolvedor trabalhando em qualquer parte da aplicação (web, API ou workers) precisa interagir com a camada de cache usando uma interface consistente e type-safe.

**Por que esta prioridade**: Fornece uma fundação reutilizável para todas as operações de cache no monorepo. Necessária antes que Pub/Sub possa ser implementado, mas pode ser desenvolvida e testada independentemente do armazenamento de sessões.

**Teste Independente**: Pode ser testado criando uma suíte de testes que executa operações básicas de cache (get, set, delete, ttl) e verifica type safety em tempo de compilação. Entrega valor ao padronizar padrões de acesso ao cache.

**Cenários de Aceitação**:

1. **Dado** que um desenvolvedor importa o cliente de cache, **Quando** ele tenta chamar métodos com tipos incorretos, **Então** a compilação falha com mensagens de erro claras
2. **Dado** que um par chave-valor é armazenado no cache, **Quando** os dados são recuperados, **Então** o tipo retornado corresponde ao tipo armazenado
3. **Dado** que o serviço de cache está indisponível, **Quando** operações são tentadas, **Então** erros são capturados e retornados como objetos de erro tipados
4. **Dado** que uma conexão ao cache é estabelecida, **Quando** um health check é executado, **Então** o tempo de resposta é inferior a 50 milissegundos

---

### User Story 3 - Comunicação de Eventos em Tempo Real (Prioridade: P3)

Um desenvolvedor precisa emitir eventos da aplicação web que são recebidos pelo serviço de API para habilitar funcionalidades em tempo real sem acoplamento forte.

**Por que esta prioridade**: Habilita comunicação desacoplada entre serviços mas depende de P1 e P2 estarem completas. Crítico para EPIC-002 (separação de WebSocket) mas pode ser implementado por último.

**Teste Independente**: Pode ser testado publicando um evento de uma server action da web e assinando-o de um endpoint de teste da API, verificando que a mensagem é recebida com estrutura correta. Entrega valor ao habilitar comunicação entre serviços.

**Cenários de Aceitação**:

1. **Dado** que um assinante está ouvindo um canal, **Quando** uma mensagem é publicada naquele canal, **Então** o assinante recebe a mensagem em até 100 milissegundos
2. **Dado** que schemas de eventos tipados são definidos, **Quando** um evento é publicado com estrutura incorreta, **Então** a compilação falha antes do runtime
3. **Dado** que múltiplos serviços assinam o mesmo canal, **Quando** um evento é publicado, **Então** todos os assinantes recebem o evento
4. **Dado** que não existem assinantes para um canal, **Quando** um evento é publicado, **Então** a operação de publicação é bem-sucedida sem erro (comportamento fire-and-forget)

---

### Casos Extremos

- O que acontece quando Redis está indisponível durante autenticação? (Criação de sessão deve falhar graciosamente, usuário vê mensagem de erro clara)
- Como o sistema lida com corrupção de dados de sessão? (Sessões inválidas são descartadas, usuário é solicitado a re-autenticar)
- O que acontece quando Redis atinge capacidade máxima de memória? (Sessões mais antigas são removidas baseado em política LRU, usuários ativos permanecem autenticados)
- Como atualizações concorrentes à mesma sessão são tratadas? (Última escrita vence, atualizações de sessão incluem timestamp)
- O que acontece quando um assinante de Pub/Sub trava durante entrega de mensagem? (Mensagem é perdida - comportamento fire-and-forget documentado, sem mecanismo de retry na v1)
- Como o sistema lida com mensagens Pub/Sub malformadas? (Mensagem é logada e descartada, assinantes continuam processando outras mensagens)

## Requisitos *(obrigatório)*

### Requisitos Funcionais

#### Infraestrutura
- **FR-001**: O sistema DEVE fornecer um serviço de cache rodando acessível na porta 6379
- **FR-002**: O sistema DEVE persistir dados do cache entre reinicializações do serviço
- **FR-003**: O sistema DEVE responder a health checks em até 50 milissegundos
- **FR-004**: O sistema DEVE ser acessível a todos os serviços da aplicação dentro da rede de containers

#### Armazenamento de Sessão
- **FR-005**: O sistema DEVE armazenar dados de sessão de autenticação com um time-to-live padrão de 30 dias
- **FR-006**: O sistema DEVE permitir recuperação de dados de sessão pelo identificador de sessão
- **FR-007**: O sistema DEVE expirar automaticamente sessões após o TTL configurado
- **FR-008**: O sistema DEVE suportar atualização de dados de sessão sem alterar o identificador de sessão
- **FR-009**: O sistema DEVE permitir deleção de sessões individuais ao fazer logout

#### Biblioteca Cliente de Cache
- **FR-010**: O sistema DEVE fornecer métodos type-safe para operações básicas de cache (get, set, delete, exists)
- **FR-011**: O sistema DEVE suportar definição de valores de TTL personalizados em entradas individuais de cache
- **FR-012**: O sistema DEVE lidar com falhas de conexão com respostas de erro tipadas
- **FR-013**: O sistema DEVE suportar serialização e desserialização JSON de valores em cache
- **FR-014**: O sistema DEVE validar configuração de conexão na inicialização

#### Comunicação Pub/Sub
- **FR-015**: O sistema DEVE permitir publicação de mensagens tipadas em canais nomeados
- **FR-016**: O sistema DEVE permitir assinatura de um ou mais canais com uma função de callback
- **FR-017**: O sistema DEVE suportar cancelamento de assinatura de canais
- **FR-018**: O sistema DEVE entregar mensagens a todos os assinantes ativos de um canal
- **FR-019**: O sistema DEVE fornecer documentação de convenções de nomenclatura de canais

#### Configuração
- **FR-020**: O sistema DEVE permitir configuração via variáveis de ambiente para host, porta e senha
- **FR-021**: O sistema DEVE fornecer valores padrão sensatos para todas as opções de configuração
- **FR-022**: O sistema DEVE validar configuração na inicialização da aplicação

### Entidades Chave

- **Session**: Representa uma sessão de usuário autenticado com identificador, informações do usuário, timestamp de expiração e metadados opcionais. Sessões são armazenadas como dados JSON serializados com TTL automático.

- **Cache Entry**: Representa um par chave-valor no cache com TTL opcional. Valores podem ser qualquer estrutura de dados serializável em JSON.

- **Pub/Sub Channel**: Representa um canal de comunicação nomeado com schema de mensagem definido. Canais são identificados por nomes string seguindo uma convenção de nomenclatura hierárquica (ex: "chat.message.sent", "user.status.changed").

- **Pub/Sub Message**: Representa um evento transmitido através de um canal com informação de tipo, timestamp e dados de payload em conformidade com o schema do canal.

## Critérios de Sucesso *(obrigatório)*

### Resultados Mensuráveis

- **SC-001**: Sessões de usuário persistem através de reinicializações da aplicação com 100% de confiabilidade
- **SC-002**: Operações de busca de sessão são completadas em menos de 10 milissegundos para 95% das requisições
- **SC-003**: Health checks do cache respondem em até 50 milissegundos
- **SC-004**: Mensagens Pub/Sub são entregues aos assinantes em até 100 milissegundos após publicação
- **SC-005**: O sistema suporta pelo menos 1000 sessões de usuários concorrentes sem degradação de performance
- **SC-006**: Todas as operações de cache são type-safe e capturadas em tempo de compilação se usadas incorretamente
- **SC-007**: Zero erros relacionados à autenticação causados por falhas no session store durante operação normal

## Premissas

- Redis rodará como um serviço em container na mesma rede Docker dos serviços da aplicação
- TTL de sessão de 30 dias é apropriado para a base de usuários (configurável via variável de ambiente)
- Semântica fire-and-forget do Pub/Sub é aceitável (sem entrega garantida ou persistência de mensagens na v1)
- NextAuth já está configurado na aplicação web e será integrado com o novo session store
- Ambientes de desenvolvimento e staging usarão a mesma configuração de Redis da produção (instância única, sem clustering)
- Perda de mensagens no Pub/Sub é aceitável para funcionalidades em tempo real (nenhuma lógica de negócio crítica depende de entrega garantida)
- O monorepo existente usa pnpm workspaces e TypeScript para todos os pacotes
- Remoção de dados do cache usa política Least Recently Used (LRU) quando limites de memória são atingidos
