import { assistantRepository } from '@multi-llm/db/repositories'

import type { Assistant, AssistantId, AssistantStatus } from '@multi-llm/types'

interface AssistantConfig {
  id: string
  name: string
  description: string
  avatarUrl?: string
  endpoint: string
  model: string
  status: AssistantStatus
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
async function initializeAssistants() {
  try {
    for (const config of defaultAssistants) {
      const { model, ...assistantData } = config
      modelsByAssistant.set(config.id, model)

      const existing = await assistantRepository.findById(config.id)
      if (!existing) {
        await assistantRepository.create(assistantData)
      }
    }
  } catch (error) {
    console.error('[AssistantRegistry] Failed to initialize assistants:', error)
  }
}

// Initialize on module load
initializeAssistants().catch(console.error)

/**
 * Lists all registered assistants
 */
export async function listAssistants(): Promise<Assistant[]> {
  try {
    return await assistantRepository.findAll()
  } catch (error) {
    console.error('[AssistantRegistry] Failed to list assistants:', error)
    return []
  }
}

/**
 * Lists only online assistants
 */
export async function listOnlineAssistants(): Promise<Assistant[]> {
  try {
    const all = await assistantRepository.findAll()
    return all.filter((a) => a.status === 'online')
  } catch (error) {
    console.error('[AssistantRegistry] Failed to list online assistants:', error)
    return []
  }
}

/**
 * Gets an assistant by ID
 */
export async function getAssistant(assistantId: AssistantId): Promise<Assistant | undefined> {
  try {
    const assistant = await assistantRepository.findById(assistantId)
    return assistant ?? undefined
  } catch (error) {
    console.error('[AssistantRegistry] Failed to get assistant:', error)
    return undefined
  }
}

/**
 * Updates assistant status
 */
export async function updateAssistantStatus(assistantId: AssistantId, status: AssistantStatus): Promise<boolean> {
  try {
    await assistantRepository.update(assistantId, { status })
    return true
  } catch (error) {
    console.error('[AssistantRegistry] Failed to update status:', error)
    return false
  }
}

/**
 * Registers a new assistant
 */
export async function registerAssistant(
  assistant: Omit<Assistant, 'id'> & { id: string },
  model?: string
): Promise<void> {
  try {
    await assistantRepository.create(assistant)
    if (model) {
      modelsByAssistant.set(assistant.id, model)
    }
  } catch (error) {
    console.error('[AssistantRegistry] Failed to register assistant:', error)
    throw error
  }
}

/**
 * Removes an assistant
 */
export async function removeAssistant(assistantId: AssistantId): Promise<boolean> {
  try {
    modelsByAssistant.delete(assistantId)
    await assistantRepository.delete(assistantId)
    return true
  } catch (error) {
    console.error('[AssistantRegistry] Failed to remove assistant:', error)
    return false
  }
}

/**
 * Checks if an assistant is available
 */
export async function isAssistantAvailable(assistantId: AssistantId): Promise<boolean> {
  try {
    const assistant = await assistantRepository.findById(assistantId)
    return assistant?.status === 'online'
  } catch (error) {
    console.error('[AssistantRegistry] Failed to check availability:', error)
    return false
  }
}
