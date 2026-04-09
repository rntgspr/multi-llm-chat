import { listAssistants } from '@multi-llm/interpretation'

import type { AssistantId } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

export interface OrchestratorMessage {
  id: string
  roomId: string
  content: string
  authorId: string
  authorType: 'user' | 'assistant'
  authorName: string
  createdAt: Date
}

export interface RoutingDecision {
  assistants: AssistantId[]
  reasoning: string
}

// =============================================================================
// OLLAMA CLIENT
// =============================================================================

const ORCHESTRATOR_URL = process.env.OLLAMA_ORCHESTRATOR_URL || 'http://localhost:11430'
const ORCHESTRATOR_MODEL = 'llama3.2'

interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OllamaChatResponse {
  message: { role: string; content: string }
  done: boolean
}

async function sendToOllama(messages: OllamaMessage[]): Promise<string> {
  const url = `${ORCHESTRATOR_URL}/api/chat`

  console.log(`[Orchestrator] Asking LLM at ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: ORCHESTRATOR_MODEL, messages, stream: false }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama error: ${response.status} - ${error}`)
  }

  const data: OllamaChatResponse = await response.json()
  return data.message.content
}

// =============================================================================
// ORCHESTRATOR - Decides which assistant should respond
// =============================================================================

/**
 * Asks the orchestrator LLM which assistant(s) should handle this message
 */
export async function decideRouting(
  message: OrchestratorMessage,
  availableAssistants: AssistantId[],
  recentMessages: OrchestratorMessage[]
): Promise<RoutingDecision> {
  const assistants = await listAssistants()
  const assistantDescriptions = availableAssistants
    .map((id) => {
      const a = assistants.find((x) => x.id === id)
      return a ? `- ${a.id}: ${a.description}` : null
    })
    .filter(Boolean)
    .join('\n')

  const contextSummary = recentMessages
    .slice(-5)
    .map((m) => `${m.authorName}: ${m.content.slice(0, 100)}`)
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

New message from ${message.authorName}:
"${message.content}"

Which assistant should respond? JSON only.`

  try {
    const response = await sendToOllama([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    console.log(`[Orchestrator] LLM response: ${response}`)

    // Parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.log('[Orchestrator] No JSON found, defaulting to general-assistant')
      return { assistants: ['general-assistant'], reasoning: 'Failed to parse response' }
    }

    const decision = JSON.parse(jsonMatch[0]) as RoutingDecision

    // Filter to only available assistants
    decision.assistants = decision.assistants.filter((id) => availableAssistants.includes(id))

    if (decision.assistants.length === 0) {
      decision.assistants = ['general-assistant']
    }

    console.log(`[Orchestrator] Decision: ${decision.assistants.join(', ')} - ${decision.reasoning}`)
    return decision
  } catch (error) {
    console.error('[Orchestrator] Error:', error)
    return { assistants: ['general-assistant'], reasoning: 'Routing failed, using fallback' }
  }
}
