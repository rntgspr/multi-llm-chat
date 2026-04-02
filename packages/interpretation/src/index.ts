/**
 * @multi-llm/interpretation
 *
 * Camada de Interpretação - Navigator, assistentes, contexto
 */

export { sendToAssistant, streamResponse } from './assistants/ollama-adapter'
// Assistants
export {
  getAssistant,
  isAssistantAvailable,
  listAssistants,
  listOnlineAssistants,
  modelsByAssistant,
  registerAssistant,
  removeAssistant,
  updateAssistantStatus,
} from './assistants/registry'
// Context
export { ContextBuilder, contextBuilder } from './context/context-builder'
export { routeWithLLM } from './navigator/llm-router'
// Navigator
export { Navigator, navigator } from './navigator/navigator'
export { applyRules, getRules, registerRule } from './navigator/routing-rules'

export type { ConversationContext, NavigatorOptions } from './navigator/navigator'
