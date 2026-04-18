# Revisar db-helpers.queryOne

- Data: 2026-04-07
- Autor: Copilot CLI
- Área: backend/tooling/db
- Prioridade: média
- Estimativa: pequena (1-3h)

Descrição

O helper `queryOne` em `apps/api/src/lib/db-helpers.ts` chama `db.query` e retorna o primeiro resultado ou `null`. Apesar de `surrealdb` ter operações nativas (e.g., `select`, `get`), a camada `queryOne` adiciona uma abstração para obter um único registro.

Observações e problemas potenciais

- Redundância: se a API do Surreal oferece `get`/`select` que retornam um único registro, `queryOne` pode ser desnecessário.
- Ocultação de erros/forma do resultado: `query` retorna `result[0]` sem validar a forma da resposta; mudanças na API do driver podem quebrar silenciosamente.
- Tipagem: assume que `result[0]` possui a shape esperada; não há verificação de erro/estatuto.
- Consistência: alguns repositórios podem preferir usar métodos nativos do driver para clareza e performance.

Proposta de correção

1. Avaliar se `db.get`/`db.select` (ou equivalente) atende aos casos de uso e substituir `queryOne` quando apropriado.
2. Se manter a helper, renomear para `fetchOne` e adicionar validações explícitas do formato de retorno, além de logging/erros claros quando a resposta não estiver no formato esperado.
3. Documentar contrato de retorno (por exemplo, sempre retornar `T | null`) e adicionar testes unitários que simulam respostas inválidas do driver.
4. Considerar expor métodos `queryMany`/`queryOne`/`execute` para tornar intenção clara.

Critérios de aceitação

- [ ] Decisão registrada (manter helper ou migrar para métodos nativos).
- [ ] Implementação e testes atualizados conforme decisão.

Relacionado

- apps/api/src/lib/db-helpers.ts
- apps/api/src/repositories/*.repository.ts
