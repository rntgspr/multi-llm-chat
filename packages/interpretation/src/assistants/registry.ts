import type { Assistant, AssistantId, AssistantStatus } from '@multi-llm/types'

const assistants = new Map<AssistantId, Assistant>()

interface AssistantConfig extends Assistant {
  model: string
}

/**
 * Default assistant configurations
 */
const defaultAssistants: AssistantConfig[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'General purpose assistant for any topic',
    avatarUrl: '/avatars/general-assistant.png',
    endpoint: process.env.OLLAMA_GENERAL_URL || 'http://localhost:11434',
    model: 'llama3.2',
    status: 'online',
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'Programming specialist for code review, debugging, and development',
    avatarUrl: '/avatars/code-assistant.png',
    endpoint: process.env.OLLAMA_CODE_URL || 'http://localhost:11435',
    model: 'codellama:7b',
    status: 'online',
  },
  {
    id: 'creative-assistant',
    name: 'Creative Assistant',
    description: 'Creative writing, brainstorming, and storytelling',
    avatarUrl: '/avatars/creative-assistant.png',
    endpoint: process.env.OLLAMA_CREATIVE_URL || 'http://localhost:11436',
    model: 'llama3.2',
    status: 'online',
  },
]

// Model map per assistant (for Ollama adapter)
export const modelsByAssistant = new Map<AssistantId, string>()

// Initialize with defaults
defaultAssistants.forEach((config) => {
  const { model, ...assistant } = config
  assistants.set(assistant.id, assistant)
  modelsByAssistant.set(assistant.id, model)
})

/**
 * Lists all registered assistants
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
export function updateAssistantStatus(assistantId: AssistantId, status: AssistantStatus): boolean {
  const assistant = assistants.get(assistantId)
  if (!assistant) return false

  assistant.status = status
  return true
}

/**
 * Registers a new assistant
 */
export function registerAssistant(assistant: Assistant, model?: string): void {
  assistants.set(assistant.id, assistant)
  if (model) {
    modelsByAssistant.set(assistant.id, model)
  }
}

/**
 * Removes an assistant
 */
export function removeAssistant(assistantId: AssistantId): boolean {
  modelsByAssistant.delete(assistantId)
  return assistants.delete(assistantId)
}

/**
 * Checks if an assistant is available
 */
export function isAssistantAvailable(assistantId: AssistantId): boolean {
  const assistant = assistants.get(assistantId)
  return assistant?.status === 'online'
}
