# Especificação: Cleanup de WebSocket Duplicado

**Change**: `websocket-cleanup`  
**Criado**: 2026-04-21  
**Status**: Proposta  
**Epic Relacionado**: EPIC-002 - Separação da API

## Contexto

Durante o EPIC-002, o servidor WebSocket foi **implementado** em `apps/api`, mas o código original em `apps/web` **não foi removido**, resultando em duplicação e possível confusão.

## Objetivo

Remover completamente o código duplicado de WebSocket de `apps/web`, deixando apenas a implementação em `apps/api`.

## Escopo

### ✅ Incluído

1. **Remover arquivos duplicados em apps/web:**
   - `apps/web/src/services/websocket/` (pasta inteira)
   - `apps/web/src/hooks/use-websocket.ts` (se não usado mais)

2. **Atualizar imports:**
   - Verificar se algum código em `apps/web` ainda referencia os arquivos removidos
   - Atualizar para usar cliente WebSocket que conecta em `apps/api`

3. **Validação:**
   - Garantir que a comunicação WebSocket funciona corretamente após remoção
   - Testar conexão, envio e recebimento de mensagens

### ❌ Não Incluído

- Mudanças na implementação do WebSocket em `apps/api`
- Novas features ou melhorias de WebSocket
- Mudanças em outras partes não relacionadas ao WebSocket

## Arquivos Afetados

```
apps/web/src/
├── services/websocket/     [REMOVER]
└── hooks/use-websocket.ts  [REVISAR/REMOVER]
```

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Quebrar comunicação real-time | Testar completamente antes de commit |
| Código esquecido referenciando os arquivos removidos | TypeScript vai falhar na compilação |

## Critérios de Aceitação

1. ✅ Nenhum arquivo de WebSocket em `apps/web/src/services/websocket/`
2. ✅ Nenhum import quebrado em `apps/web`
3. ✅ `pnpm typecheck` passa sem erros
4. ✅ Comunicação WebSocket funciona normalmente
5. ✅ Cliente em `apps/web` conecta corretamente em `apps/api:4000`

## Notas Técnicas

- Esta é a conclusão do EPIC-002
- O WebSocket em `apps/api` já está funcionando
- Esta change é apenas limpeza/remoção de código morto
