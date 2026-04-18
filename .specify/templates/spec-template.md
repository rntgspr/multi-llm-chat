# Especificação de Feature: [NOME DA FEATURE]

**Branch da Feature**: `[###-feature-name]`  
**Criado**: [DATE]  
**Status**: Draft  
**Input**: Descrição do usuário: "$ARGUMENTS"

## Cenários de Usuário & Testes *(obrigatório)*

<!--
  IMPORTANTE: As histórias de usuário devem ser PRIORIZADAS como jornadas de usuário ordenadas por importância.
  Cada história/jornada de usuário deve ser TESTÁVEL INDEPENDENTEMENTE - ou seja, se você implementar apenas UMA delas,
  ainda deve ter um MVP (Produto Mínimo Viável) que entrega valor.
  
  Atribua prioridades (P1, P2, P3, etc.) para cada história, onde P1 é a mais crítica.
  Pense em cada história como uma fatia independente de funcionalidade que pode ser:
  - Desenvolvida independentemente
  - Testada independentemente
  - Implantada independentemente
  - Demonstrada aos usuários independentemente
-->

### História de Usuário 1 - [Título Breve] (Prioridade: P1)

[Descreva esta jornada de usuário em linguagem simples]

**Por que esta prioridade**: [Explique o valor e por que tem este nível de prioridade]

**Teste Independente**: [Descreva como isso pode ser testado independentemente - ex.: "Pode ser totalmente testado por [ação específica] e entrega [valor específico]"]

**Cenários de Aceitação**:

1. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]
2. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]

---

### História de Usuário 2 - [Título Breve] (Prioridade: P2)

[Descreva esta jornada de usuário em linguagem simples]

**Por que esta prioridade**: [Explique o valor e por que tem este nível de prioridade]

**Teste Independente**: [Descreva como isso pode ser testado independentemente]

**Cenários de Aceitação**:

1. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]

---

### História de Usuário 3 - [Título Breve] (Prioridade: P3)

[Descreva esta jornada de usuário em linguagem simples]

**Por que esta prioridade**: [Explique o valor e por que tem este nível de prioridade]

**Teste Independente**: [Descreva como isso pode ser testado independentemente]

**Cenários de Aceitação**:

1. **Dado** [estado inicial], **Quando** [ação], **Então** [resultado esperado]

---

[Adicione mais histórias de usuário conforme necessário, cada uma com uma prioridade atribuída]

### Casos de Borda

<!--
  AÇÃO NECESSÁRIA: O conteúdo desta seção representa placeholders.
  Preencha com os casos de borda corretos.
-->

- O que acontece quando [condição limite]?
- Como o sistema lida com [cenário de erro]?

## Requisitos *(obrigatório)*

<!--
  AÇÃO NECESSÁRIA: O conteúdo desta seção representa placeholders.
  Preencha com os requisitos funcionais corretos.
-->

### Requisitos Funcionais

- **FR-001**: Sistema DEVE [capacidade específica, ex.: "permitir que usuários criem contas"]
- **FR-002**: Sistema DEVE [capacidade específica, ex.: "validar endereços de e-mail"]  
- **FR-003**: Usuários DEVEM poder [interação chave, ex.: "redefinir sua senha"]
- **FR-004**: Sistema DEVE [requisito de dados, ex.: "persistir preferências do usuário"]
- **FR-005**: Sistema DEVE [comportamento, ex.: "registrar todos os eventos de segurança"]

*Exemplo de marcação de requisitos não claros:*

- **FR-006**: Sistema DEVE autenticar usuários via [PRECISA ESCLARECIMENTO: método de autenticação não especificado - email/senha, SSO, OAuth?]
- **FR-007**: Sistema DEVE reter dados do usuário por [PRECISA ESCLARECIMENTO: período de retenção não especificado]

### Entidades Chave *(incluir se feature envolver dados)*

- **[Entidade 1]**: [O que representa, atributos chave sem implementação]
- **[Entidade 2]**: [O que representa, relacionamentos com outras entidades]

## Critérios de Sucesso *(obrigatório)*

<!--
  AÇÃO NECESSÁRIA: Defina critérios de sucesso mensuráveis.
  Estes devem ser agnósticos de tecnologia e mensuráveis.
-->

### Resultados Mensuráveis

- **SC-001**: [Métrica mensurável, ex.: "Usuários podem completar criação de conta em menos de 2 minutos"]
- **SC-002**: [Métrica mensurável, ex.: "Sistema lida com 1000 usuários concorrentes sem degradação"]
- **SC-003**: [Métrica de satisfação do usuário, ex.: "90% dos usuários completam com sucesso a tarefa primária na primeira tentativa"]
- **SC-004**: [Métrica de negócio, ex.: "Reduzir tickets de suporte relacionados a [X] em 50%"]

## Premissas

<!--
  AÇÃO NECESSÁRIA: O conteúdo desta seção representa placeholders.
  Preencha com as premissas corretas baseadas em padrões razoáveis
  escolhidos quando a descrição da feature não especificou certos detalhes.
-->

- [Premissa sobre usuários alvo, ex.: "Usuários têm conectividade estável à internet"]
- [Premissa sobre limites de escopo, ex.: "Suporte mobile está fora do escopo para v1"]
- [Premissa sobre dados/ambiente, ex.: "Sistema de autenticação existente será reutilizado"]
- [Dependência de sistema/serviço existente, ex.: "Requer acesso à API de perfil de usuário existente"]
