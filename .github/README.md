# .github — Agentes, Instruções e Slash Commands

Esta pasta contém as definições de agentes, instruções de código e slash commands do Spec-Kit para o projeto Multi-LLM Chat.

> Toda a documentação de projeto (specs, plans, backlog, tech-debt, contracts, épicos) vive em `.specify/memory/` na raiz do repositório.

---

## 📚 Estrutura

```
.github/
├── agents/                # 3 custom + 9 spec-kit = 12 agentes
├── instructions/          # Padrões de código e convenções (Copilot)
├── prompts/               # Slash commands do Spec-Kit (/speckit.*)
└── README.md              # Este arquivo
```

---

## 🤖 Agentes

### Custom (3)

| Agente | Papel | Handoffs |
|--------|-------|----------|
| `@lead` | Governança, arquitetura, priorização, orquestração SDD | → constitution, specify, clarify, plan, tasks, analyze, checklist, taskstoissues |
| `@developer` | Implementação full-stack (backend, frontend, infra) | → implement, analyze |
| `@critic` | Auditoria de código, tech debt, qualidade de requisitos | → analyze, checklist |

### Spec-Kit (9)

| Agente | Papel | Slash Command |
|--------|-------|---------------|
| `speckit.constitution` | Criar/atualizar constitution | `/speckit.constitution` |
| `speckit.specify` | Criar spec de feature | `/speckit.specify` |
| `speckit.clarify` | Clarificar ambiguidades | `/speckit.clarify` |
| `speckit.plan` | Gerar plano técnico | `/speckit.plan` |
| `speckit.tasks` | Gerar tasks executáveis | `/speckit.tasks` |
| `speckit.analyze` | Validar consistência | `/speckit.analyze` |
| `speckit.checklist` | Avaliar qualidade de requisitos | `/speckit.checklist` |
| `speckit.implement` | Executar implementação | `/speckit.implement` |
| `speckit.taskstoissues` | Converter tasks → GitHub Issues | `/speckit.taskstoissues` |

---

## 🚀 Fluxo Spec-Kit

```
constitution → specify → clarify → plan → tasks → analyze → implement
                                                      ↓
                                                 checklist (a qualquer momento)
```

1. **Constitution:** `.specify/memory/constitution.md` — princípios inegociáveis
2. **Specify:** Criar spec a partir de descrição natural
3. **Clarify:** Resolver ambiguidades (opcional)
4. **Plan:** Gerar plano técnico
5. **Tasks:** Gerar breakdown executável
6. **Analyze:** Validar consistência entre artefatos
7. **Implement:** Executar tasks

---

## 📂 Referência Rápida

### Instruções de Código
- [architecture.instructions.md](./instructions/architecture.instructions.md) — Arquitetura e estrutura
- [coding-style.instructions.md](./instructions/coding-style.instructions.md) — Estilo de código, SOLID, DRY
- [documentation.instructions.md](./instructions/documentation.instructions.md) — JSDoc e comentários

### Documentação do Projeto (em `.specify/`)
- `.specify/memory/constitution.md` — Princípios governantes
- `.specify/memory/backlog.md` — Backlog consolidado
- `.specify/memory/status-atual.md` — Estado atual do projeto
- `.specify/memory/epics/` — Épicos como referência
- `.specify/memory/tech-debt/` — Dívida técnica
- `.specify/memory/contracts/` — Contratos de interface
- `.specify/templates/` — Templates oficiais (spec, plan, tasks, checklist)

---

## 📊 Status do Projeto

**Progresso atual:** ~70% completo

Veja detalhes em: [plans/STATUS-ATUAL.md](./plans/STATUS-ATUAL.md)

---

## 🆘 Precisa de Ajuda?

### Orquestrador
- Leia [sdd/processo.md](./.specify/sdd/processo.md) para processo completo
- Use [templates/](./.specify/templates/) para criar specs/tasks
- Consulte [sdd/GUIA-RAPIDO.md](./.specify/sdd/GUIA-RAPIDO.md) para comandos

### Backend Developer
- Check [tasks/backend/TODO.md](./.specify/tasks/backend/TODO.md) para tasks pendentes
- Leia specs em [specs/backend/](./.specify/specs/backend/)
- Consulte [contracts/packages/](./.specify/contracts/packages/) para APIs

### Frontend Developer
- Check [tasks/frontend/TODO.md](./.specify/tasks/frontend/TODO.md) para tasks pendentes
- Leia specs em [specs/frontend/](./.specify/specs/frontend/)
- Consulte [contracts/api/](./.specify/contracts/api/) e [contracts/components/](./.specify/contracts/components/)

### Validador/QA
- Check [tasks/validator/TODO.md](./.specify/tasks/validator/TODO.md) para validações pendentes
- Use [templates/validation-report.md](./.specify/templates/validation-report.md) para criar reports
- Valide contra specs em [specs/](./.specify/specs/)

---

**Última atualização:** 2026-04-03
