export interface Invite {
  id: string
  code: string
  roomId: string
  expiresAt: Date
  usedBy?: string // User ID
  createdAt: Date
}

export type CreateInviteInput = Omit<Invite, 'id' | 'createdAt' | 'usedBy'>
