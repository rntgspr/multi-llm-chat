import { listAssistants } from '../assistants/registry'

import type { Message, RoutingPlan } from '@multi-llm/types'
import type { ConversationContext } from './navigator'

const NAVIGATOR_URL = process.env.OLLAMA_NAVIGATOR_URL || 'http://localhost:11430'
const NAVIGATOR_MODEL = process.env.OLLAMA_NAVIGATOR_MODEL || 'llama3.2'

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaChatResponse {
  message: { role: string; content: string }
  done: boolean
}

/**
 * Sends a message to the Navigator LLM
 */
async function sendToLLM(messages: OllamaMessage[]): Promise<string> {
  const url = `${NAVIGATOR_URL}/api/chat`

  console.log(`[Navigator] Asking LLM at ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: NAVIGATOR_MODEL, messages, stream: false }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama error: ${response.status} - ${error}`)
  }

  const data = (await response.json()) as OllamaChatResponse
  return data.message.content
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
 * Uses an LLM to decide which assistant should respond
 */
export async function routeWithLLM(message: Message, context: ConversationContext): Promise<RoutingPlan> {
  const assistants = listAssistants()
  const assistantDescriptions = context.availableAssistants
    .map((id) => {
      const a = assistants.find((x) => x.id === id)
      return a ? `- ${a.id}: ${a.description}` : null
    })
    .filter(Boolean)
    .join('\n')

  const contextSummary = context.recentMessages
    .slice(-5)
    .map((m) => `${m.senderType}: ${getMessageText(m).slice(0, 100)}`)
    .join('\n')

  const systemPrompt = `You are a routing assistant. Analyze user messages and decide which specialist should respond.

Available assistants:
${assistantDescriptions}

Rules:
1. Respond ONLY with JSON, no other text
2. Choose 1 assistant (or 2 maximum if truly needed)
3. If ambiguous or general, choose "general-assistant"
4. Code/programming/technical topics → "code-assistant"
5. Creative content/stories/brainstorming → "creative-assistant"

Response format: {"assistants": ["assistant-id"], "reasoning": "brief explanation"}`

  const userPrompt = `Recent conversation:
${contextSummary || '(none)'}

New message:
"${getMessageText(message)}"

Which assistant should respond? JSON only.`

  try {
    const response = await sendToLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    console.log(`[Navigator] LLM response: ${response}`)

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      const fallback = context.availableAssistants[0] || 'general-assistant'
      console.log(`[Navigator] No JSON found, defaulting to ${fallback}`)
      return {
        assistants: [fallback],
        reasoning: 'Failed to parse LLM response',
        shouldBlock: true,
      }
    }

    const decision = JSON.parse(jsonMatch[0]) as { assistants: string[]; reasoning: string }

    // Filter to only available assistants
    const validAssistants = decision.assistants.filter((id) => context.availableAssistants.includes(id))

    // Fallback to first available assistant if none match
    if (validAssistants.length === 0) {
      const firstAvailable = context.availableAssistants[0]
      if (firstAvailable) {
        validAssistants.push(firstAvailable)
      }
    }

    console.log(`[Navigator] Decision: ${validAssistants.join(', ')} - ${decision.reasoning}`)

    return {
      assistants: validAssistants,
      reasoning: decision.reasoning,
      shouldBlock: true,
    }
  } catch (error) {
    console.error('[Navigator] LLM error:', error)
    // Fallback to first available assistant
    const fallback = context.availableAssistants[0] || 'general-assistant'
    return {
      assistants: [fallback],
      reasoning: 'LLM routing failed, using fallback',
      shouldBlock: true,
    }
  }
}
