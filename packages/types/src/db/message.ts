export interface Message {
  id: string
  roomId: string
  userId: string
  content: string
  isHidden: boolean
  timestamp: Date
  metadata?: Record<string, unknown>
}

export type CreateMessageInput = Omit<Message, 'id' | 'timestamp'>
