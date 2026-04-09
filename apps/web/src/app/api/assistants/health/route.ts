import { listAssistants, updateAssistantStatus } from '@multi-llm/interpretation'
import { NextResponse } from 'next/server'

import type { AssistantId, AssistantStatus } from '@multi-llm/types'

interface AssistantHealth {
  id: AssistantId
  status: AssistantStatus
  hasModel: boolean
}

/**
 * Checks if an Ollama instance is healthy and has at least one model
 */
async function checkOllamaHealth(endpoint: string): Promise<{ online: boolean; hasModel: boolean }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${endpoint}/api/tags`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return { online: false, hasModel: false }
    }

    const data = (await response.json()) as { models?: Array<{ name: string }> }
    const hasModel = Array.isArray(data.models) && data.models.length > 0

    return { online: true, hasModel }
  } catch {
    return { online: false, hasModel: false }
  }
}

/**
 * GET /api/assistants/health - Checks health of all assistants
 */
export async function GET() {
  const assistants = await listAssistants()

  const healthChecks = await Promise.all(
    assistants.map(async (assistant): Promise<AssistantHealth> => {
      const { online, hasModel } = await checkOllamaHealth(assistant.endpoint)

      const status: AssistantStatus = online && hasModel ? 'online' : 'offline'
      updateAssistantStatus(assistant.id, status)

      return {
        id: assistant.id,
        status,
        hasModel,
      }
    })
  )

  const healthMap = Object.fromEntries(healthChecks.map((h) => [h.id, h]))

  return NextResponse.json({ health: healthMap })
}
