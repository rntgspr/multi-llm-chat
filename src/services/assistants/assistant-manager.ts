import type { Assistant, AssistantId, AssistantStatus } from '@/types'

// =============================================================================
// ASSISTANT CONFIGURATION (Ollama)
// =============================================================================

const assistants = new Map<AssistantId, Assistant>()

/**
 * Assistants configured to connect to Ollama containers
 */
const assistantConfig: (Assistant & { model: string })[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'General purpose assistant (Llama 3.2)',
    avatarUrl: '/avatars/general-assistant.png',
    endpoint: 'http://localhost:11434',
    model: 'llama3.2',
    status: 'online',
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'Programming specialist (CodeLlama)',
    avatarUrl: '/avatars/code-assistant.png',
    endpoint: 'http://localhost:11435',
    model: 'codellama:7b',
    status: 'online',
  },
  {
    id: 'creative-assistant',
    name: 'Creative Assistant',
    description: 'Creative writing and brainstorming',
    avatarUrl: '/avatars/creative-assistant.png',
    endpoint: 'http://localhost:11436',
    model: 'llama3.2',
    status: 'online',
  },
]

// Model map per assistant (for Ollama client)
export const modelsByAssistant = new Map<AssistantId, string>()

// Initialize assistants
assistantConfig.forEach((a) => {
  const { model, ...assistant } = a
  assistants.set(assistant.id, assistant)
  modelsByAssistant.set(assistant.id, model)
})

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Lists all available assistants
 */
export function listAssistants(): Assistant[] {
  return Array.from(assistants.values())
}

/**
 * Lists only online assistants
 */
export function listOnlineAssistants(): Assistant[] {
  return Array.from(assistants.values()).filter((a) => a.status === 'online')
}

/**
 * Gets an assistant by ID
 */
export function getAssistant(assistantId: AssistantId): Assistant | undefined {
  return assistants.get(assistantId)
}

/**
 * Updates assistant status
 */
export function updateAssistantStatus(
  assistantId: AssistantId,
  status: AssistantStatus
): boolean {
  const assistant = assistants.get(assistantId)
  if (!assistant) return false

  assistant.status = status
  return true
}

/**
 * Registers a new assistant
 */
export function registerAssistant(assistant: Assistant): void {
  assistants.set(assistant.id, assistant)
}

/**
 * Removes an assistant
 */
export function removeAssistant(assistantId: AssistantId): boolean {
  return assistants.delete(assistantId)
}

/**
 * Checks if an assistant is available
 */
export function isAssistantAvailable(assistantId: AssistantId): boolean {
  const assistant = assistants.get(assistantId)
  return assistant?.status === 'online'
}
