export interface Room {
  id: string
  name: string
  participants: string[] // User IDs
  assistants: string[] // Assistant IDs
  createdBy: string // User ID
  createdAt: Date
  updatedAt?: Date
}

export type CreateRoomInput = Omit<Room, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateRoomInput = Partial<Omit<Room, 'id' | 'createdAt' | 'createdBy'>>
