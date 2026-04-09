# Navegador Invisível — Epic Spec

**Status:** [DRAFT]  
**Sprint:** A definir  
**Prioridade:** Média  
**Data de criação:** 2026-04-07  
**Última atualização:** 2026-04-07

---

## 📋 Contexto

O Navigator (em `@multi-llm/interpretation`) decide qual assistente deve responder a uma mensagem do usuário. Atualmente, essa decisão aparece no chat como qualquer outra mensagem, poluindo a conversa. O comportamento desejado é que a navegação seja **invisível** para o usuário — exceto em modo debug.

---

## 🎯 Objetivo

Decisões do Navigator ficam ocultas por padrão. Em modo **debug** (feature flag), as decisões são exibidas com estilo diferenciado para fins de desenvolvimento.

---

## 📐 Escopo

### Inclui
- Mensagens do Navigator com `visibility: "hidden"` por padrão
- Feature flag `debug.showNavigatorDecisions` em `FeatureFlags`
- UI condicional: mostrar/ocultar decisões baseado na flag
- Estilo visual diferenciado para mensagens de debug
- Modo sequencial: bloquear input do usuário durante navegação

### Não inclui
- Painel de admin para feature flags (feature futura)
- Analytics sobre decisões do navegador
- Log persistente de decisões (usar logs de aplicação)

---

## 🔗 Tasks Vinculadas

> Tasks ainda não criadas. Serão definidas quando este épico entrar em sprint.

### Backend
- [ ] Setar `visibility: "hidden"` nas mensagens do Navigator
- [ ] Implementar feature flag `debug.showNavigatorDecisions`
- [ ] Modo sequencial: bloquear input durante navegação

### Frontend
- [ ] Filtrar mensagens hidden na renderização do chat
- [ ] Mostrar decisões quando debug flag ativa
- [ ] Estilo visual para mensagens de debug (cor, ícone, etc.)
- [ ] Estado "thinking" visível durante navegação

---

## 🤝 Contratos

- **WebSocket:** `.github/contracts/api/websocket.md` — Evento `assistant:thinking` já definido

---

## 📦 Dependências

### Depende de
- **EPIC-005** (Streaming) — fluxo de mensagens funcionando end-to-end

### Bloqueia
- UX limpa de conversação (sem decisões de roteamento visíveis)

---

## ✅ Critérios de Aceite (Nível Épico)

- [ ] Mensagens do Navigator não aparecem no chat por padrão
- [ ] Com flag `debug.showNavigatorDecisions = true`, decisões aparecem com estilo diferenciado
- [ ] Input do usuário bloqueado enquanto Navigator processa (modo sequencial)
- [ ] Indicador visual "pensando" durante navegação
- [ ] Feature flag configurável sem rebuild

---

## 📝 Notas

- `@multi-llm/types` já define `visibility: "all" | "hidden"` nas mensagens
- `@multi-llm/maintenance` já tem `FeatureFlags` implementado
