# Checklist Geral de Qualidade de Requisitos: EPIC-002 Separação da API

**Propósito**: Avaliar a qualidade, completude e clareza dos requisitos de separação da API (mover backend de `apps/web` para `apps/api`).
**Criado**: 2026-04-07
**Feature**: [EPIC-002-separacao-api.md](../EPIC-002-separacao-api.md)
**Domínio**: Geral
**Profundidade**: Standard
**Audiência**: Reviewer (PR)

---

## Completude de Requisitos

- [ ] CHK001 — Os requisitos de estrutura interna do `apps/api` estão definidos (pastas, camadas, organização de rotas)? [Completude, Gap]
- [ ] CHK002 — Existem requisitos de health check e readiness probes para o novo serviço API? [Completude, Gap]
- [ ] CHK003 — Requisitos de logging e observabilidade estão especificados para o novo serviço? [Completude, Gap]
- [ ] CHK004 — Existem requisitos de tratamento de erros (formatos de resposta, códigos HTTP, mensagens) para as rotas migradas? [Completude, Gap]
- [ ] CHK005 — Requisitos de validação de entrada (request body, query params, headers) estão documentados? [Completude, Gap]
- [ ] CHK006 — Existe um plano de migração incremental definido, ou a separação é tratada como operação atômica? [Completude, Gap]
- [ ] CHK007 — Requisitos de deploy estão especificados (como subir dois apps simultaneamente, ordem de deploy, dependências entre apps)? [Completude, Gap]
- [ ] CHK008 — Requisitos de documentação de API (OpenAPI/Swagger, contratos de endpoint) estão definidos? [Completude, Gap]

## Clareza de Requisitos

- [ ] CHK009 — A task "Auth compartilhado" (BACKEND-009) está quantificada com mecanismo específico (JWT, cookie forwarding, session sharing, outro)? [Clareza, §Escopo]
- [ ] CHK010 — "Reestruturar apps/api" (BACKEND-006) define a estrutura alvo com detalhes suficientes para implementação? [Clareza, §Tasks]
- [ ] CHK011 — As políticas de CORS (BACKEND-010) estão especificadas com origens, métodos e headers permitidos, ou apenas listadas como "CORS e env vars"? [Clareza, §Tasks]
- [ ] CHK012 — "Remover server.ts custom" (FRONTEND-001) define o que substitui o servidor customizado e como o Next.js passa a iniciar? [Clareza, §Tasks]
- [ ] CHK013 — As variáveis de ambiente necessárias estão listadas com nomes, tipos e valores default? [Clareza, §Tasks]
- [ ] CHK014 — "Migrar rotas REST" (BACKEND-008) especifica quais rotas exatamente devem ser migradas e se os contratos (request/response) mudam? [Clareza, §Tasks]

## Consistência de Requisitos

- [ ] CHK015 — O escopo diz "Não inclui mudanças nos packages", mas a separação pode exigir ajustes em imports dos packages — essa premissa está validada? [Consistência, §Escopo]
- [ ] CHK016 — A dependência de EPIC-001 (SurrealDB) está clara sobre o que "repositories prontos" significa em termos de interface estável? [Consistência, §Dependências]
- [ ] CHK017 — Os critérios de aceite mencionam `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_WS_URL`, mas as tasks não detalham a configuração desses valores por ambiente — são consistentes? [Consistência, §Critérios de Aceite vs §Tasks]
- [ ] CHK018 — A listagem de tasks backend e frontend está alinhada com o escopo declarado (sem tasks faltando ou tasks extrapondo o escopo)? [Consistência, §Tasks vs §Escopo]

## Qualidade dos Critérios de Aceite

- [ ] CHK019 — O critério "`apps/web` não contém rotas REST nem servidor WebSocket" é verificável de forma objetiva (ex.: grep por patterns específicos)? [Mensurabilidade, §Critérios de Aceite]
- [ ] CHK020 — O critério "Autenticação funciona em ambos os apps" tem método de verificação definido (testes, cenários manuais)? [Mensurabilidade, §Critérios de Aceite]
- [ ] CHK021 — Faltam critérios de aceite para performance (latência antes/depois da separação não pode regredir)? [Mensurabilidade, Gap]
- [ ] CHK022 — Faltam critérios de aceite para a migração WebSocket (reconexão, fallback, compatibilidade de protocolo)? [Mensurabilidade, Gap]

