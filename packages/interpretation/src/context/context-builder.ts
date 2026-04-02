import type { AssistantId, Message, RoomId } from '@multi-llm/types'

interface ContextOptions {
  maxMessages?: number
  includeHidden?: boolean
}

const DEFAULT_OPTIONS: ContextOptions = {
  maxMessages: 50,
  includeHidden: false,
}

/**
 * Builds conversation context for an assistant.
 * Prepares messages in the right format for LLM consumption.
 */
export class ContextBuilder {
  private options: ContextOptions

  constructor(options: ContextOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  /**
   * Builds context from a list of messages
   */
  build(messages: Message[], assistantId?: AssistantId): Message[] {
    let filtered = messages

    // Filter hidden messages if not including them
    if (!this.options.includeHidden) {
      filtered = filtered.filter((m) => m.visibility === 'public')
    } else if (assistantId) {
      // Include hidden messages only for the target assistant
      filtered = filtered.filter((m) => m.visibility === 'public' || m.recipientId === assistantId || !m.recipientId)
    }

    // Sort by creation time
    filtered = filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

    // Limit to max messages (take most recent)
    if (this.options.maxMessages && filtered.length > this.options.maxMessages) {
      filtered = filtered.slice(-this.options.maxMessages)
    }

    return filtered
  }

  /**
   * Builds a text summary of the context
   */
  summarize(messages: Message[]): string {
    return messages
      .map((m) => {
        const sender = m.senderType === 'user' ? 'User' : m.senderId
        const text = m.content
          .filter((c) => c.type === 'text')
          .map((c) => (c as { type: 'text'; text: string }).text)
          .join(' ')
        return `${sender}: ${text}`
      })
      .join('\n')
  }
}

// Singleton instance
export const contextBuilder = new ContextBuilder()
