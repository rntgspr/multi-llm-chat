import { listAssistants } from '../assistants/registry'
import { routeWithLLM } from './llm-router'
import { applyRules } from './routing-rules'

import type { AssistantId, Message, RoutingPlan } from '@multi-llm/types'

export interface ConversationContext {
  recentMessages: Message[]
  availableAssistants: AssistantId[]
  roomId: string
}

export interface NavigatorOptions {
  useLLM?: boolean
  fallbackAssistant?: AssistantId
}

const DEFAULT_OPTIONS: NavigatorOptions = {
  useLLM: true,
  fallbackAssistant: 'general-assistant',
}

/**
 * Navigator decides which assistant(s) should respond to a message.
 * It can use rules-based routing or LLM-based routing.
 */
export class Navigator {
  private options: NavigatorOptions

  constructor(options: NavigatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Determines which assistant(s) should handle a message
   */
  async route(message: Message, context: ConversationContext): Promise<RoutingPlan> {
    // First, try rules-based routing
    const rulesResult = applyRules(message, context)
    if (rulesResult) {
      return rulesResult
    }

    // If rules don't match and LLM is enabled, use LLM routing
    if (this.options.useLLM) {
      try {
        return await routeWithLLM(message, context)
      } catch (error) {
        console.error('[Navigator] LLM routing failed:', error)
      }
    }

    // Fallback to first available assistant in the room
    const fallback = context.availableAssistants[0] || this.options.fallbackAssistant!
    return {
      assistants: [fallback],
      reasoning: 'Fallback to default assistant',
      shouldBlock: true,
    }
  }
}

// Singleton instance
export const navigator = new Navigator()

// Re-export for convenience
export { listAssistants }