## Cobertura de Cenários

- [ ] CHK023 — Existem requisitos para o cenário de falha parcial (API disponível mas WebSocket indisponível, ou vice-versa)? [Cobertura, Gap]
- [ ] CHK024 — Existem requisitos para o cenário de migração gradual (período em que frontend pode precisar falar com ambos os endpoints)? [Cobertura, Gap]
- [ ] CHK025 — A reconexão automática do WebSocket está endereçada nos requisitos do `use-websocket.ts` atualizado? [Cobertura, §Tasks FRONTEND-002]
- [ ] CHK026 — Requisitos de backward compatibility estão definidos (clientes antigos vs nova API)? [Cobertura, Gap]
- [ ] CHK027 — A ordem de execução entre tasks backend e frontend está explícita (a nota diz "Tasks frontend dependem da conclusão das tasks backend" mas sem detalhamento)? [Cobertura, §Notas]

## Cobertura de Casos Extremos

- [ ] CHK028 — Existe definição de comportamento quando `apps/api` está indisponível e `apps/web` precisa informar o usuário? [Caso Extremo, Gap]
- [ ] CHK029 — Requisitos de timeout e retry para comunicação entre `apps/web` → `apps/api` estão definidos? [Caso Extremo, Gap]
- [ ] CHK030 — O spec define o que acontece com conexões WebSocket ativas durante um redeploy do `apps/api`? [Caso Extremo, Gap]
- [ ] CHK031 — Existe tratamento definido para o cenário de mismatch de versão entre `apps/web` e `apps/api`? [Caso Extremo, Gap]

## Requisitos Não-Funcionais

- [ ] CHK032 — Requisitos de performance (latência máxima aceitável, throughput) estão definidos para as rotas migradas? [NFR, Gap]
- [ ] CHK033 — Requisitos de segurança (rate limiting, proteção contra CSRF, headers de segurança) estão especificados para o novo serviço? [NFR, Gap]
- [ ] CHK034 — Requisitos de escalabilidade (múltiplas instâncias de `apps/api`, sticky sessions para WebSocket) estão endereçados? [NFR, Gap]
- [ ] CHK035 — Requisitos de testes (unitários, integração, e2e) estão definidos para validar a migração? [NFR, Gap]

## Dependências e Premissas

- [ ] CHK036 — A premissa de que EPIC-001 estará completa antes de iniciar EPIC-002 está validada com timeline? [Premissa, §Dependências]
- [ ] CHK037 — A premissa de que os packages não precisam de mudanças está documentada com justificativa técnica? [Premissa, §Escopo]
- [ ] CHK038 — Dependências de infraestrutura (Docker Compose, rede entre containers, proxy reverso) estão documentadas? [Dependência, Gap]
- [ ] CHK039 — A relação de bloqueio com EPIC-003 está definida em termos de interface — qual contrato `apps/api` deve expor para que workers possam ser adicionados depois? [Dependência, §Dependências]

## Ambiguidades e Conflitos

- [ ] CHK040 — O termo "servidor WebSocket" cobre apenas Socket.io ou também inclui eventuais SSE/long-polling que possam existir? [Ambiguidade, §Escopo]
- [ ] CHK041 — "Migrar rotas REST" inclui as rotas de auth do NextAuth (`/api/auth/...`), ou essas permanecem no Next.js? [Ambiguidade, §Tasks BACKEND-008]
- [ ] CHK042 — O escopo "Não inclui novas features de UI" está em conflito potencial com a necessidade de UI para exibir erros de conexão com a nova API? [Conflito, §Escopo]

---

## Notas

- Total de itens: 42 (CHK001–CHK042)
- 34 itens marcados como `[Gap]` — indicando requisitos potencialmente ausentes no spec atual
- O spec está em estado `[DRAFT]` com nota explícita de que será detalhado quando Sprint 2 for ativo
- Recomendação: abordar os gaps de Clareza (CHK009–CHK014) e Completude (CHK001–CHK008) antes de mover o spec para `[READY]`
