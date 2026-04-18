# Plano de Implementação: [FEATURE]

**Branch**: `[###-feature-name]` | **Data**: [DATE] | **Spec**: [link]
**Input**: Especificação da feature em `.specify/specs/[###-feature-name]/spec.md`

**Nota**: Este template é preenchido pelo comando `/speckit.plan`. Veja `.specify/templates/plan-template.md` para o fluxo de execução.

## Resumo

[Extrair da spec da feature: requisito primário + abordagem técnica da pesquisa]

## Contexto Técnico

<!--
  AÇÃO NECESSÁRIA: Substitua o conteúdo desta seção com os detalhes técnicos
  do projeto. A estrutura aqui é apresentada em caráter consultivo para guiar
  o processo de iteração.
-->

**Linguagem/Versão**: [ex.: Python 3.11, Swift 5.9, Rust 1.75 ou PRECISA ESCLARECIMENTO]  
**Dependências Principais**: [ex.: FastAPI, UIKit, LLVM ou PRECISA ESCLARECIMENTO]  
**Armazenamento**: [se aplicável, ex.: PostgreSQL, CoreData, arquivos ou N/A]  
**Testes**: [ex.: pytest, XCTest, cargo test ou PRECISA ESCLARECIMENTO]  
**Plataforma Alvo**: [ex.: servidor Linux, iOS 15+, WASM ou PRECISA ESCLARECIMENTO]
**Tipo de Projeto**: [ex.: library/cli/web-service/mobile-app/compiler/desktop-app ou PRECISA ESCLARECIMENTO]  
**Metas de Performance**: [específico do domínio, ex.: 1000 req/s, 10k linhas/seg, 60 fps ou PRECISA ESCLARECIMENTO]  
**Restrições**: [específico do domínio, ex.: <200ms p95, <100MB memória, offline-capable ou PRECISA ESCLARECIMENTO]  
**Escala/Escopo**: [específico do domínio, ex.: 10k usuários, 1M LOC, 50 telas ou PRECISA ESCLARECIMENTO]

## Verificação da Constitution

*GATE: Deve passar antes da pesquisa da Fase 0. Re-verificar após design da Fase 1.*

[Gates determinados com base no arquivo constitution]

## Estrutura do Projeto

### Documentação (desta feature)

```text
specs/[###-feature]/
├── plan.md              # Este arquivo (saída do comando /speckit.plan)
├── research.md          # Saída da Fase 0 (comando /speckit.plan)
├── data-model.md        # Saída da Fase 1 (comando /speckit.plan)
├── quickstart.md        # Saída da Fase 1 (comando /speckit.plan)
├── contracts/           # Saída da Fase 1 (comando /speckit.plan)
└── tasks.md             # Saída da Fase 2 (comando /speckit.tasks - NÃO criado por /speckit.plan)
```

### Código Fonte (raiz do repositório)
<!--
  AÇÃO NECESSÁRIA: Substitua a árvore de placeholder abaixo com o layout concreto
  para esta feature. Remova opções não utilizadas e expanda a estrutura escolhida com
  caminhos reais (ex.: apps/admin, packages/something). O plano entregue não deve
  incluir rótulos de Opção.
-->

```text
# [REMOVER SE NÃO USADO] Opção 1: Projeto único (PADRÃO)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVER SE NÃO USADO] Opção 2: Aplicação web (quando "frontend" + "backend" detectados)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVER SE NÃO USADO] Opção 3: Mobile + API (quando "iOS/Android" detectado)
api/
└── [mesmo que backend acima]

ios/ or android/
└── [estrutura específica da plataforma: módulos de features, fluxos de UI, testes de plataforma]
```

**Decisão de Estrutura**: [Documente a estrutura selecionada e referencie os diretórios
reais capturados acima]

## Rastreamento de Complexidade

> **Preencher APENAS se Verificação da Constitution tiver violações que devem ser justificadas**

| Violação | Por Que Necessário | Alternativa Mais Simples Rejeitada Porque |
|----------|--------------------|--------------------------------------------|
| [ex.: 4º projeto] | [necessidade atual] | [por que 3 projetos são insuficientes] |
| [ex.: Repository pattern] | [problema específico] | [por que acesso direto ao DB é insuficiente] |
