# "declaration": true com "noEmit": true

- Data: 2026-04-07
- Autor: Copilot CLI
- Área: tooling/typescript
- Prioridade: média
- Estimativa: pequena (1-2h)

Descrição

O arquivo `tooling/typescript/base.json` habilita `declaration: true` ao mesmo tempo em que define `noEmit: true`. Isso é contraditório: `declaration: true` solicita geração de arquivos de declaração (.d.ts) enquanto `noEmit: true` impede qualquer emissão de artefatos pelo TypeScript.

Como reproduzir

Abrir `tooling/typescript/base.json` e observar as opções `declaration` e `noEmit`.

Impacto

- Pode confundir mantenedores que esperam que .d.ts sejam gerados.
- Dependendo do fluxo de build, declarações podem não ser geradas quando necessárias para pacotes publicados, causando erros de tipagem para consumidores.

Causa raiz

Configuração de TypeScript genérica aplicada globalmente sem distinguir entre ambientes (dev/build/publish) ou sem um pipeline que sobrescreva `noEmit` durante a geração de artefatos.

Proposta de correção

Opções: 

1. Se a intenção é gerar declarações durante build, remover `noEmit` ou usar um arquivo tsconfig específico para build com `noEmit: false`.
2. Se a intenção é não gerar declarações aqui, então definir `declaration: false` para evitar confusão.
3. Documentar claramente no `tooling` qual tsconfig é usado para build/publish e como sobrescrever as opções.

Critérios de aceitação

- [ ] Decisão registrada (gerar declarações durante build ou nunca gerar).
- [ ] `tooling/typescript` atualizado conforme decisão e documentação adicionada.

Links relacionados

- tooling/typescript/base.json

Notas

Preferir tsconfig separados (ex.: `tsconfig.build.json`) para comportamentos de emissão distintos entre desenvolvimento e publicação.
