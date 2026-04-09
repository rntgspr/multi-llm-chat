export interface Assistant {
  id: string
  name: string
  model: string
  provider: 'ollama' | 'openai' | 'anthropic'
  config: Record<string, unknown>
  createdAt: Date
}

export type CreateAssistantInput = Omit<Assistant, 'id' | 'createdAt'>
export type UpdateAssistantInput = Partial<Omit<Assistant, 'id' | 'createdAt'>>
