import { getAssistant, modelsByAssistant } from './registry'

import type { AssistantId, Message } from '@multi-llm/types'

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaStreamChunk {
  message: { role: string; content: string }
  done: boolean
}

/**
 * Extracts text content from a message
 */
function getMessageText(message: Message): string {
  return message.content
    .filter((c) => c.type === 'text')
    .map((c) => (c as { type: 'text'; text: string }).text)
    .join(' ')
}

/**
 * Converts messages to Ollama format
 */
function toOllamaMessages(messages: Message[]): OllamaMessage[] {
  return messages.map((m) => ({
    role: m.senderType === 'user' ? 'user' : 'assistant',
    content: getMessageText(m),
  }))
}

/**
 * Sends a message to an assistant with streaming response
 */
export async function streamResponse(
  assistantId: AssistantId,
  userMessage: string,
  context: Message[],
  onToken: (token: string) => void
): Promise<void> {
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
    ...toOllamaMessages(context),
    { role: 'user', content: userMessage },
  ]

  console.log(`[OllamaAdapter] Streaming from ${assistant.name} at ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama error: ${response.status} - ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(Boolean)

    for (const line of lines) {
      try {
        const data = JSON.parse(line) as OllamaStreamChunk
        if (data.message?.content) {
          onToken(data.message.content)
        }
      } catch {
        // Ignore parse errors for incomplete chunks
      }
    }
  }

  console.log(`[OllamaAdapter] Stream complete from ${assistant.name}`)
}

/**
 * Sends a message to an assistant and waits for complete response (non-streaming)
 */
export async function sendToAssistant(
  assistantId: AssistantId,
  userMessage: string,
  context: Message[] = []
): Promise<string> {
  const tokens: string[] = []

  await streamResponse(assistantId, userMessage, context, (token) => {
    tokens.push(token)
  })

  return tokens.join('')
}
