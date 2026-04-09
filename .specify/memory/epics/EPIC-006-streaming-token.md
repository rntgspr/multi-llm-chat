# Streaming Token-por-Token — Epic Spec

**Status:** [DRAFT]  
**Sprint:** A definir  
**Prioridade:** Alta  
**Data de criação:** 2026-04-07  
**Última atualização:** 2026-04-07

---

## 📋 Contexto

O fluxo de streaming existe parcialmente: `StreamHandler` está implementado no package `@multi-llm/interaction`, e o `OllamaAdapter` em `@multi-llm/interpretation` comunica com os containers Ollama. Porém, o pipeline end-to-end de streaming token-por-token (estilo ChatGPT) não está conectado.

Atualmente, respostas dos assistentes chegam como bloco completo, sem feedback incremental para o usuário.

---

## 🎯 Objetivo

Quando um assistente responde, o usuário vê os tokens aparecendo progressivamente na tela em tempo real, via WebSocket, usando os eventos `message:streaming` e `message:complete` do contrato existente.

---

## 📐 Escopo

### Inclui
- Implementar `streamResponse()` no `OllamaAdapter` (Ollama API streaming)
- Conectar `StreamHandler` ↔ `OllamaAdapter` ↔ `MessageBus`
- Emitir eventos `message:streaming` via WebSocket a cada token
- Emitir `message:complete` ao final da stream
- Componente de chat renderiza tokens incrementalmente

### Não inclui
- Streaming para provedores não-Ollama (será parte do EPIC Multi-LLM)
- Cancel/abort de streams em andamento (feature futura)
- Rate limiting de tokens (feature futura)

---

## 🔗 Tasks Vinculadas

> Tasks ainda não criadas. Serão definidas quando este épico entrar em sprint.

### Backend
- [ ] Implementar streaming na Ollama API (`ollama-adapter.ts`)
- [ ] Conectar StreamHandler com MessageBus
- [ ] Emitir eventos WebSocket de streaming

### Frontend
- [ ] Renderizar tokens incrementais no componente de chat
- [ ] Estado visual de "assistente digitando"

---

## 🤝 Contratos

- **WebSocket:** `.github/contracts/api/websocket.md` — Eventos `message:streaming` e `message:complete` já definidos

---

## 📦 Dependências

### Depende de
- **EPIC-002** (Separação API) — WebSocket em `apps/api`

### Bloqueia
- UX de qualidade nas respostas de assistentes
- Features de cancel/abort

---

## ✅ Critérios de Aceite (Nível Épico)

- [ ] Resposta do assistente aparece token-por-token no chat
- [ ] Eventos `message:streaming` emitidos via WebSocket durante geração
- [ ] Evento `message:complete` emitido ao final
- [ ] Mensagem completa é persistida no banco após conclusão
- [ ] Indicador visual "assistente digitando" visível durante stream

---

## 📝 Notas

- O exemplo de ciclo SDD em `.github/sdd/EXEMPLO-CICLO.md` usa esta feature como caso de estudo
- Referência de streaming Ollama API: `POST /api/generate` com `stream: true`
