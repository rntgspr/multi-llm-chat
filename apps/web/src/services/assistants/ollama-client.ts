import { getAssistant, modelsByAssistant } from './assistant-manager'

import type { AssistantId } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaChatResponse {
  message: { role: string; content: string }
  done: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  name: string
  content: string
}

// =============================================================================
// OLLAMA CLIENT
// =============================================================================

/**
 * Sends a message to an assistant and gets the response
 */
export async function sendToAssistant(
  assistantId: AssistantId,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> {
  const assistant = getAssistant(assistantId)
  if (!assistant) {
    throw new Error(`Assistant ${assistantId} not found`)
  }

  const model = modelsByAssistant.get(assistantId)
  if (!model) {
    throw new Error(`Model not configured for ${assistantId}`)
  }

  const url = `${assistant.endpoint}/api/chat`

  const systemPrompt = `You are ${assistant.name}. ${assistant.description}. 
Be helpful, concise, and friendly. Respond in the same language the user writes.`

  const messages: OllamaMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role,
      content: `${m.name}: ${m.content}`,
    })),
    { role: 'user' as const, content: userMessage },
  ]

  console.log(`[OllamaClient] Sending to ${assistant.name} at ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama error: ${response.status} - ${error}`)
  }

  const data: OllamaChatResponse = await response.json()
  console.log(`[OllamaClient] Got response from ${assistant.name}`)

  return data.message.content
}
